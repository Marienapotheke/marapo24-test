import {requireRole,fields,capture,localDate,fail} from './domain.mjs';
export async function startWork(db,uid,p,input){
 requireRole(p,'driver');fields(input,['completionId','capturedAt']);capture(input);
 const day=localDate(),now=new Date().toISOString();
 await db.prepare("INSERT OR IGNORE INTO work_starts SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM users WHERE uid=? AND active=1 AND EXISTS(SELECT 1 FROM json_each(users.roles) WHERE value='driver'))").bind(uid,day,now,input.capturedAt,input.completionId,uid).run();
 const workStart=await db.prepare('SELECT day,started_at AS startedAt,captured_at AS capturedAt FROM work_starts WHERE uid=? AND day=?').bind(uid,day).first();if(!workStart)fail('permission-denied','Fahrerzugang nicht mehr aktiv.');return {workStart};
}
export async function workStartState(db,uid,view,date,tours){
 const rows=(await db.prepare('SELECT uid,(SELECT display_name FROM users WHERE users.uid=work_starts.uid) AS actorName,day,started_at AS startedAt,captured_at AS capturedAt FROM work_starts WHERE day=?'+(view==='office'?'':' AND uid=?')).bind(date,...(view==='office'?[]:[uid])).all()).results;
 for(const t of tours){const starter=t.startedBy||t.driverId;t.workStart=rows.find(w=>w.uid===starter&&w.day===t.date)||null;const first=tours.filter(other=>(other.startedBy||other.driverId)===starter&&other.date===t.date&&other.startedAt).sort((a,b)=>a.startedAt.localeCompare(b.startedAt))[0];if(t.id===first?.id&&t.workStart&&t.startedAt>=t.workStart.startedAt)t.preparationMinutes=Math.floor((Date.parse(t.startedAt)-Date.parse(t.workStart.startedAt))/60000);}
 return rows;
}
