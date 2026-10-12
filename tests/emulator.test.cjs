'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const { doc, collection, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, serverTimestamp } = require('firebase/firestore');
const { initializeApp, deleteApp } = require('firebase/app');
const { getAuth, connectAuthEmulator, signInWithEmailAndPassword } = require('firebase/auth');
const { getFunctions, connectFunctionsEmulator, httpsCallable } = require('firebase/functions');
const backendRequire = require('node:module').createRequire(require('node:path').resolve(__dirname,'../functions/package.json'));
const { initializeApp: adminApp } = backendRequire('firebase-admin/app');
const { getAuth: adminAuth } = backendRequire('firebase-admin/auth');
const { PNG } = backendRequire('pngjs');
const { OFFICE, DRIVER } = require('../functions/policy.cjs');
const projectId = 'demo-marapo24';
let env, driverClient, officeClient, clients = [];
function tour() { return { type:'Mosel', date:'2026-10-12', driverId:DRIVER, createdBy:OFFICE, status:'open', schemaVersion:2, createdAt:serverTimestamp() }; }
function stop(type='privat') { return { type, name:'Erika Muster', address:'Musterweg 1, Musterstadt', note:'Fiktiver Test', cents:100, status:'offen', schemaVersion:2, proofId:null, completedAt:null, createdAt:serverTimestamp() }; }
const ref = (db,path) => doc(db,path);
async function seed(path,value) { await env.withSecurityRulesDisabled(c=>setDoc(ref(c.firestore(),path),value)); }
async function client(uid,email) {
  await adminAuth().createUser({uid,email,password:'Fiktives-Passwort-123!'});
  const app = initializeApp({projectId,apiKey:'fake-api-key',authDomain:`${projectId}.firebaseapp.com`},uid);
  clients.push(app);
  const auth = getAuth(app); connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});
  await signInWithEmailAndPassword(auth,email,'Fiktives-Passwort-123!');
  const functions = getFunctions(app,'europe-west3'); connectFunctionsEmulator(functions,'127.0.0.1',5001);
  return { finish:httpsCallable(functions,'completeProtectedDelivery'), pdf:httpsCallable(functions,'downloadProtectedProof'), key:httpsCallable(functions,'getDeliveryEncryptionKey') };
}
before(async()=>{
  // Fail before any SDK could contact a real project.
  assert.equal(process.env.GCLOUD_PROJECT,projectId);
  assert.match(process.env.FIRESTORE_EMULATOR_HOST||'',/^(127\.0\.0\.1|localhost):8080$/);
  assert.match(process.env.FIREBASE_AUTH_EMULATOR_HOST||'',/^(127\.0\.0\.1|localhost):9099$/);
  env = await initializeTestEnvironment({projectId,firestore:{host:'127.0.0.1',port:8080,rules:fs.readFileSync('firestore.rules','utf8')}});
  adminApp({projectId});
  await seed(`users/${OFFICE}`,{role:'office',active:true}); await seed(`users/${DRIVER}`,{role:'driver',active:true});
  await seed('users/attacker',{role:'office',active:false});
  for(let i=2;i<=11;i++)await seed(`users/driver-${i}`,{role:'driver',active:true,displayName:`Fiktiver Fahrer ${i}`});
  for(let i=2;i<=20;i++)await seed(`users/office-${i}`,{role:'office',active:true,displayName:`Fiktives Büro ${i}`});
  await seed('protectedTours/tour1',tour()); await seed('protectedTours/foreign',{...tour(),driverId:'other'});
  await seed('protectedTours/tour1/stops/stop1',stop()); await seed('protectedTours/foreign/stops/stop1',stop());
  await seed('tours/legacy/stops/stop1',{...stop(),signature:'old secret signature'});
  await seed('protectedDeliveryProofs/seed',{signature:'fictitious',status:'zugestellt'});
  driverClient=await client(DRIVER,'driver@example.test'); officeClient=await client(OFFICE,'office@example.test');
});
after(async()=>{await Promise.all(clients.map(deleteApp));if(env)await env.cleanup();});
test('driver query requires own assignment; office can list tours',async()=>{
  const db=env.authenticatedContext(DRIVER).firestore();
  await assertSucceeds(getDocs(query(collection(db,'protectedTours'),where('driverId','==',DRIVER))));
  await assertFails(getDocs(collection(db,'protectedTours')));
  await assertSucceeds(getDocs(collection(env.authenticatedContext(OFFICE).firestore(),'protectedTours')));
});
test('driver reads own stop; foreign and orphaned subcollections denied',async()=>{
  const db=env.authenticatedContext(DRIVER).firestore();
  await assertSucceeds(getDoc(ref(db,'protectedTours/tour1/stops/stop1')));
  await assertSucceeds(getDocs(collection(db,'protectedTours/tour1/stops')));
  await assertFails(getDoc(ref(db,'protectedTours/foreign/stops/stop1')));
  await assertFails(getDoc(ref(db,'protectedTours/missing/stops/stop1')));
});
for(const [label,context] of [ ['anonymous',()=>env.unauthenticatedContext()], ['driver',()=>env.authenticatedContext(DRIVER)], ['forged office',()=>env.authenticatedContext('attacker')] ]) {
  test(`${label} cannot get/list archive or read legacy signatures`,async()=>{
    const db=context().firestore();
    await assertFails(getDoc(ref(db,'protectedDeliveryProofs/seed')));
    await assertFails(getDocs(collection(db,'protectedDeliveryProofs')));
    await assertFails(getDoc(ref(db,'tours/legacy/stops/stop1')));
  });
}
test('office alone can read/list archive',async()=>{
  const db=env.authenticatedContext(OFFICE).firestore();
  await assertSucceeds(getDoc(ref(db,'protectedDeliveryProofs/seed')));
  await assertSucceeds(getDocs(collection(db,'protectedDeliveryProofs')));
});
for(const uid of [DRIVER,OFFICE,'attacker']) test(`${uid}: browser cannot write archive, alter completed state or assign own role`,async()=>{
  const db=env.authenticatedContext(uid).firestore();
  await assertFails(setDoc(ref(db,'protectedDeliveryProofs/new'),{signature:'fake'}));
  await assertFails(updateDoc(ref(db,'protectedDeliveryProofs/seed'),{signature:'replacement'}));
  await assertFails(deleteDoc(ref(db,'protectedDeliveryProofs/seed')));
  await assertFails(updateDoc(ref(db,'protectedTours/tour1/stops/stop1'),{status:'zugestellt',signature:'fake'}));
  await assertFails(updateDoc(ref(db,'protectedTours/tour1'),{driverId:uid}));
  await assertFails(setDoc(ref(db,`users/${uid}`),{role:'office',active:true}));
});
test('office creation validates required fields/types/limits and excludes signature',async()=>{
  const db=env.authenticatedContext(OFFICE).firestore();
  await assertSucceeds(setDoc(ref(db,'protectedTours/valid'),tour()));
  await assertSucceeds(setDoc(ref(db,'protectedTours/valid/stops/valid'),stop()));
  for(const bad of [ {...stop(),signature:null}, {...stop(),name:'x'.repeat(91)}, {...stop(),note:[]}, {...stop(),cents:-1}, {...stop(),cents:1.1}, {...stop(),createdAt:new Date(0)}, {...stop(),status:'zugestellt'}, {...stop(),extra:'value'} ])
    await assertFails(setDoc(ref(db,'protectedTours/valid/stops/bad'),bad));
  const omitted=stop(); delete omitted.address;
  await assertFails(setDoc(ref(db,'protectedTours/valid/stops/bad'),omitted));
  await assertFails(updateDoc(ref(db,'protectedTours/valid/stops/valid'),{name:'changed'}));
  await assertFails(setDoc(ref(db,'protectedTours/invalid'),{...tour(),driverId:'attacker'}));
});
test('encrypted callable transactions: concurrent completion, idempotent retry, archive isolation and PDF',async()=>{
  const png=new PNG({width:300,height:150});png.data.fill(255);
  for(let i=0;i<100;i++){const pos=(10*300+i)*4;png.data[pos]=png.data[pos+1]=png.data[pos+2]=0;}
  const signature='data:image/png;base64,'+PNG.sync.write(png).toString('base64');
  const crypto=require('node:crypto');
  const {sealSignature}=await import('../offline-store.mjs');
  const capturedAt=new Date().toISOString(),completionId=crypto.randomUUID(),key=(await driverClient.key({})).data;
  const identity={uid:DRIVER,tourId:'tour1',stopId:'stop1',completionId};
  const sealedSignature=await sealSignature(key,identity,signature,capturedAt);
  const data={tourId:'tour1',stopId:'stop1',status:'zugestellt',sealedSignature,capturedAt,completionId};
  await assert.rejects(officeClient.finish(data),e=>e.code==='functions/permission-denied');
  await assert.rejects(driverClient.finish({...data,tourId:'foreign'}),e=>e.code==='functions/permission-denied');
  await assert.rejects(driverClient.finish({...data,signature:'data:image/png;base64,YWJj'}),e=>e.code==='functions/invalid-argument');
  const otherId=crypto.randomUUID();
  const otherBox=await sealSignature(key,{...identity,completionId:otherId},signature,capturedAt);
  const results=await Promise.allSettled([driverClient.finish(data),driverClient.finish({...data,completionId:otherId,sealedSignature:otherBox})]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  const rejected=results.find(r=>r.status==='rejected');assert.equal(rejected.reason.code,'functions/already-exists');
  assert.deepEqual(results.find(r=>r.status==='fulfilled').value.data,{completed:true});
  const winningData=results[0].status==='fulfilled'?data:{...data,completionId:otherId,sealedSignature:otherBox};
  assert.deepEqual((await driverClient.finish(winningData)).data,{completed:true});
  await assert.rejects(driverClient.finish({...winningData,status:'nicht zugestellt'}),e=>e.code==='functions/already-exists');
  const driverDb=env.authenticatedContext(DRIVER).firestore();
  const completed=(await getDoc(ref(driverDb,'protectedTours/tour1/stops/stop1'))).data();
  assert.equal(completed.status,'zugestellt');assert.equal('signature' in completed,false);
  assert.equal(completed.proofId,'5_tour1_stop1');assert.ok(completed.completedAt.toMillis()>0);
  await assertFails(getDoc(ref(driverDb,'protectedDeliveryProofs/5_tour1_stop1')));
  const archive=(await getDoc(ref(env.authenticatedContext(OFFICE).firestore(),'protectedDeliveryProofs/5_tour1_stop1'))).data();
  assert.equal(archive.signature,signature);assert.equal(archive.signatureSha256.length,64);
  await assert.rejects(driverClient.pdf({tourId:'tour1',stopId:'stop1'}),e=>e.code==='functions/permission-denied');
  const pdf=(await officeClient.pdf({tourId:'tour1',stopId:'stop1'})).data;
  assert.equal(Buffer.from(pdf.base64,'base64').subarray(0,5).toString(),'%PDF-');
});
test('failed private/non-private completion rejects extraneous signature',async()=>{
  await seed('protectedTours/tour1/stops/failure',stop());
  const data={tourId:'tour1',stopId:'failure',status:'nicht zugestellt',sealedSignature:null,completionId:require('node:crypto').randomUUID(),capturedAt:new Date().toISOString()};
  await driverClient.finish(data);
  assert.deepEqual((await driverClient.finish(data)).data,{completed:true});
});
test('11 drivers and 20 office users work without fixed test UIDs; revocation takes effect',async()=>{
  for(let i=2;i<=11;i++){
    const db=env.authenticatedContext(`driver-${i}`).firestore();
    await seed(`protectedTours/driver-tour-${i}`,{...tour(),driverId:`driver-${i}`});
    await assertSucceeds(getDocs(query(collection(db,'protectedTours'),where('driverId','==',`driver-${i}`))));
    await assertFails(getDoc(ref(db,'protectedDeliveryProofs/seed')));
  }
  for(let i=2;i<=20;i++)await assertSucceeds(getDoc(ref(env.authenticatedContext(`office-${i}`).firestore(),'protectedDeliveryProofs/seed')));
  await seed('users/driver-2',{role:'driver',active:false});
  await assertFails(getDoc(ref(env.authenticatedContext('driver-2').firestore(),'protectedTours/driver-tour-2')));
  await seed('users/office-2',{role:'office',active:false});
  await assertFails(getDoc(ref(env.authenticatedContext('office-2').firestore(),'protectedDeliveryProofs/seed')));
});
