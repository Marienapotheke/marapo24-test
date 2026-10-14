import {fields,requireRole,id,text,fail,capture} from './domain.mjs';
import {openWebEnvelope} from './web-envelope.mjs';
import {validatePng} from './png.mjs';
import {cutoffFor} from './retention.mjs';
const digest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',value))).map(x=>x.toString(16).padStart(2,'0')).join('');
export async function cashSettlement(db,uid,p,action,input,env){
 if(action==='downloadCashSettlement'){
  requireRole(p,'office');fields(input,['tourId']);const row=await db.prepare("SELECT data FROM cash_settlements WHERE tour_id=? AND EXISTS(SELECT 1 FROM users WHERE uid=? AND active=1 AND EXISTS(SELECT 1 FROM json_each(users.roles) WHERE value='office'))").bind(id(input.tourId),uid).first();
  if(!row)fail('not-found','Abrechnungsnachweis fehlt oder Zugriff geändert.');return {proof:JSON.parse(row.data),filename:'Abrechnung-Marienapotheke-'+input.tourId+'.pdf'};
 }
 requireRole(p,'driver');fields(input,['tourId','signerName','collectedCents','completionId','capturedAt','sealedSignature']);capture(input);
 const tour=await db.prepare('SELECT * FROM tours WHERE id=?').bind(id(input.tourId)).first();if(!tour||tour.driver_id!==uid)fail('permission-denied','Abrechnung gehört zu einem anderen Fahrer.');
 if(tour.status!=='finished')fail('failed-precondition','Zuerst Tourende vollständig übertragen und bestätigen lassen.');
 if(tour.created_at<cutoffFor())fail('failed-precondition','Aufbewahrungsfrist dieser Tour ist abgelaufen.');
 const name=text(input.signerName,80,true);if(name.length<2||!Number.isSafeInteger(input.collectedCents)||input.collectedCents<0)fail('invalid-argument','Name und Abrechnungsbetrag prüfen.');
 const fingerprint=await digest(new TextEncoder().encode(JSON.stringify(input))),existing=await db.prepare('SELECT * FROM cash_settlements WHERE tour_id=?').bind(tour.id).first();
 if(existing){if(existing.driver_id===uid&&existing.completion_id===input.completionId&&existing.fingerprint===fingerprint)return {saved:true};fail('already-exists','Die Abrechnung ist bereits unterschrieben.');}
 const identity={uid,tourId:tour.id,purpose:'marien-cash-settlement',completionId:input.completionId};const opened=await openWebEnvelope(input.sealedSignature,identity,env.DELIVERY_PROOF_PRIVATE_KEY);
 if(opened.capturedAt!==input.capturedAt)fail('invalid-argument','Erfassungszeit verändert.');await validatePng(opened.signature);
 const amount=await db.prepare("SELECT coalesce(sum(coalesce(json_extract(data,'$.collectedCents'),json_extract(data,'$.cents'))),0) cents FROM proofs WHERE tour_id=? AND json_extract(data,'$.status')='zugestellt' AND json_extract(data,'$.origin')='Marienapotheke'").bind(tour.id).first();
 if(amount.cents!==input.collectedCents)fail('failed-precondition','Abrechnungsbetrag geändert. Tour aktualisieren und erneut prüfen.');
 const data={kind:'cash-settlement',origin:'Marienapotheke',tourId:tour.id,tourType:tour.type,tourDate:tour.date,driverId:uid,driverName:p.displayName,signerName:name,signerIdentity:'name-entered-on-driver-device',collectedCents:amount.cents,tourEndedAt:tour.ended_at,capturedAtClient:input.capturedAt,completedAt:new Date().toISOString(),retentionAt:tour.created_at,signature:opened.signature,signatureSha256:await digest(Buffer.from(opened.signature.slice(22),'base64'))};
 try{await db.prepare('INSERT INTO cash_settlements VALUES (?,?,?,?,?,?,?)').bind(tour.id,uid,input.completionId,fingerprint,amount.cents,tour.created_at,JSON.stringify(data)).run();}
 catch(error){const saved=await db.prepare('SELECT * FROM cash_settlements WHERE tour_id=?').bind(tour.id).first();if(saved){if(saved.completion_id===input.completionId&&saved.fingerprint===fingerprint)return {saved:true};fail('already-exists','Die Abrechnung ist bereits unterschrieben.');}throw error;}
 return {saved:true};
}
