'use strict';
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { PNG } = require('pngjs');
const PDFDocument = require('pdfkit');
const crypto = require('node:crypto');
const policy = require('./policy.cjs');
const envelope = require('./envelope.cjs');
const tourPolicy = require('./tour-policy.cjs');
const privateKey = defineSecret('DELIVERY_PROOF_PRIVATE_KEY');
initializeApp();
const emulated = process.env.FUNCTIONS_EMULATOR === 'true';
// Production never touches the default database used by v3.
const db = getFirestore(emulated ? '(default)' : 'protected-deliveries');
const options = { region: 'europe-west3', maxInstances: 3, concurrency: 10, timeoutSeconds: 30, memory: '256MiB', cors: true, enforceAppCheck: !emulated };
function projectGuard() {
  const project = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
  if (project !== 'marap024-botendienst-test' &&
      !(process.env.FIRESTORE_EMULATOR_HOST && project === 'demo-marapo24'))
    throw new HttpsError('failed-precondition', 'Nur im freigegebenen Testprojekt erlaubt.');
}
function validatePng(dataUrl) {
  const bytes = Buffer.from(dataUrl.slice(22), 'base64');
  if (bytes.toString('base64') !== dataUrl.slice(22) || bytes.length < 33 ||
      !bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ||
      bytes.toString('ascii', 12, 16) !== 'IHDR')
    policy.reject('invalid-argument', 'Ungültiges PNG.');
  const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
  if (width < 1 || width > 1600 || height < 1 || height > 400)
    policy.reject('invalid-argument', 'Unterschrift zu groß.');
  try {
    const png = PNG.sync.read(bytes, { checkCRC: true });
    let ink = 0;
    for (let i = 0; i < png.data.length; i += 4)
      if (png.data[i + 3] > 32 && Math.min(...png.data.subarray(i, i + 3)) < 200) ink++;
    if (ink < 10) policy.reject('invalid-argument', 'Unterschrift ist leer.');
  } catch (e) {
    if (e instanceof policy.PolicyError) throw e;
    policy.reject('invalid-argument', 'PNG kann nicht gelesen werden.');
  }
}
function callable(handler, needsKey=false) {
  return onCall({...options,...(needsKey?{secrets:[privateKey]}:{})}, async request => {
    projectGuard();
    try { if(request.auth&&request.auth.token.email_verified!==true)policy.reject('permission-denied','Bitte Mitarbeiter-E-Mail bestätigen.');return await handler(request); }
    catch (e) {
      if (e instanceof policy.PolicyError) throw new HttpsError(e.code, e.message);
      // Never log request payloads or signatures.
      if (e instanceof HttpsError) throw e;
      throw new HttpsError('internal', 'Vorgang fehlgeschlagen.');
    }
  });
}
exports.completeProtectedDelivery = callable(async request => {
  const uid = request.auth?.uid;
  if (!uid) policy.reject('unauthenticated', 'Anmeldung erforderlich.');
  const proofId = policy.identifiers(request.data);
  const input=request.data;
  if(Object.keys(input).some(k=>!['tourId','stopId','status','sealedSignature','completionId','capturedAt'].includes(k))||
     typeof input.completionId!=='string'||!/^[0-9a-f-]{36}$/i.test(input.completionId)||typeof input.capturedAt!=='string'||input.capturedAt.length>40)
    policy.reject('invalid-argument','Ungültiger Abschluss.');
  const fingerprint=crypto.createHash('sha256').update(JSON.stringify(input)).digest('hex');
  const tourRef = db.doc(`protectedTours/${request.data.tourId}`);
  const stopRef = tourRef.collection('stops').doc(request.data.stopId);
  const proofRef = db.doc(`protectedDeliveryProofs/${proofId}`);
  await db.runTransaction(async tx => {
    const [profile, tour, stop, proof] = await tx.getAll(db.doc(`users/${uid}`), tourRef, stopRef, proofRef);
    policy.authorize(uid,profile.data(),'driver');
    if(tour.data()?.driverId!==uid)policy.reject('permission-denied','Tour nicht zugewiesen.');
    if(proof.exists && proof.data().driverId===uid && proof.data().completionId===input.completionId && proof.data().requestFingerprint===fingerprint)return;
    if(!proof.exists&&tour.data().status!=='running')policy.reject('failed-precondition','Tour zuerst starten.');
    const identity={uid,tourId:input.tourId,stopId:input.stopId,completionId:input.completionId};
    const opened=input.sealedSignature ? envelope.openEnvelope(input.sealedSignature,identity,privateKey.value()) : {signature:null,capturedAt:input.capturedAt};
    if(opened.capturedAt!==input.capturedAt)policy.reject('invalid-argument','Erfassungszeit wurde verändert.');
    const captured=Date.parse(input.capturedAt);
    if(!Number.isFinite(captured)||captured>Date.now()+300000||Date.now()-captured>172800000)policy.reject('failed-precondition','Gerätezeit oder ausstehenden Offline-Abschluss prüfen.');
    const validated = policy.completion({tourId:input.tourId,stopId:input.stopId,status:input.status,signature:opened.signature,completionId:input.completionId,capturedAt:input.capturedAt}, uid, profile.data(), tour.data(), stop.data(), proof.exists, validatePng);
    const timestamp = FieldValue.serverTimestamp();
    const s = stop.data();
    tx.create(proofRef, {
      schemaVersion: 2, tourId: tourRef.id, stopId: stopRef.id, driverId: uid,
      name: s.name, address: s.address, type: s.type, cents: s.cents,
      status: request.data.status, completedAt: timestamp, capturedAtClient:input.capturedAt,
      completionId:input.completionId,requestFingerprint:fingerprint,signature: validated.signature,
      signatureSha256: validated.signature ? crypto.createHash('sha256').update(Buffer.from(validated.signature.slice(22), 'base64')).digest('hex') : null
    });
    tx.update(stopRef, { status: request.data.status, completedAt: timestamp, proofId });
  });
  // No signature or proof data returned to driver, including retries.
  return { completed: true };
},true);
exports.getDeliveryEncryptionKey = callable(async request=>{
  const uid=request.auth?.uid;
  if(!uid)policy.reject('unauthenticated','Anmeldung erforderlich.');
  policy.authorize(uid,(await db.doc(`users/${uid}`).get()).data(),'driver');
  const key=envelope.keys(privateKey.value());
  return {version:1,keyId:key.keyId,publicKey:key.publicKey};
},true);
exports.startProtectedTour = callable(async request=>{
  const uid=request.auth?.uid,input=request.data;
  if(!uid)policy.reject('unauthenticated','Anmeldung erforderlich.');
  // Validate paths before constructing document references.
  if(typeof input?.tourId!=='string'||!/^[A-Za-z0-9_-]{1,128}$/.test(input.tourId)||typeof input.vehicleId!=='string'||!/^[A-Za-z0-9_-]{1,128}$/.test(input.vehicleId))policy.reject('invalid-argument','Tour und Fahrzeug auswählen.');
  const tourRef=db.doc(`protectedTours/${input.tourId}`);
  const fingerprint=crypto.createHash('sha256').update(JSON.stringify(input)).digest('hex');
  await db.runTransaction(async tx=>{
    const [profile,tour,vehicle]=await tx.getAll(db.doc(`users/${uid}`),tourRef,db.doc(`vehicles/${input.vehicleId}`));
    tourPolicy.validateTourAction(input,uid,profile.data(),tour.data());
    if(tour.data().startCompletionId===input.completionId&&tour.data().startFingerprint===fingerprint)return;
    tourPolicy.canStart(tour.data(),vehicle.data());
    tx.update(tourRef,{status:'running',vehicleId:input.vehicleId,vehicleLabel:vehicle.data().label,startedAt:FieldValue.serverTimestamp(),startCapturedAtClient:input.capturedAt,startCompletionId:input.completionId,startFingerprint:fingerprint});
  });
  return {started:true};
});
exports.finishProtectedTour = callable(async request=>{
  const uid=request.auth?.uid,input=request.data;
  if(!uid)policy.reject('unauthenticated','Anmeldung erforderlich.');
  if(typeof input?.tourId!=='string'||!/^[A-Za-z0-9_-]{1,128}$/.test(input.tourId)||input.vehicleId!==undefined)policy.reject('invalid-argument','Ungültiger Tourabschluss.');
  const tourRef=db.doc(`protectedTours/${input.tourId}`),fingerprint=crypto.createHash('sha256').update(JSON.stringify(input)).digest('hex');
  await db.runTransaction(async tx=>{
    const [profile,tour]=await tx.getAll(db.doc(`users/${uid}`),tourRef);
    tourPolicy.validateTourAction(input,uid,profile.data(),tour.data());
    if(tour.data().endCompletionId===input.completionId&&tour.data().endFingerprint===fingerprint)return;
    const stops=await tx.get(tourRef.collection('stops').limit(1001));
    if(stops.size>1000)policy.reject('resource-exhausted','Tour enthält zu viele Stopps.');
    tourPolicy.canFinish(tour.data(),stops.docs.map(d=>d.data()));
    tx.update(tourRef,{status:'finished',endedAt:FieldValue.serverTimestamp(),endCapturedAtClient:input.capturedAt,endCompletionId:input.completionId,endFingerprint:fingerprint});
  });
  return {finished:true};
});
exports.downloadProtectedProof = callable(async request => {
  const uid = request.auth?.uid;
  if (!uid) policy.reject('unauthenticated', 'Anmeldung erforderlich.');
  policy.authorize(uid, (await db.doc(`users/${uid}`).get()).data(), 'office');
  const proofId = policy.identifiers(request.data);
  const snapshot = await db.doc(`protectedDeliveryProofs/${proofId}`).get();
  if (!snapshot.exists) policy.reject('not-found', 'Nachweis fehlt.');
  const proof = snapshot.data();
  const pdf = new PDFDocument({ size: 'A4', margin: 50 });
  const chunks = [];
  const done = new Promise((resolve, reject) => { pdf.on('data', c => chunks.push(c)); pdf.on('end', () => resolve(Buffer.concat(chunks))); pdf.on('error', reject); });
  pdf.fontSize(20).text('MARAPO24 - Zustellnachweis');
  pdf.fontSize(11).text('marap024-botendienst-test - NUR FIKTIVE DATEN').moveDown();
  for (const [label, value] of Object.entries({ Lieferung: proof.stopId, Tour: proof.tourId, Empfänger: proof.name, Adresse: proof.address, Status: proof.status, 'Erfasst laut Gerät (ungeprüft)':proof.capturedAtClient, 'Serverseitig archiviert': proof.completedAt.toDate().toISOString(), 'Signatur SHA-256': proof.signatureSha256 || 'Keine Unterschrift' }))
    pdf.text(`${label}: ${value}`).moveDown(0.5);
  if (proof.signature) pdf.image(Buffer.from(proof.signature.slice(22), 'base64'), { fit: [480, 150] });
  pdf.end();
  return { filename: `Zustellnachweis-${proofId}.pdf`, base64: (await done).toString('base64') };
});
