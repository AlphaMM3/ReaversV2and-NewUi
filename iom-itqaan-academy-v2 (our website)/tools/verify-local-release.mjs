// Local-only verification: preserve preview data;SQL tests use brand-new disposable databases.
import fs from 'node:fs/promises';
import path from 'node:path';
import {randomBytes} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import mysql from 'mysql2/promise';
const root=process.cwd(),local=path.resolve('local'),artifacts=path.resolve('artifacts');
await fs.mkdir(artifacts,{recursive:true});
const c=await mysql.createConnection({host:'127.0.0.1',port:33139,user:'root'});
const result={verifiedAt:new Date().toISOString(),preview:'http://127.0.0.1:3020',dbPort:33139,sqlIntegration:null,upgrade:null};
let env;
try{
 const [[server]]=await c.query('SELECT @@datadir AS directory');
 if(path.resolve(server.directory).toLowerCase()!==path.join(local,'mysql').toLowerCase())throw Error('Antigravity database instance ownership mismatch');
 const [[count]]=await c.query("SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema='academy_test_antigravity_demo_v1'");
 const [versions]=await c.query('SELECT version FROM academy_test_antigravity_demo_v1.schema_migrations ORDER BY version');
 result.previewTables=count.n;result.previewMigrationVersions=versions.map(x=>x.version);
 const suffix=Date.now().toString(36),db='academy_test_ag_verify_'+suffix,upgrade='academy_test_ag_upgrade_'+suffix;
 const user='ag_verify_'+suffix.slice(-10),pw=randomBytes(24).toString('hex');
 for(const d of [db,upgrade]){await c.query('CREATE DATABASE `'+d+'` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');}
 await c.query('CREATE USER ?@? IDENTIFIED BY ?',[user,'127.0.0.1',pw]);
 for(const d of [db,upgrade])await c.query('GRANT ALL ON `'+d+'`.* TO ?@?',[user,'127.0.0.1']);
 result.disposableDatabases=[db,upgrade];
 env={...process.env,ACADEMY_ENV:'test',DB_HOST:'127.0.0.1',DB_PORT:'33139',DB_NAME:db,DB_USER:user,DB_PASSWORD:pw,ACADEMY_ALLOW_SETUP:'1'};
 for(const [name,args,e] of [['migrate',['dist/src/cli.js','migrate'],env],['sqlIntegration',['--test','--test-concurrency=1','dist/tests/mysql.integration.js'],env],['upgrade',['tools/test-upgrade.mjs'],{...env,DB_NAME:upgrade}]]){
  const p=spawnSync(process.execPath,args,{env:e,cwd:root,encoding:'utf8',maxBuffer:12*1024*1024});
  await fs.writeFile(path.join(artifacts,'verify-'+name+'.log'),(p.stdout??'')+(p.stderr??''));
  result[name]={exitCode:p.status,signal:p.signal,log:'artifacts/verify-'+name+'.log'};
  console.log(name+':'+(p.status===0?'PASS':'FAIL'));
  if(name==='migrate'&&p.status!==0)break;
 }
}finally{await c.end();await fs.writeFile(path.join(artifacts,'LOCAL-VERIFICATION-2026-11-10.json'),JSON.stringify(result,null,2));}
console.log(JSON.stringify(result));
if(result.sqlIntegration?.exitCode!==0||result.upgrade?.exitCode!==0)process.exitCode=1;
