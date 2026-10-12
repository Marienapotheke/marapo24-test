'use strict';
const {test,before}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
require('fake-indexeddb/auto');
const {keys,openEnvelope}=require('../functions/envelope.cjs');
let offline,key,pem;
const uid='driver-offline',identity={uid,tourId:'tour-offline',stopId:'stop-1',completionId:'12345678-1234-1234-1234-123456789abc'};
const capturedAt=new Date().toISOString(),signature='data:image/png;base64,YWJj';
before(async()=>{offline=await import('../offline-store.mjs');pem=crypto.generateKeyPairSync('rsa',{modulusLength:3072,privateKeyEncoding:{type:'pkcs8',format:'pem'},publicKeyEncoding:{type:'spki',format:'pem'}}).privateKey;key=keys(pem);});
test('browser encryption is readable only by backend and bound to identity',async()=>{
 const box=await offline.sealSignature(key,identity,signature,capturedAt);
 assert.deepEqual(openEnvelope(box,identity,pem),{signature,capturedAt});
 assert.equal(JSON.stringify(box).includes(signature),false);
 for(const change of [{uid:'other'},{tourId:'other'},{stopId:'other'},{completionId:'other'}])assert.throws(()=>openEnvelope(box,{...identity,...change},pem),e=>e.code==='invalid-argument');
 assert.throws(()=>openEnvelope({...box,iv:'YWJj'},identity,pem),e=>e.code==='invalid-argument');
 assert.throws(()=>openEnvelope({...box,ciphertext:'A'+box.ciphertext.slice(1)},identity,pem),e=>e.code==='invalid-argument');
 assert.throws(()=>openEnvelope({...box,keyId:'different'},identity,pem),e=>e.code==='failed-precondition');
});
test('queue survives reopening, exposes no signature and rejects duplicate capture atomically',async()=>{
 const sealedSignature=await offline.sealSignature(key,identity,signature,capturedAt);
 const input={tourId:identity.tourId,stopId:identity.stopId,status:'zugestellt',completionId:identity.completionId,capturedAt,sealedSignature};
 const results=await Promise.allSettled([offline.enqueue(uid,input),offline.enqueue(uid,input)]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
 assert.equal((await offline.pending(uid)).length,1);
 assert.equal((await offline.pending('another-user')).length,0);
 assert.equal(JSON.stringify(await offline.pending(uid)).includes(signature),false);
 const reopened=await import('../offline-store.mjs?reload');
 assert.equal((await reopened.pending(uid)).length,1);
 await reopened.pendingError(uid,(await reopened.pending(uid))[0],'Konto prüfen');
 assert.equal((await offline.pending(uid))[0].error,'Konto prüfen');
 await offline.acknowledge(uid,input.completionId);
 assert.equal((await offline.pending(uid)).length,0);
});
test('plaintext proof cannot enter pending storage',async()=>{
 await assert.rejects(offline.enqueue(uid,{...identity,signature}),/Unverschlüsselte/);
});
test('assignment cache is encrypted, scoped to the account and cleared on logout',async()=>{
 await offline.saveAssignments(uid,{profile:{role:'driver',active:true},tours:[{id:'tour1',name:'Fiktiver Patient'}],stops:{}});
 assert.equal((await offline.loadAssignments(uid)).tours[0].name,'Fiktiver Patient');
 assert.equal(await offline.loadAssignments('other'),null);
 const raw=await new Promise((resolve,reject)=>{const r=indexedDB.open('marapo24-protected-offline-v1');r.onsuccess=()=>{const tx=r.result.transaction('items');const q=tx.objectStore('items').get('assignments:'+uid);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);};});
 assert.equal(JSON.stringify(raw).includes('Fiktiver Patient'),false);
 await offline.savePublicKey(uid,key);assert.equal((await offline.getPublicKey(uid)).keyId,key.keyId);
 await offline.clearAssignments(uid);assert.equal(await offline.loadAssignments(uid),null);assert.equal(await offline.getPublicKey(uid),undefined);
});
test('offline capture age validation does not silently delete the queued proof',async()=>{
 const old=new Date(Date.now()-49*60*60*1000).toISOString();
 const box=await offline.sealSignature(key,identity,signature,old);
 assert.throws(()=>openEnvelope(box,identity,pem),e=>e.code==='failed-precondition');
 await offline.enqueue(uid,{tourId:identity.tourId,stopId:identity.stopId,status:'zugestellt',completionId:identity.completionId,capturedAt:old,sealedSignature:box});
 assert.equal((await offline.pending(uid)).length,1);
 await offline.clearAssignments(uid);assert.equal((await offline.pending(uid)).length,1);
 await offline.acknowledge(uid,identity.completionId);
});
