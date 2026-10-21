import {fail,requireRole,fields,id,capture,localDate} from './domain.mjs';
const digest=async input=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(input))))).map(n=>n.toString(16).padStart(2,'0')).join('');
export async function handoverTour(db,uid,p,action,input){
 requireRole(p,'driver');const offer=action==='offerTourHandover';fields(input,offer?['tourId','toUid','completionId','capturedAt']:action==='acceptTourHandover'?['tourId','offerId','completionId','capturedAt']:['tourId','expectedDriverId','completionId','capturedAt']);capture(input);
 const fingerprint=await digest(input),table=offer?'tour_handover_offers':'tour_assignments',existing=await db.prepare('SELECT * FROM '+table+' WHERE id=?').bind(input.completionId).first();
 if(existing){if((offer?existing.from_uid:existing.actor_uid)!==uid||existing.fingerprint!==fingerprint)fail('already-exists','Übergabekennung bereits verwendet.');return {saved:true};}
 const t=await db.prepare('SELECT * FROM tours WHERE id=?').bind(id(input.tourId)).first();if(!t)fail('not-found','Tour fehlt.');
 if(await db.prepare('SELECT 1 FROM self_delivery_tours WHERE tour_id=?').bind(t.id).first())fail('permission-denied','Persönliche Mitnahme-Touren werden nicht weitergegeben.');
 const now=new Date().toISOString(),toUid=offer?id(input.toUid):uid;
 const target=await db.prepare("SELECT * FROM users WHERE uid=? AND active=1 AND EXISTS(SELECT 1 FROM json_each(roles) WHERE value='driver')").bind(toUid).first();if(!target||toUid===t.driver_id)fail('failed-precondition','Anderen aktiven Fahrer auswählen.');
 const from=await db.prepare('SELECT display_name FROM users WHERE uid=?').bind(t.driver_id).first();
 if(offer){
  if(t.driver_id!==uid||t.status!=='running')fail('permission-denied','Nur die eigene laufende Tour kann zur Übergabe angeboten werden.');
  const revision=(await db.prepare('SELECT revision FROM tour_activity_versions WHERE tour_id=?').bind(t.id).first())?.revision||0;
  try{await db.prepare("INSERT INTO tour_handover_offers VALUES (?,?,?,?,?,?,?,'pending',?)").bind(input.completionId,t.id,uid,toUid,revision,now,new Date(Date.now()+15*60000).toISOString(),fingerprint).run();}catch{fail('failed-precondition','Tour oder Fahrerkonto geändert. Bitte neu laden.');}
  return {saved:true};
 }
 let offerId=null;if(action==='takeOverOpenTour'){if(t.date!==localDate()||t.status!=='open'||t.driver_id!==input.expectedDriverId)fail('failed-precondition','Tour wurde inzwischen übernommen oder gestartet. Bitte neu laden.');}
 else{offerId=id(input.offerId);const o=await db.prepare('SELECT * FROM tour_handover_offers WHERE id=? AND tour_id=?').bind(offerId,t.id).first();if(!o||o.to_uid!==uid||o.from_uid!==t.driver_id||o.status!=='pending'||o.expires_at<=now)fail('failed-precondition','Übergabe nicht mehr verfügbar. Bitte neu anbieten lassen.');}
 try{await db.prepare('INSERT INTO tour_assignments VALUES (?,?,?,?,?,?,?,?,?,?,?)').bind(input.completionId,t.id,t.driver_id,uid,uid,offerId?'confirmed':'direct',offerId,JSON.stringify({fromName:from?.display_name||'Noch nicht zugewiesen',toName:target.display_name,vehicleLabel:t.vehicle_label||null}),fingerprint,now,t.created_at).run();}catch{const saved=await db.prepare('SELECT fingerprint,actor_uid FROM tour_assignments WHERE id=?').bind(input.completionId).first();if(saved?.actor_uid!==uid||saved?.fingerprint!==fingerprint)fail('failed-precondition','Tour wurde inzwischen geändert. Erneute Übergabe erforderlich.');}
 return {saved:true,tourId:t.id};
}
export async function handoverState(db,uid,view,tours){
 const ids=JSON.stringify(tours.map(t=>t.id));
 const events=(await db.prepare('SELECT id,tour_id,from_uid,to_uid,kind,created_at,data FROM tour_assignments WHERE tour_id IN(SELECT value FROM json_each(?)) ORDER BY created_at,id').bind(ids).all()).results;
 const offered=(await db.prepare("SELECT o.*,u.display_name AS to_name FROM tour_handover_offers o JOIN users u ON u.uid=o.to_uid WHERE o.from_uid=? AND o.status='pending' AND o.expires_at>? AND o.activity_revision=COALESCE((SELECT revision FROM tour_activity_versions v WHERE v.tour_id=o.tour_id),0)").bind(uid,new Date().toISOString()).all()).results;
 for(const t of tours){const history=events.filter(e=>e.tour_id===t.id);t.assignmentHistory=history.map(e=>({kind:e.kind,createdAt:e.created_at,...JSON.parse(e.data)}));t.startedBy=history.find(e=>e.kind==='confirmed')?.from_uid||t.driverId;const o=offered.find(o=>o.tour_id===t.id);if(o)t.handoverOffer={toName:o.to_name,expiresAt:o.expires_at};}
 if(view!=='driver')return {incomingHandovers:[],handoverDrivers:[]};
 const incoming=(await db.prepare("SELECT o.id,o.tour_id AS tourId,o.expires_at AS expiresAt,t.type,t.vehicle_label AS vehicleLabel,u.display_name AS fromName FROM tour_handover_offers o JOIN tours t ON t.id=o.tour_id JOIN users u ON u.uid=o.from_uid WHERE o.to_uid=? AND o.status='pending' AND t.status='running' AND t.driver_id=o.from_uid AND o.expires_at>? AND o.activity_revision=COALESCE((SELECT revision FROM tour_activity_versions v WHERE v.tour_id=t.id),0) AND u.active=1 LIMIT 101").bind(uid,new Date().toISOString()).all()).results;
 const drivers=(await db.prepare("SELECT uid,display_name AS displayName FROM users WHERE active=1 AND uid!=? AND EXISTS(SELECT 1 FROM json_each(roles) WHERE value='driver') ORDER BY display_name LIMIT 101").bind(uid).all()).results;
 return {incomingHandovers:incoming,handoverDrivers:drivers};
}
