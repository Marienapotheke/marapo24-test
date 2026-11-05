import {hasRole,fail} from './domain.mjs';
export function requireDeliveryAccess(p){if(!hasRole(p,'driver')&&!hasRole(p,'office'))fail('permission-denied','Kein aktiver Zustellzugang.');}
export async function checkAssignedDelivery(db,uid,p,t){
 requireDeliveryAccess(p);if(t.driver_id!==uid)fail('permission-denied','Tour ist einer anderen Person zugewiesen.');
 if(!hasRole(p,'driver')&&!(await db.prepare('SELECT 1 FROM self_delivery_tours WHERE tour_id=? AND office_uid=?').bind(t.id,uid).first()))fail('permission-denied','Bürozugänge dürfen nur eigene Mitnahme-Touren ausliefern.');
}
// Only use inside statements that already bind the actor to the assigned tour.
export const deliveryActorSql="EXISTS(SELECT 1 FROM users WHERE uid=? AND active=1 AND (EXISTS(SELECT 1 FROM json_each(users.roles) WHERE value='driver') OR (EXISTS(SELECT 1 FROM json_each(users.roles) WHERE value='office') AND EXISTS(SELECT 1 FROM self_delivery_tours m WHERE m.tour_id=tours.id AND m.office_uid=users.uid))))";
