'use strict';
const {authorize,reject}=require('./policy.cjs');
function validateTourAction(input,uid,profile,tour){
 authorize(uid,profile,'driver');
 if(!input||Object.keys(input).some(k=>!['tourId','completionId','capturedAt','vehicleId'].includes(k))||typeof input.tourId!=='string'||!/^[A-Za-z0-9_-]{1,128}$/.test(input.tourId)||typeof input.completionId!=='string'||!/^[0-9a-f-]{36}$/i.test(input.completionId)||typeof input.capturedAt!=='string'||input.capturedAt.length>40)reject('invalid-argument','Ungültiger Tourvorgang.');
 if(!tour)reject('not-found','Tour nicht gefunden.');
 if(tour.driverId!==uid)reject('permission-denied','Tour nicht zugewiesen.');
 const stamp=Date.parse(input.capturedAt);
 if(!Number.isFinite(stamp)||stamp>Date.now()+300000||Date.now()-stamp>172800000)reject('failed-precondition','Gerätezeit oder Offline-Vorgang prüfen.');
 if(input.vehicleId!==undefined&&(typeof input.vehicleId!=='string'||!/^[A-Za-z0-9_-]{1,128}$/.test(input.vehicleId)))reject('invalid-argument','Fahrzeug auswählen.');
}
function canStart(tour,vehicle){if(tour.status!=='open')reject('already-exists','Tour wurde bereits gestartet.');if(!vehicle||vehicle.active!==true)reject('failed-precondition','Fahrzeug ist nicht freigegeben.');}
function canFinish(tour,stops){if(tour.status!=='running')reject('failed-precondition','Tour muss zuerst gestartet werden.');if(stops.some(s=>!['zugestellt','nicht zugestellt'].includes(s.status)))reject('failed-precondition','Zuerst alle Stopps abschließen und übertragen.');}
module.exports={validateTourAction,canStart,canFinish};
