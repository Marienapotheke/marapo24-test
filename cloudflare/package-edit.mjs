import {fail,fields,id,hasRole,requireRole,packageData} from './domain.mjs';
export async function editPackage(db,uid,p,action,input){
 const office=hasRole(p,'office');if(!office)requireRole(p,'driver');
 const stopId=id(input.stopId),tourId=id(input.tourId),revision=input.baseRevision;
 if(!Number.isSafeInteger(revision)||revision<0||revision>=Number.MAX_SAFE_INTEGER)fail('invalid-argument','Päckchenversion prüfen.');
 const t=await db.prepare('SELECT * FROM tours WHERE id=?').bind(tourId).first();if(!t)fail('not-found','Tour fehlt.');if(!office&&t.driver_id!==uid)fail('permission-denied','Nur eigene Päckchen dürfen geändert werden.');if(t.status!=='open')fail('failed-precondition','Päckchen dürfen nur vor Tourstart geändert oder gelöscht werden.');
 const permission="status='offen' AND proof_id IS NULL AND COALESCE(json_extract(data,'$._editVersion'),0)=? AND EXISTS(SELECT 1 FROM tours WHERE id=stops.tour_id AND status='open' AND (driver_id=? OR ?=1)) AND EXISTS(SELECT 1 FROM users WHERE uid=? AND active=1 AND EXISTS(SELECT 1 FROM json_each(users.roles) WHERE value=?))";
 const args=[stopId,tourId,revision,uid,office?1:0,uid,office?'office':'driver'];let mutation;
 if(action==='deletePackage'){fields(input,['tourId','stopId','baseRevision']);mutation=db.prepare('DELETE FROM stops WHERE id=? AND tour_id=? AND '+permission).bind(...args);}
 else{const {stopId:ignored,baseRevision:ignoredRevision,...data}=input;
  // An older open app does not send counts. Preserve an already recorded count on edits.
  if(data.parcelCount===undefined){const previous=await db.prepare('SELECT data FROM stops WHERE id=? AND tour_id=?').bind(stopId,tourId).first();if(previous)data.parcelCount=JSON.parse(previous.data).parcelCount;}
  const parsed=packageData(data,{regularType:t.regular_type});mutation=db.prepare('UPDATE stops SET data=? WHERE id=? AND tour_id=? AND '+permission).bind(JSON.stringify({...parsed,_editVersion:revision+1}),...args);}
 // Both statements share a D1 transaction. Only a successful preceding mutation advances the plan.
 const plan=action==='deletePackage'?"(SELECT json_group_array(value) FROM (SELECT value FROM json_each(tour_orders.stop_ids) WHERE value!=? ORDER BY key))":'tour_orders.stop_ids';
 const order=db.prepare("INSERT INTO tour_orders(tour_id,stop_ids,revision,updated_at) SELECT ?,COALESCE((SELECT json_group_array(id) FROM (SELECT id FROM stops WHERE tour_id=? AND status='offen' ORDER BY created_at,id)),'[]'),1,? WHERE changes()=1 ON CONFLICT(tour_id) DO UPDATE SET stop_ids="+plan+",revision=tour_orders.revision+1,updated_at=excluded.updated_at").bind(tourId,tourId,new Date().toISOString(),...(action==='deletePackage'?[stopId]:[]));
 const result=await db.batch([mutation,order]);if(result[0].meta.changes<1)fail('failed-precondition','Päckchen oder Tour wurde inzwischen geändert. Bitte neu laden.');return action==='deletePackage'?{deleted:true}:{updated:true};
}
