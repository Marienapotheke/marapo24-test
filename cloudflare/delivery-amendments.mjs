import {fail,fields,id,text,capture} from './domain.mjs';
import {checkAssignedDelivery,requireDeliveryAccess} from './delivery-access.mjs';
import {payment,collected} from './payment.mjs';
const digest=async input=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(input))))).map(n=>n.toString(16).padStart(2,'0')).join('');
export async function amendDelivery(db,uid,p,action,input){
 requireDeliveryAccess(p);fields(input,action==='reopenDelivery'?['tourId','stopId','baseRevision','reason','cashCleared','completionId','capturedAt']:['tourId','stopId','baseRevision','reason','cents','collectedCents','collectionReason','completionId','capturedAt']);capture(input);
 const fingerprint=await digest(input),existing=await db.prepare('SELECT * FROM delivery_amendments WHERE id=?').bind(input.completionId).first();
 if(existing){if(existing.actor_uid!==uid||existing.fingerprint!==fingerprint)fail('already-exists','Korrekturkennung bereits verwendet.');return {saved:true,replacementId:JSON.parse(existing.data).replacementId};}
 const tour=await db.prepare('SELECT * FROM tours WHERE id=?').bind(id(input.tourId)).first();if(!tour)fail('not-found','Tour fehlt.');await checkAssignedDelivery(db,uid,p,tour);
 if(!Number.isSafeInteger(input.baseRevision)||input.baseRevision<0)fail('invalid-argument','Korrekturversion prüfen.');
 const stop=await db.prepare('SELECT * FROM stops WHERE id=? AND tour_id=?').bind(id(input.stopId),tour.id).first();if(!stop)fail('not-found','Päckchen fehlt.');
 const history=(await db.prepare('SELECT * FROM delivery_amendments WHERE stop_id=? ORDER BY revision').bind(stop.id).all()).results;
 if(history.some(h=>h.kind==='reopen')||input.baseRevision!==(history.at(-1)?.revision||0))fail('failed-precondition','Päckchen inzwischen korrigiert. Bitte neu laden.');
 if(await db.prepare('SELECT 1 FROM cash_settlements WHERE tour_id=?').bind(tour.id).first())fail('failed-precondition','Bereits abgerechnete Fahrten können nicht korrigiert werden.');
 const data=JSON.parse(stop.data),proof=stop.proof_id?JSON.parse((await db.prepare('SELECT data FROM proofs WHERE id=?').bind(stop.proof_id).first()).data):null;
 const previous=history.filter(h=>h.kind==='money'&&h.proof_id===stop.proof_id).at(-1),effective=previous?JSON.parse(previous.data):proof||{...data,collectedCents:0};
 const reason=text(input.reason,240,true);if(reason.length<3)fail('invalid-argument','Bitte einen nachvollziehbaren Korrekturgrund eingeben.');
 const kind=action==='reopenDelivery'?'reopen':'money',now=new Date().toISOString();let receipt={collectedCents:0,collectionReason:'',collectionConfirmed:true};
 if(kind==='reopen'){if(tour.status!=='running'||!proof)fail('failed-precondition','Nur bestätigte Abschlüsse einer laufenden Tour können wieder geöffnet werden.');if(input.cashCleared!==true)fail('invalid-argument','Vor dem Wiederöffnen bestätigen: kein Geld kassiert oder vollständig zurückgegeben.');}
 else{
  if(!(tour.status==='running'||tour.status==='finished'&&proof))fail('failed-precondition','Betragskorrektur erst während der Fahrt oder vor der Abrechnung.');
  if(!Number.isSafeInteger(input.cents)||input.cents<0||input.cents>999999||(['pflege','partner'].includes(data.type)&&input.cents!==0))fail('invalid-argument','Betrag prüfen; Pflege- und Partnerstopps bleiben bei 0 €.');
  try{receipt=payment({collectedCents:input.collectedCents,collectionReason:input.collectionReason},input.cents,stop.status);}catch(e){fail('invalid-argument',e.message);}
  if(input.cents===effective.cents&&input.collectedCents===collected({...effective,status:stop.status}))fail('invalid-argument','Es wurde kein Betrag geändert.');
 }
 const record={reason,actorName:p.displayName,previousCents:effective.cents,previousCollectedCents:collected({...effective,status:stop.status}),cents:kind==='reopen'?effective.cents:input.cents,...receipt,...(kind==='reopen'?{cashCleared:true,replacementId:crypto.randomUUID()}:{})};
 try{await db.prepare('INSERT INTO delivery_amendments VALUES (?,?,?,?,?,?,?,?,?,?,?)').bind(input.completionId,tour.id,stop.id,stop.proof_id,uid,input.baseRevision+1,kind,JSON.stringify(record),fingerprint,now,proof?.completedAt||stop.created_at).run();}
 catch(e){const winner=await db.prepare('SELECT actor_uid,fingerprint,data FROM delivery_amendments WHERE id=?').bind(input.completionId).first();if(winner?.actor_uid===uid&&winner.fingerprint===fingerprint)return {saved:true,replacementId:JSON.parse(winner.data).replacementId};fail('failed-precondition','Tour, Abrechnung oder Päckchen inzwischen geändert. Bitte neu laden.');}
 return {saved:true,replacementId:record.replacementId};
}
export async function applyAmendments(db,tourIds,stops){
 if(!tourIds.length)return;
 const rows=(await db.prepare('SELECT * FROM delivery_amendments WHERE tour_id IN(SELECT value FROM json_each(?)) ORDER BY stop_id,revision LIMIT 10001').bind(JSON.stringify(tourIds)).all()).results;
 if(rows.length>10000)fail('resource-exhausted','Zu viele Korrekturen für eine Übersicht. Bitte Büro informieren.');const byStop=new Map();for(const row of rows){if(!byStop.has(row.stop_id))byStop.set(row.stop_id,[]);byStop.get(row.stop_id).push(row);}
 for(const items of Object.values(stops))for(const stop of items){const history=byStop.get(stop.id)||[];stop.amendmentRevision=history.at(-1)?.revision||0;stop.corrections=history.map(a=>({id:a.id,kind:a.kind,afterCompletion:!!a.proof_id,createdAt:a.created_at,actorUid:a.actor_uid,...JSON.parse(a.data)}));const last=history.filter(a=>a.kind==='money'&&a.proof_id&&a.proof_id===stop.proofId).at(-1);if(last){const amount=JSON.parse(last.data);stop.cents=amount.cents;stop.collectedCents=amount.collectedCents;stop.collectionReason=amount.collectionReason;stop.collectionConfirmed=true;}const reopened=history.find(a=>a.kind==='reopen');if(reopened){stop.voided=true;stop.replacementStopId=JSON.parse(reopened.data).replacementId;}}
}
export async function proofAmendments(db,proof){const rows=(await db.prepare('SELECT kind,proof_id,created_at,data FROM delivery_amendments WHERE stop_id=? ORDER BY revision').bind(proof.stopId).all()).results;return {...proof,corrections:rows.map(a=>({kind:a.kind,afterCompletion:!!a.proof_id,createdAt:a.created_at,...JSON.parse(a.data)})),voided:rows.some(a=>a.kind==='reopen')};}
