import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import mysql from 'mysql2/promise';
const local = path.resolve('local');
const configPath = path.join(local, 'config.json');
const database = 'academy_test_antigravity_demo_v1';
const command = process.argv[2];
async function rootConnection() {
  const c = await mysql.createConnection({host:'127.0.0.1',port:33139,user:'root'});
  const [[row]] = await c.query('SELECT @@datadir AS directory');
  if (path.resolve(row.directory).toLowerCase() !== path.join(local,'mysql').toLowerCase()) {
    await c.end(); throw Error('Database ownership check failed. No changes made.');
  }
  return c;
}
let config;
try { config = JSON.parse(await fs.readFile(configPath,'utf8')); }
catch (e) { if (e.code !== 'ENOENT') throw e; }
if (command === 'setup') {
  const c = await rootConnection();
  try {
    if (!config) {
      const [existing] = await c.query('SHOW DATABASES LIKE ?', [database]);
      if (existing.length) throw Error('Unrecognized existing demo database; refusing to overwrite.');
      config = {id:randomUUID(), control:randomBytes(32).toString('hex'), password:randomBytes(24).toString('hex'), login:randomBytes(18).toString('base64url'), ready:false};
      await fs.writeFile(configPath, JSON.stringify(config,null,2), {flag:'wx'});
      await c.query('CREATE DATABASE ' + database + ' CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
      await c.query("CREATE USER 'academy_ag_demo'@'127.0.0.1' IDENTIFIED BY ?", [config.password]);
      await c.query("GRANT ALL ON " + database + ".* TO 'academy_ag_demo'@'127.0.0.1'");
    }
  } finally { await c.end(); }
}
if (!config) throw Error('Run START-LOCAL.cmd first.');
Object.assign(process.env, {ACADEMY_ENV:'test',DB_HOST:'127.0.0.1',DB_PORT:'33139',DB_NAME:database,DB_USER:'academy_ag_demo',DB_PASSWORD:config.password,ACADEMY_SECURE_COOKIES:'0',NODE_ENV:'development'});
if (command === 'setup') {
  if (!config.ready) {
    const result = spawnSync(process.execPath,['dist/src/cli.js','migrate'], {env:{...process.env,ACADEMY_ALLOW_SETUP:'1'},stdio:'inherit'});
    if (result.status !== 0) throw Error('Explicit local migration failed; data retained for review.');
    const {createStore} = await import('../dist/src/db.js');
    const {hashPassword} = await import('../dist/src/security.js');
    const store = createStore();
    try {
      await store.transaction(async c => {
        const [users] = await c.query('SELECT id FROM users LIMIT 1');
        if (users.length) throw Error('Incomplete setup found; refusing to overwrite users.');
        const h = await hashPassword(config.login), now = new Date().toISOString();
        await c.query("INSERT INTO branches(name) VALUES ('DEMO Academy')");
        for (const [email,name,role] of [['admin','DEMO Admin','central_admin'],['teacher','DEMO Teacher','teacher'],['zimmadar','DEMO Zimmadar','zimmadar'],['guardian','DEMO Guardian','guardian_primary']])
          await c.query('INSERT INTO users(email,name,role,branch_id,password_salt,password_hash,created_at) VALUES (?,?,?,?,?,?,?)',[email+'@academy.test',name,role,1,h.salt,h.hash,now]);
        await c.query("INSERT INTO families(name,branch_id) VALUES ('DEMO Family',1)");
        await c.query('INSERT INTO family_guardians VALUES (1,4)');
        await c.query("INSERT INTO students(full_name,branch_id,family_id,created_at) VALUES ('DEMO Learner',1,1,?)",[now]);
        await c.query("INSERT INTO departments(branch_id,name,category) VALUES (1,'DEMO Regular','regular')");
        await c.query("INSERT INTO courses(department_id,title,duration_type) VALUES (1,'DEMO Quran','continuous')");
        await c.query("INSERT INTO batches(course_id,label,delivery_mode,zimmadar_id,teacher_id) VALUES (1,'DEMO Batch','group',3,2)");
        const start = new Date(Date.now()-30*86400000).toISOString().slice(0,10);
        await c.query('INSERT INTO enrollments(student_id,batch_id,start_date) VALUES (1,1,?)',[start]);
        for (let i=8;i>=1;i--) {
          const d = new Date(Date.now()-i*86400000).toISOString().slice(0,10);
          const [r] = await c.query("INSERT INTO class_sessions(batch_id,scheduled_start,scheduled_end,actual_start,actual_end,status,held_verified,actual_teacher_id) VALUES (1,?,?,?,?,'ended',1,2)",[d+'T09:00:00+06:00',d+'T10:00:00+06:00',d+'T09:00:00+06:00',d+'T10:00:00+06:00']);
          await c.query("INSERT INTO attendance(class_id,enrollment_id,status,verified_by,verified_at) VALUES (?,1,'Absent',2,?)",[r.insertId,now]);
        }
      });
    } finally { await store.pool.end(); }
    config.ready = true;
    await fs.writeFile(configPath, JSON.stringify(config,null,2));
    await fs.writeFile(path.join(local,'LOCAL-LOGIN.txt'), 'LOCAL DEMO ONLY — NOT HOSTING CREDENTIALS\nhttp://127.0.0.1:3020\n\nAccounts:\nadmin@academy.test\nteacher@academy.test\nzimmadar@academy.test\nguardian@academy.test\n\nPassword for these demo accounts: '+config.login+'\n\nKeep this file private. All records are synthetic.\n');
  }
  const {createStore} = await import('../dist/src/db.js');
  const {processFollowups} = await import('../dist/src/followup-worker.js');
  const store = createStore();
  try {
    let after = 0;
    do { after = (await processFollowups(store,new Date(),after)).next_after; } while(after);
  } finally { await store.pool.end(); }
  console.log('Local demo database ready; private login file saved.');
} else if (command === 'serve') {
  if (!config.ready) throw Error('Local setup incomplete.');
  const {createStore} = await import('../dist/src/db.js');
  const {createApp} = await import('../dist/src/app.js');
  const {default:express} = await import('express');
  const store = createStore(), app = express();
  app.get('/__local__/identity',(_req,res)=>res.json({id:config.id}));
  let server;
  app.post('/__local__/stop',(req,res)=>{
    const value = Buffer.from(req.headers['x-local-control'] || '');
    const expected = Buffer.from(config.control);
    if (value.length !== expected.length || !timingSafeEqual(value,expected)) return res.sendStatus(403);
    res.json({stopped:true});
    server.close(()=>void store.pool.end().then(()=>process.exit(0)));
  });
  const annJsonPath = path.join(local, 'ANNOTATIONS.json');
  const annMdPath = path.join(local, 'ANNOTATIONS.md');
  async function readAnnotations() {
    try { return JSON.parse(await fs.readFile(annJsonPath, 'utf8')); }
    catch (e) { if (e.code === 'ENOENT') return []; throw e; }
  }
  async function writeAnnotations(items) {
    await fs.writeFile(annJsonPath, JSON.stringify(items, null, 2), 'utf8');
    const lines = ['# Local UI Annotations (Dev Feedback)', '', `Updated: ${new Date().toISOString()}`, ''];
    if (!items.length) lines.push('_No annotations yet._');
    for (const a of items) {
      lines.push(`## Pin #${a.pinNumber} — ${a.panelTitle} [${a.category || 'Note'}] (${a.status || 'open'})`);
      lines.push(`- **ID:** \`${a.id}\` | **Created:** ${a.createdAt}`);
      if (a.userText) lines.push(`- **User:** ${a.userText}`);
      if (a.activeNav) lines.push(`- **Nav:** ${a.activeNav}`);
      lines.push(`- **Element:** \`${a.selector}\`${a.elementText ? ` — "${a.elementText}"` : ''}`);
      lines.push(`- **Viewport:** ${a.viewport} | **ScrollY:** ${a.scrollY}`);
      lines.push(`- **Note:** ${a.note}`);
      lines.push('');
    }
    await fs.writeFile(annMdPath, lines.join('\n'), 'utf8');
  }
  app.get('/__local__/annotate.js', (_req, res) => {
    res.type('application/javascript').sendFile(path.resolve('tools/local-annotate.js'));
  });
  app.get('/__local__/annotations', async (_req, res, next) => {
    try { res.json(await readAnnotations()); } catch (e) { next(e); }
  });
  app.post('/__local__/annotations', express.json(), async (req, res, next) => {
    try {
      const items = await readAnnotations();
      const nextNum = items.reduce((m, x) => Math.max(m, Number(x.pinNumber) || 0), 0) + 1;
      const body = req.body || {};
      const entry = {
        id: randomUUID(),
        pinNumber: nextNum,
        createdAt: new Date().toISOString(),
        status: 'open',
        category: String(body.category || 'UI / Design').slice(0, 40),
        panelTitle: String(body.panelTitle || 'Dashboard').slice(0, 120),
        activeNav: String(body.activeNav || '').slice(0, 120),
        userText: String(body.userText || '').slice(0, 120),
        selector: String(body.selector || '').slice(0, 300),
        tagName: String(body.tagName || '').slice(0, 40),
        elementText: String(body.elementText || '').slice(0, 200),
        viewport: String(body.viewport || '').slice(0, 40),
        scrollY: Number(body.scrollY) || 0,
        rect: body.rect || null,
        clickPoint: body.clickPoint || null,
        note: String(body.note || '').trim().slice(0, 2000),
      };
      if (!entry.note) return res.status(400).json({ error: 'Note is required' });
      items.push(entry);
      await writeAnnotations(items);
      res.status(201).json(entry);
    } catch (e) { next(e); }
  });
  app.patch('/__local__/annotations/:id', express.json(), async (req, res, next) => {
    try {
      const items = await readAnnotations();
      const item = items.find(x => x.id === req.params.id);
      if (!item) return res.sendStatus(404);
      if (typeof req.body?.note === 'string' && req.body.note.trim()) item.note = req.body.note.trim().slice(0, 2000);
      if (typeof req.body?.category === 'string') item.category = req.body.category.slice(0, 40);
      if (typeof req.body?.status === 'string') item.status = req.body.status.slice(0, 20);
      item.updatedAt = new Date().toISOString();
      await writeAnnotations(items);
      res.json(item);
    } catch (e) { next(e); }
  });
  app.delete('/__local__/annotations/:id', async (req, res, next) => {
    try {
      const items = await readAnnotations();
      const filtered = items.filter(x => x.id !== req.params.id);
      if (filtered.length === items.length) return res.sendStatus(404);
      await writeAnnotations(filtered);
      res.json({ deleted: true });
    } catch (e) { next(e); }
  });
  app.get('/', async (_req, res, next) => {
    try {
      const html = await fs.readFile(path.resolve('frontend/index.html'), 'utf8');
      res.type('html').send(html.replace('</body>', '<script src="/__local__/annotate.js" defer></script></body>'));
    } catch (e) { next(e); }
  });
  app.use(createApp(store,{secureCookies:false}));
  await store.read(c=>c.query('SELECT 1 FROM users LIMIT 1'));
  const host = process.env.ACADEMY_HOST || '0.0.0.0';
  server = app.listen(3020, host, () => {
    console.log('Local demo listening on http://127.0.0.1:3020');
    try {
      const nets = os.networkInterfaces();
      for (const n of Object.keys(nets)) {
        for (const net of nets[n] || []) {
          if (net.family === 'IPv4' && !net.internal) {
            console.log(`Mobile / LAN URL: http://${net.address}:3020`);
          }
        }
      }
    } catch {}
  });
} else if (command === 'stop') {
  try {
    const identity = await fetch('http://127.0.0.1:3020/__local__/identity').then(r=>r.json());
    if (identity.id !== config.id) throw Error('App ownership mismatch.');
    const response = await fetch('http://127.0.0.1:3020/__local__/stop',{method:'POST',headers:{'x-local-control':config.control}});
    if (!response.ok) throw Error('App stop refused.');
  } catch(e) { if (e.cause?.code !== 'ECONNREFUSED') throw e; }
  try { const c = await rootConnection(); await c.query('SHUTDOWN'); await c.end(); }
  catch(e) { if (!['ECONNREFUSED','PROTOCOL_CONNECTION_LOST'].includes(e.code)) throw e; }
} else throw Error('Use setup, serve or stop.');
