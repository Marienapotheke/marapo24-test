import policy from '../functions/policy.cjs';
import {fail,fields,id,capture,text} from './domain.mjs';
import {requireDeliveryAccess,checkAssignedDelivery} from './delivery-access.mjs';
import {openWebEnvelope} from './web-envelope.mjs';
import {dueCents,parcelCount} from './stop-details.mjs';

// Cancellation is an immutable archive entry, never a physical deletion of a running stop.
// The existing proof transaction atomically checks assignment/open state and closes the stop.
export async function removePackage(db,uid,p,input,env){
 requireDeliveryAccess(p);fields(input,['tourId','stopId','completionId','capturedAt','sealedSignature']);capture(input);
 const tourId=id(input.tourId),stopId=id(input.stopId),proofId=policy.identifiers(input);
 const fingerprint=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(input))))).map(n=>n.toString(16).padStart(2,'0')).join('');
 const prior=()=>db.prepare('SELECT * FROM proofs WHERE id=?').bind(proofId).first();
 const same=row=>row?.driver_id===uid&&row.completion_id===input.completionId&&row.fingerprint===fingerprint;
 const existing=await prior();if(existing){if(same(existing))return {completed:true};fail('already-exists','Päckchen bereits abgeschlossen oder entfernt.');}
 const tour=await db.prepare('SELECT * FROM tours WHERE id=?').bind(tourId).first();if(!tour)fail('not-found','Tour fehlt.');await checkAssignedDelivery(db,uid,p,tour);
 if(tour.status!=='running')fail('failed-precondition','Entfernen ist nur während der laufenden Tour möglich.');
 const stop=await db.prepare('SELECT * FROM stops WHERE id=? AND tour_id=?').bind(stopId,tourId).first();
 if(!stop||stop.status!=='offen'||stop.proof_id)fail('failed-precondition','Nur offene Päckchen dürfen entfernt werden.');
 const opened=await openWebEnvelope(input.sealedSignature,{uid,tourId,stopId,completionId:input.completionId},env.DELIVERY_PROOF_PRIVATE_KEY);
 if(opened.capturedAt!==input.capturedAt||opened.signature!==null)fail('invalid-argument','Entfernungsbestätigung prüfen.');
 const reason=text(opened.driverComment,240,true);if(reason.length<3)fail('invalid-argument','Bitte einen nachvollziehbaren Entfernungsgrund eingeben.');
 const original=JSON.parse(stop.data),data={...original,parcelCount:parcelCount(original.parcelCount),originalCents:dueCents(original),cents:dueCents(original),collectedCents:0,collectionReason:'',collectionConfirmed:true,kind:'package-removal',removed:true,removalReason:reason,removedBy:uid,removedByName:p.displayName,tourId,stopId,driverId:uid,status:'nicht zugestellt',completedAt:new Date().toISOString(),capturedAtClient:input.capturedAt,signature:null,signatureSha256:null};
 try{await db.prepare('INSERT INTO proofs VALUES (?,?,?,?,?,?,?)').bind(proofId,tourId,stopId,uid,input.completionId,fingerprint,JSON.stringify(data)).run();}
 catch{if(same(await prior()))return {completed:true};fail('failed-precondition','Päckchen oder Tour inzwischen geändert. Bitte neu laden.');}
 return {completed:true};
}
