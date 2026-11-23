import {fail,fields,id,text,capture,requireRole} from './domain.mjs';
import {odometer} from './tour-workflow.mjs';
import {cutoffFor} from './retention.mjs';
export async function odometerHistory(db,tourId){return (await db.prepare('SELECT * FROM tour_odometer_corrections WHERE tour_id=? ORDER BY revision').bind(tourId).all()).results;}
export function effectiveOdometer(tour,history,kind){return history.filter(row=>row.kind===kind).at(-1)?.corrected_km??tour[kind+'_odometer'];}
export async function correctTourOdometer(db,uid,profile,input){
 requireRole(profile,'driver');fields(input,['tourId','kind','odometerKm','baseRevision','reason','completionId','capturedAt']);capture(input);id(input.tourId);
 if(!['start','end'].includes(input.kind)||!Number.isSafeInteger(input.baseRevision)||input.baseRevision<0)fail('invalid-argument','Kilometerkorrektur prüfen.');
 let km;try{km=odometer(input.odometerKm);}catch(error){fail('invalid-argument',error.message);}
 const reason=text(input.reason,240,true);if(reason.length<3)fail('invalid-argument','Bitte einen nachvollziehbaren Korrekturgrund eingeben.');
 const fingerprint=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(input))))).map(n=>n.toString(16).padStart(2,'0')).join('');
 const existing=await db.prepare('SELECT actor_uid,fingerprint FROM tour_odometer_corrections WHERE id=?').bind(input.completionId).first();
 if(existing){if(existing.actor_uid!==uid||existing.fingerprint!==fingerprint)fail('already-exists','Korrekturkennung bereits verwendet.');return {saved:true};}
 const tour=await db.prepare('SELECT * FROM tours WHERE id=?').bind(input.tourId).first();if(!tour)fail('not-found','Tour fehlt.');if(tour.driver_id!==uid)fail('permission-denied','Tour nicht zugewiesen.');if(tour.created_at<cutoffFor())fail('failed-precondition','Aufbewahrungsfrist dieser Tour ist abgelaufen.');
 if(await db.prepare('SELECT 1 FROM self_delivery_tours WHERE tour_id=?').bind(tour.id).first())fail('failed-precondition','Bei Mitarbeiter-Mitnahme keine Kilometerkorrektur.');
 if(await db.prepare('SELECT 1 FROM cash_settlements WHERE tour_id=?').bind(tour.id).first())fail('failed-precondition','Diese Tour ist bereits abgerechnet.');
 if(input.kind==='start'?tour.status!=='running':tour.status!=='finished')fail('failed-precondition',input.kind==='start'?'Startkilometer nur während der laufenden Tour korrigieren.':'Endkilometer erst nach Tourende und vor der Abrechnung korrigieren.');
 const history=await odometerHistory(db,tour.id),previous=effectiveOdometer(tour,history,input.kind);
 if(input.baseRevision!==(history.at(-1)?.revision||0))fail('failed-precondition','Kilometer inzwischen korrigiert. Bitte neu laden.');
 if(previous==null)fail('failed-precondition','Kein ursprünglicher Kilometerstand vorhanden.');if(previous===km)fail('invalid-argument','Es wurde kein Kilometerstand geändert.');
 if(input.kind==='end'&&km<(effectiveOdometer(tour,history,'start')??0))fail('invalid-argument','End-Kilometerstand darf nicht unter dem Start liegen.');
 try{await db.prepare('INSERT INTO tour_odometer_corrections VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(input.completionId,tour.id,uid,profile.displayName,input.kind,input.baseRevision+1,previous,km,reason,fingerprint,input.capturedAt,new Date().toISOString(),tour.created_at).run();}
 catch(error){const winner=await db.prepare('SELECT actor_uid,fingerprint FROM tour_odometer_corrections WHERE id=?').bind(input.completionId).first();if(winner?.actor_uid===uid&&winner.fingerprint===fingerprint)return {saved:true};fail('failed-precondition','Tour, Kilometerstand oder Abrechnung inzwischen geändert. Bitte neu laden.');}
 return {saved:true};
}
export async function applyOdometerCorrections(db,tours){
 if(!tours.length)return;
 const rows=(await db.prepare('SELECT * FROM tour_odometer_corrections WHERE tour_id IN(SELECT value FROM json_each(?)) ORDER BY revision LIMIT 10001').bind(JSON.stringify(tours.map(t=>t.id))).all()).results;
 if(rows.length>10000)fail('resource-exhausted','Zu viele Kilometerkorrekturen. Bitte Büro informieren.');
 for(const tour of tours){const history=rows.filter(row=>row.tour_id===tour.id);tour.originalStartOdometerKm=tour.startOdometerKm;tour.originalEndOdometerKm=tour.endOdometerKm;tour.odometerRevision=history.at(-1)?.revision||0;tour.odometerCorrections=history.map(row=>({id:row.id,kind:row.kind,revision:row.revision,previousKm:row.previous_km,odometerKm:row.corrected_km,reason:row.reason,actorUid:row.actor_uid,actorName:row.actor_name,capturedAt:row.captured_at,createdAt:row.created_at}));for(const row of history)tour[row.kind==='start'?'startOdometerKm':'endOdometerKm']=row.corrected_km;}
}
