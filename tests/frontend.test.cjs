'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('all static DOM selectors refer to existing UI controls',()=>{
 const html=fs.readFileSync('index.html','utf8'),script=fs.readFileSync('app.mjs','utf8');
 const ids=new Set([...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]));
 for(const m of script.matchAll(/\$\('([^']+)'\)/g))assert.ok(ids.has(m[1]),'Missing UI control: '+m[1]);
});
test('deployment isolates v3 default database and exposes only app assets',()=>{
 const config=JSON.parse(fs.readFileSync('firebase.deploy.json','utf8'));
 assert.equal(config.firestore[0].database,'protected-deliveries');assert.equal(config.hosting.public,'dist');
 assert.equal(config.hosting.target,'protected-app');
 const backend=fs.readFileSync('functions/index.cjs','utf8');assert.match(backend,/emulated \? '\(default\)' : 'protected-deliveries'/);assert.match(backend,/enforceAppCheck: !emulated/);
});
