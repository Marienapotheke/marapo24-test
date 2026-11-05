import {requireDeliveryAccess} from './delivery-access.mjs';import {fields,id,fail} from './domain.mjs';
export async function deleteOwnTour(db,uid,p,input){
 requireDeliveryAccess(p);fields(input,['tourId','baseRevision','expectedDriverId']);id(input.tourId);if(!Number.isSafeInteger(input.baseRevision)||input.baseRevision<0)fail('invalid-argument','Tourversion prüfen.');
 const t=await db.prepare('SELECT * FROM tours WHERE id=?').bind(input.tourId).first();if(!t)return {deleted:true};
 if(t.created_by!==uid)fail('permission-denied','Nur selbst angelegte Touren dürfen gelöscht werden.');
 if(t.driver_id!==input.expectedDriverId)fail('failed-precondition','Tour wurde inzwischen übernommen. Bitte neu laden.');
 if(t.status!=='open'||t.started_at||t.start_id)fail('failed-precondition','Nur noch nicht gestartete Touren dürfen gelöscht werden.');
 // One DELETE plus its child-cleanup trigger is one transaction. A start, claim,
 // edit or new package that wins first must make this reviewed snapshot fail.
 const result=await db.prepare(`DELETE FROM tours WHERE id=? AND created_by=? AND status='open' AND started_at IS NULL AND start_id IS NULL
 AND COALESCE((SELECT revision FROM tour_activity_versions WHERE tour_id=tours.id),0)=?
 AND driver_id IS ?
 AND EXISTS(SELECT 1 FROM users WHERE uid=? AND active=1 AND EXISTS(SELECT 1 FROM json_each(users.roles) WHERE value IN('office','driver')))
 AND NOT EXISTS(SELECT 1 FROM proofs WHERE tour_id=tours.id)
 AND NOT EXISTS(SELECT 1 FROM cash_settlements WHERE tour_id=tours.id)
 AND NOT EXISTS(SELECT 1 FROM stops WHERE tour_id=tours.id AND (status!='offen' OR proof_id IS NOT NULL))`).bind(t.id,uid,input.baseRevision,t.driver_id,uid).run();
 if(result.meta.changes<1)fail('failed-precondition','Tour wurde inzwischen geändert oder übernommen. Bitte neu laden.');return {deleted:true};
}
export async function deletionState(db,tours){if(!tours.length)return;const rows=(await db.prepare('SELECT tour_id,revision FROM tour_activity_versions WHERE tour_id IN(SELECT value FROM json_each(?))').bind(JSON.stringify(tours.map(t=>t.id))).all()).results;const revisions=new Map(rows.map(r=>[r.tour_id,r.revision]));for(const t of tours)t.activityRevision=revisions.get(t.id)||0;}
