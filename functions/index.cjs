'use strict';
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { PNG } = require('pngjs');
const PDFDocument = require('pdfkit');
const crypto = require('node:crypto');
const policy = require('./policy.cjs');
initializeApp();
const db = getFirestore();
const options = { region: 'europe-west3', maxInstances: 3, timeoutSeconds: 30, memory: '256MiB', cors: true };
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
function callable(handler) {
  return onCall(options, async request => {
    projectGuard();
    try { return await handler(request); }
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
  const tourRef = db.doc(`protectedTours/${request.data.tourId}`);
  const stopRef = tourRef.collection('stops').doc(request.data.stopId);
  const proofRef = db.doc(`protectedDeliveryProofs/${proofId}`);
  await db.runTransaction(async tx => {
    const [profile, tour, stop, proof] = await tx.getAll(db.doc(`users/${uid}`), tourRef, stopRef, proofRef);
    const validated = policy.completion(request.data, uid, profile.data(), tour.data(), stop.data(), proof.exists, validatePng);
    const timestamp = FieldValue.serverTimestamp();
    const s = stop.data();
    tx.create(proofRef, {
      schemaVersion: 2, tourId: tourRef.id, stopId: stopRef.id, driverId: uid,
      name: s.name, address: s.address, type: s.type, cents: s.cents,
      status: request.data.status, completedAt: timestamp, signature: validated.signature,
      signatureSha256: validated.signature ? crypto.createHash('sha256').update(Buffer.from(validated.signature.slice(22), 'base64')).digest('hex') : null
    });
    tx.update(stopRef, { status: request.data.status, completedAt: timestamp, proofId });
  });
  // No signature or proof data returned to driver, including retries.
  return { completed: true };
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
  pdf.fontSize(11).text('TEST - NUR FIKTIVE DATEN').moveDown();
  for (const [label, value] of Object.entries({ Lieferung: proof.stopId, Tour: proof.tourId, Empfänger: proof.name, Adresse: proof.address, Status: proof.status, Zeitpunkt: proof.completedAt.toDate().toISOString(), 'Signatur SHA-256': proof.signatureSha256 || 'Keine Unterschrift' }))
    pdf.text(`${label}: ${value}`).moveDown(0.5);
  if (proof.signature) pdf.image(Buffer.from(proof.signature.slice(22), 'base64'), { fit: [480, 150] });
  pdf.end();
  return { filename: `Zustellnachweis-${proofId}.pdf`, base64: (await done).toString('base64') };
});
