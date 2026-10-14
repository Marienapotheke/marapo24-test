export const RETENTION_POLICY='one-year-v1';
export const LIVE_DAYS=364,BACKUP_DAYS=30;
const day=86400000;
export function cutoffFor(now=new Date()){if(!Number.isFinite(+now)||+now<Date.parse('2020-01-01'))throw Error('Invalid retention clock');return new Date(+now-LIVE_DAYS*day).toISOString();}
export function backupExpiry(createdAt,oldestData){const created=Date.parse(createdAt),oldest=oldestData?Date.parse(oldestData):created;if(!Number.isFinite(created)||!Number.isFinite(oldest))throw Error('Invalid backup age');return new Date(Math.min(created+BACKUP_DAYS*day,oldest+LIVE_DAYS*day)).toISOString();}
export function deletionStatements(cutoff,withCash=false){const statements=[
 ["DROP TRIGGER proof_immutable_delete",[]],
 ["DELETE FROM proofs WHERE id IN (SELECT id FROM proofs WHERE json_extract(data,'$.completedAt') < ? LIMIT 1000)",[cutoff]],
 ["CREATE TRIGGER proof_immutable_delete BEFORE DELETE ON proofs BEGIN SELECT RAISE(ABORT,'immutable proof'); END",[]],
 ["DELETE FROM stops WHERE id IN (SELECT s.id FROM stops s LEFT JOIN proofs p ON p.id=s.proof_id WHERE coalesce(s.completed_at,s.created_at) < ? AND p.id IS NULL LIMIT 1000)",[cutoff]],
 ["DELETE FROM tour_orders WHERE tour_id IN (SELECT id FROM tours WHERE created_at < ? AND NOT EXISTS(SELECT 1 FROM stops WHERE tour_id=tours.id))",[cutoff]],
 ["DELETE FROM tours WHERE created_at < ? AND NOT EXISTS(SELECT 1 FROM stops WHERE tour_id=tours.id)",[cutoff]],
 ["DELETE FROM customers WHERE id IN (SELECT id FROM customers WHERE last_delivered_at < ? LIMIT 1000)",[cutoff]],
 ["DELETE FROM address_locations WHERE id IN (SELECT id FROM address_locations WHERE updated_at < ? LIMIT 1000)",[cutoff]],
 ["DELETE FROM routing_usage WHERE day < ?",[cutoff.slice(0,10)]]
 ];if(withCash)statements.push(
 ["DROP TRIGGER cash_settlement_immutable_delete",[]],
 ["DELETE FROM cash_settlements WHERE tour_id IN (SELECT tour_id FROM cash_settlements WHERE retention_at < ? LIMIT 1000)",[cutoff]],
 ["CREATE TRIGGER cash_settlement_immutable_delete BEFORE DELETE ON cash_settlements BEGIN SELECT RAISE(ABORT,'immutable cash settlement'); END",[]]);return statements;}
export async function purgeExpired(db,{policy,now=new Date()}={}){
 if(policy!==RETENTION_POLICY)throw Error('Retention activation requires explicit policy approval');
 const guard=await db.prepare("SELECT sql FROM sqlite_master WHERE type='trigger' AND name='proof_immutable_delete'").first();
 if(!guard?.sql?.includes('BEFORE DELETE ON proofs')||!guard.sql.includes("RAISE(ABORT,'immutable proof')"))throw Error('Unexpected archive protection; cleanup stopped');
 const withCash=!!(await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='cash_settlements'").first());
 if(withCash){const cashGuard=await db.prepare("SELECT sql FROM sqlite_master WHERE type='trigger' AND name='cash_settlement_immutable_delete'").first();if(!cashGuard?.sql?.includes('BEFORE DELETE ON cash_settlements')||!cashGuard.sql.includes("RAISE(ABORT,'immutable cash settlement')"))throw Error('Unexpected cash archive protection; cleanup stopped');}
 const cutoff=cutoffFor(now),results=await db.batch(deletionStatements(cutoff,withCash).map(([sql,values])=>values.length?db.prepare(sql).bind(...values):db.prepare(sql)));
 return {checkedAt:now.toISOString(),cutoff,maximumLiveDays:LIVE_DAYS,deleted:{proofs:results[1].meta.changes,stops:results[3].meta.changes,tourOrders:results[4].meta.changes,tours:results[5].meta.changes,customers:results[6].meta.changes,addressLocations:results[7].meta.changes,cashSettlements:withCash?results[10].meta.changes:0}};
}
export function oldestBackupData(db){
 const tables=new Set(db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r=>r.name));
 const queries=[['stops','SELECT coalesce(completed_at,created_at) AS at FROM stops'],['proofs',"SELECT json_extract(data,'$.completedAt') AS at FROM proofs"],['customers','SELECT last_delivered_at AS at FROM customers'],['address_locations','SELECT updated_at AS at FROM address_locations'],['cash_settlements','SELECT retention_at AS at FROM cash_settlements']].filter(([name])=>tables.has(name)).map(([,sql])=>sql);
 const value=queries.length?db.prepare('SELECT min(at) AS at FROM ('+queries.join(' UNION ALL ')+')').get().at:null;
 if(value!==null&&!Number.isFinite(Date.parse(value)))throw Error('Invalid source data age');return value;
}
export function verifyCashArchive(db){
 if(!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='cash_settlements'").get())return null;
 for(const [name,expected] of [['cash_settlement_insert_guard','BEFORE INSERT ON cash_settlements'],['cash_settlement_immutable_update','BEFORE UPDATE ON cash_settlements'],['cash_settlement_immutable_delete','BEFORE DELETE ON cash_settlements']]){const row=db.prepare("SELECT sql FROM sqlite_master WHERE type='trigger' AND name=?").get(name);if(!row?.sql?.includes(expected)||!row.sql.includes('RAISE(ABORT,'))throw Error('Cash protections missing from restored archive.');}
 return db.prepare('SELECT count(*) n FROM cash_settlements').get().n;
}
