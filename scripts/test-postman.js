import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { once } from 'node:events';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import { pool } from '../src/db.js';
import { config } from '../src/config.js';
const require = createRequire(import.meta.url);
let newman;
try { newman = require('../.local/postman-tools/node_modules/newman'); }
catch { throw new Error('Install local test tool: npm install --prefix .local/postman-tools newman'); }
const collection = JSON.parse(await readFile('postman/Final-Acceptance.postman_collection.json','utf8'));
const environment = JSON.parse(await readFile('postman/Local.postman_environment.json','utf8'));
const admin = JSON.parse(await readFile('.local/demo-admin.json','utf8'));
const server = app.listen(0,'127.0.0.1');
await once(server,'listening');
const [[adminUser]] = await pool.execute('SELECT id FROM users WHERE email=?',[admin.email]);
const [tableFixture] = await pool.execute('INSERT INTO `tables` (table_number, capacity) VALUES (?, ?)', ['QA' + Date.now(), 4]);
const settings = {final_table_id:String(tableFixture.insertId),base_url:`http://127.0.0.1:${server.address().port}`,admin_email:admin.email,admin_password:admin.password,invalid_token:'invalid-token',expired_token:jwt.sign({},config.JWT_SECRET,{subject:String(adminUser.id),issuer:'food-service',audience:'food-client',expiresIn:-60})};
for (const [key,value] of Object.entries(settings)) { const old=environment.values.find(v=>v.key===key); if(old) old.value=value; else environment.values.push({key,value,enabled:true}); }
function redact(value) {
  if(Array.isArray(value)) return value.map(redact);
  if(value && typeof value==='object') return Object.fromEntries(Object.entries(value).map(([key,v])=>[key,/password|token|secret|authorization/i.test(key)?'[REDACTED]':redact(v)]));
  return value;
}
try {
  const summary = await new Promise((resolve,reject)=>newman.run({collection,environment,reporters:[]},(error,result)=>error?reject(error):resolve(result)));
  const results = summary.run.executions.map(e=>({name:e.item.name,method:e.request.method,status:e.response?.code,assertions:e.assertions?.map(a=>({name:a.assertion,passed:!a.error}))??[]}));
  for (const e of summary.run.executions) {
    const item=collection.item.find(i=>i.name===e.item.name); if(!item || !e.response) continue;
    let body; try{body=JSON.stringify(redact(JSON.parse(e.response.stream.toString())),null,2);}catch{body=e.response.stream.toString();}
    item.response=[{name:`Actual ${e.response.code} response`,originalRequest:item.request,status:e.response.status,code:e.response.code,header:[{key:'Content-Type',value:'application/json'}],body}];
  }
  const evidence={date:new Date().toISOString(),runner:'Newman (Postman collection)',requests:summary.run.stats.requests.total,assertions:summary.run.stats.assertions.total,failures:summary.run.failures.map(f=>({name:f.source.name,message:f.error.message})),results};
  await mkdir('docs/evidence',{recursive:true});
  await writeFile('docs/evidence/final-postman-results.json',JSON.stringify(evidence,null,2));
  await writeFile('postman/Final-Acceptance.postman_collection.json',JSON.stringify(collection,null,2));
  console.log(JSON.stringify({requests:evidence.requests,assertions:evidence.assertions,failures:evidence.failures},null,2));
  if(evidence.failures.length) process.exitCode=1;
} finally {
  try {
    await pool.execute('DELETE FROM reservations WHERE table_id=?', [tableFixture.insertId]);
    await pool.execute('DELETE FROM `tables` WHERE id=?', [tableFixture.insertId]);
  } finally { await new Promise(resolve=>server.close(resolve)); await pool.end(); }
}
