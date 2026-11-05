import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {build} from 'esbuild';
import {Miniflare} from 'miniflare';
import {sealSignature} from '../offline-store.mjs';
const require=createRequire(import.meta.url),{PNG}=require('../functions/node_modules/pngjs'),{keys}=require('../functions/envelope.cjs');
let runtime,pem,key,signature;
const uid='fictional-driver',identity={uid,tourId:'fictional-tour',stopId:'fictional-stop',completionId:crypto.randomUUID()};
const capturedAt=new Date().toISOString();
before(async()=>{
 pem=crypto.generateKeyPairSync('rsa',{modulusLength:3072,privateKeyEncoding:{type:'pkcs8',format:'pem'},publicKeyEncoding:{type:'spki',format:'pem'}}).privateKey;key=keys(pem);
 const png=new PNG({width:500,height:150});png.data.fill(255);
 for(let x=20;x<400;x++){const y=50+Math.round(20*Math.sin(x/15));for(let dy=0;dy<3;dy++){const p=((y+dy)*500+x)*4;png.data[p]=png.data[p+1]=png.data[p+2]=0;}}
 signature='data:image/png;base64,'+PNG.sync.write(png).toString('base64');
 const bundle=await build({absWorkingDir:fileURLToPath(new URL('.',import.meta.url)),entryPoints:['worker.mjs'],bundle:true,write:false,format:'esm',platform:'node',target:'es2022',external:['node:*','fs','zlib','stream','util','events','buffer','crypto'],banner:{js:"import {createRequire} from 'node:module';const require=createRequire('/bundle/probe.js');"},minify:true});
 runtime=new Miniflare({modules:true,script:bundle.outputFiles[0].text,compatibilityDate:'2026-07-30',compatibilityFlags:['nodejs_compat'],bindings:{LOCAL_FICTIONAL_PROBE:'yes',FICTIONAL_KEY:pem},d1Databases:{DB:'local-fictional-probe'},outboundService:()=>new Response('External network disabled',{status:503})});
 await runtime.ready;
});
after(async()=>{if(runtime)await runtime.dispose();});
function call(path,body){return runtime.dispatchFetch('http://local-probe.invalid'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});}
test('existing backend envelope decrypts inside Workers runtime without exposing signature',async()=>{
 const box=await sealSignature(key,identity,signature,capturedAt);
 const response=await call('/decrypt',{uid,profile:{role:'driver',active:true},identity,box});assert.equal(response.status,200,response.status===200?'':await response.clone().text());
 const text=await response.text();assert.equal(text.includes('data:image/png'),false);assert.equal(JSON.parse(text).width,500);
});
test('Worker rejects role bypasses, modified identity and modified ciphertext',async()=>{
 const box=await sealSignature(key,identity,signature,capturedAt),base={uid,profile:{role:'driver',active:true},identity,box};
 assert.equal((await call('/decrypt',{...base,profile:{role:'office',active:true}})).status,403);
 assert.equal((await call('/decrypt',{...base,profile:{role:'driver',active:false}})).status,403);
 assert.equal((await call('/decrypt',{...base,identity:{...identity,stopId:'other'}})).status,400);
 const bytes=Buffer.from(box.ciphertext,'base64');bytes[0]^=1;
 assert.equal((await call('/decrypt',{...base,box:{...box,ciphertext:bytes.toString('base64')}})).status,400);
});
test('office PDF renders inside Workers runtime; driver fixture cannot download it',async()=>{
 assert.equal((await call('/pdf',{uid,profile:{role:'driver',active:true},signature})).status,403);
 const response=await call('/pdf',{uid:'fictional-office',profile:{role:'office',active:true},signature});
 assert.equal(response.status,200,response.status===200?'':await response.clone().text());const pdf=Buffer.from(await response.arrayBuffer());assert.equal(pdf.subarray(0,5).toString(),'%PDF-');
});
test('D1 local archive supports unique proof IDs and immutable proof constraints',async()=>{
 const db=await runtime.getD1Database('DB');
 await db.exec('CREATE TABLE proofs (id TEXT PRIMARY KEY, ciphertext TEXT NOT NULL); CREATE TRIGGER immutable_update BEFORE UPDATE ON proofs BEGIN SELECT RAISE(ABORT, "immutable proof"); END; CREATE TRIGGER immutable_delete BEFORE DELETE ON proofs BEGIN SELECT RAISE(ABORT, "immutable proof"); END;');
 const box=await sealSignature(key,identity,signature,capturedAt),encoded=JSON.stringify(box);
 const results=await Promise.allSettled([db.prepare('INSERT INTO proofs VALUES (?,?)').bind('same-proof',encoded).run(),db.prepare('INSERT INTO proofs VALUES (?,?)').bind('same-proof',encoded).run()]);
 assert.equal(results.filter(x=>x.status==='fulfilled').length,1);
 await assert.rejects(db.prepare('UPDATE proofs SET ciphertext=? WHERE id=?').bind('replacement','same-proof').run());
 await assert.rejects(db.prepare('DELETE FROM proofs WHERE id=?').bind('same-proof').run());
 const rows=await db.prepare('SELECT ciphertext FROM proofs').all();assert.equal(rows.results.length,1);assert.equal(rows.results[0].ciphertext.includes('data:image/png'),false);
});
