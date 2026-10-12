'use strict';
const OFFICE = 'SpSSdF3EVNSyXbu8EZfSrcE9Yym2';
const DRIVER = 'p3UGBiSDr3VJ5hxe3vzihfaw2Fr2';
class PolicyError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
function reject(code, message) { throw new PolicyError(code, message); }
function authorize(uid, profile, role) {
  if (!uid) reject('unauthenticated', 'Anmeldung erforderlich.');
  if (profile?.role !== role || uid !== (role === 'office' ? OFFICE : DRIVER))
    reject('permission-denied', 'Kein freigegebenes Testkonto.');
}
function identifiers(data) {
  for (const key of ['tourId', 'stopId'])
    if (typeof data?.[key] !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(data[key]))
      reject('invalid-argument', 'Ungültige Lieferungsnummer.');
  // Length prefix prevents collisions such as a--b/c versus a/b--c.
  return `${data.tourId.length}_${data.tourId}_${data.stopId}`;
}
function completion(data, uid, profile, tour, stop, proofExists, validatePng) {
  authorize(uid, profile, 'driver');
  const proofId = identifiers(data);
  if (!data || Object.keys(data).some(k => !['tourId', 'stopId', 'status', 'signature'].includes(k)))
    reject('invalid-argument', 'Unerlaubte Abschlussfelder.');
  if (!tour || !stop) reject('not-found', 'Lieferung fehlt.');
  if (tour.driverId !== uid) reject('permission-denied', 'Tour nicht zugewiesen.');
  if (tour.schemaVersion !== 2 || stop.schemaVersion !== 2 || 'signature' in stop)
    reject('failed-precondition', 'Alte Testdaten zuerst sicher migrieren.');
  if (stop.status !== 'offen' || proofExists)
    reject('already-exists', 'Lieferung bereits abgeschlossen.');
  if (!['zugestellt', 'nicht zugestellt'].includes(data.status))
    reject('invalid-argument', 'Ungültiger Status.');
  const needsSignature = data.status === 'zugestellt' && stop.type === 'privat';
  if (needsSignature) {
    if (typeof data.signature !== 'string' || data.signature.length > 180000 ||
        !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(data.signature))
      reject('invalid-argument', 'Gültige Testunterschrift erforderlich.');
    validatePng(data.signature);
  } else if (data.signature != null) reject('invalid-argument', 'Unterschrift hier nicht erlaubt.');
  return { proofId, signature: needsSignature ? data.signature : null };
}
module.exports = { OFFICE, DRIVER, PolicyError, reject, authorize, identifiers, completion };
