// Read-only preview checks, except login sessions; never print demo secrets.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const config = JSON.parse(await fs.readFile('local/config.json','utf8'));
const base = 'http://127.0.0.1:3020';
assert.equal((await fetch(base)).status,200);
assert.equal((await fetch(base+'/static/attendance-workspace.js')).status,200);
assert.equal((await fetch(base+'/__local__/identity').then(r=>r.json())).id,config.id);
for (const role of ['admin','teacher','zimmadar','guardian']) {
  const login = await fetch(base+'/api/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:role+'@academy.test',password:config.login})});
  assert.equal(login.status,200,role+' login');
  const cookie = login.headers.get('set-cookie').split(';')[0];
  for (const route of ['/summary','/classes','/classes/1/attendance','/enrollments','/leaves','/notifications','/attendance-status/1',...(role === 'guardian' ? [] : ['/followups','/attendance-corrections'])]) {
    const r = await fetch(base+'/api'+route,{headers:{cookie}});
    assert.equal(r.status,200,role+' '+route+': '+(r.ok?'':await r.text()));
    await r.json();
  }
  console.log('PASS',role,'login and scoped preview endpoints');
}
console.log('PASS local page, UI asset and instance identity');
