import {createHash,createHmac,timingSafeEqual,randomBytes} from 'node:crypto';
import {fail,fields,text,id,hasRole} from './domain.mjs';
const DEVICE='__Host-marapo24-device',SESSION='__Host-marapo24-driver';
const first=(db,sql,...args)=>db.prepare(sql).bind(...args).first();
const run=(db,sql,...args)=>db.prepare(sql).bind(...args).run();
export const digest=value=>createHash('sha256').update(value).digest('hex');
export function pinDigest(pepper,uid,salt,pin){if(typeof pepper!=='string'||pepper.length<40)fail('unavailable','PIN-Anmeldung noch nicht eingerichtet.');return createHmac('sha256',pepper).update(uid+'\0'+salt+'\0'+pin).digest('hex');}
function cookies(request){const values={};for(const part of (request.headers.get('Cookie')||'').split(';')){const p=part.trim().split('=');if(p.length===2)values[p[0]]=p[1];}return values;}
const cookie=(name,value,seconds)=>name+'='+value+'; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age='+seconds;
function token(request,name){const value=cookies(request)[name];return typeof value==='string'&&/^[A-Za-z0-9_-]{43}$/.test(value)?value:null;}
async function device(request,env){const value=token(request,DEVICE);if(!value)fail('unauthenticated','Dieses Gerät muss zuerst vom Büro freigegeben werden.');const d=await first(env.DB,'SELECT * FROM driver_devices WHERE token_hash=? AND active=1 AND expires_at>?',digest(value),Date.now());if(!d)fail('unauthenticated','Gerätefreigabe fehlt oder wurde aufgehoben.');return d;}
export async function driverSession(request,env){const d=await device(request,env),value=token(request,SESSION);if(!value)fail('unauthenticated','Bitte mit persönlicher Fahrer-PIN anmelden.');const s=await first(env.DB,"SELECT s.uid FROM driver_sessions s JOIN users u ON u.uid=s.uid WHERE s.token_hash=? AND s.device_id=? AND s.expires_at>? AND u.active=1 AND EXISTS(SELECT 1 FROM json_each(u.roles) WHERE value='driver')",digest(value),d.id,Date.now());if(!s)fail('unauthenticated','Fahrer-Anmeldung abgelaufen oder gesperrt.');return s.uid;}
export async function driverPublicAction(action,input,request,env){
 if(action==='driverPinLogout'){fields(input,[]);const value=token(request,SESSION);if(value)await run(env.DB,'DELETE FROM driver_sessions WHERE token_hash=?',digest(value));return {data:{signedOut:true},cookies:[cookie(SESSION,'',0)]};}
 const d=await device(request,env);
 if(action==='driverLoginOptions'){fields(input,[]);const rows=(await env.DB.prepare("SELECT u.uid,u.display_name FROM users u JOIN driver_pins p ON p.uid=u.uid WHERE u.active=1 AND p.active=1 AND EXISTS(SELECT 1 FROM json_each(u.roles) WHERE value='driver') ORDER BY u.display_name LIMIT 51").all()).results;if(rows.length>50)fail('resource-exhausted','Fahrerzahl prüfen.');return {data:{deviceLabel:d.label,drivers:rows.map(u=>({uid:u.uid,displayName:u.display_name}))}};}
 fields(input,['uid','pin']);if(typeof input.uid!=='string'||input.uid.length>128||typeof input.pin!=='string'||!/^\d{6}$/.test(input.pin))fail('invalid-argument','Bitte Namen und sechsstellige PIN prüfen.');
 const p=await first(env.DB,"SELECT p.*,u.active AS user_active,u.roles FROM driver_pins p JOIN users u ON u.uid=p.uid WHERE p.uid=?",input.uid);
 if(!p){pinDigest(env.DRIVER_PIN_PEPPER,input.uid,'missing',input.pin);fail('unauthenticated','Name oder PIN nicht freigegeben.');}
 const window=Math.floor(Date.now()/900000),attempt=await first(env.DB,'INSERT INTO driver_pin_attempts(uid,window,count) VALUES (?,?,1) ON CONFLICT(uid) DO UPDATE SET count=CASE WHEN window=excluded.window THEN count+1 ELSE 1 END,window=excluded.window RETURNING count',input.uid,window);
 if(attempt.count>5)fail('resource-exhausted','Zu viele PIN-Versuche. Bitte 15 Minuten warten oder Büro informieren.');
 const calculated=pinDigest(env.DRIVER_PIN_PEPPER,input.uid,p.salt,input.pin),expected=/^[a-f0-9]{64}$/.test(p.pin_hash)?p.pin_hash:'0'.repeat(64);
 if(!timingSafeEqual(Buffer.from(calculated,'hex'),Buffer.from(expected,'hex'))||!p||p.active!==1||p.user_active!==1||!JSON.parse(p.roles).includes('driver'))fail('unauthenticated','Name oder PIN nicht freigegeben.');
 const value=randomBytes(32).toString('base64url'),expires=Date.now()+8*3600000;
 const result=await env.DB.batch([env.DB.prepare('DELETE FROM driver_sessions WHERE device_id=? OR expires_at<=?').bind(d.id,Date.now()),env.DB.prepare("INSERT INTO driver_sessions SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM users u JOIN driver_pins p ON p.uid=u.uid WHERE u.uid=? AND u.active=1 AND p.active=1 AND p.pin_hash=? AND EXISTS(SELECT 1 FROM json_each(u.roles) WHERE value='driver')) AND EXISTS(SELECT 1 FROM driver_devices WHERE id=? AND active=1 AND expires_at>?)").bind(digest(value),p.uid,d.id,expires,p.uid,p.pin_hash,d.id,Date.now()),env.DB.prepare('DELETE FROM driver_pin_attempts WHERE uid=?').bind(p.uid)]);
 if(result[1].meta.changes!==1)fail('unauthenticated','Name oder PIN nicht freigegeben.');
 return {data:{uid:p.uid,expiresAt:expires},cookies:[cookie(SESSION,value,8*3600)]};
}
export async function driverAdminAction(action,input,request,env,p){
 if(!hasRole(p,'office')||!p.isAdmin)fail('permission-denied','Nur die Administratorin darf Fahrergeräte und PINs verwalten.');
 if(action==='listDriverDevices'){fields(input,[]);return {data:{devices:(await env.DB.prepare('SELECT id,label,active,created_at,expires_at FROM driver_devices ORDER BY created_at DESC LIMIT 51').all()).results}};}
 if(action==='authorizeDriverDevice'){
  fields(input,['label']);const label=text(input.label,60,true);let old;try{old=await device(request,env);}catch(e){if(e.code!=='unauthenticated')throw e;}
  if(old){await run(env.DB,'UPDATE driver_devices SET label=? WHERE id=?',label,old.id);return {data:{authorized:true,deviceId:old.id}};}
  const count=await first(env.DB,'SELECT count(*) AS n FROM driver_devices WHERE active=1 AND expires_at>?',Date.now());if(count.n>=3)fail('resource-exhausted','Drei Geräte sind freigegeben. Zuerst ein altes Gerät deaktivieren.');
  const value=randomBytes(32).toString('base64url'),deviceId=crypto.randomUUID(),result=await run(env.DB,"INSERT INTO driver_devices SELECT ?,?,?,?,?,? WHERE (SELECT count(*) FROM driver_devices WHERE active=1 AND expires_at>?)<3 AND EXISTS(SELECT 1 FROM users WHERE uid=? AND active=1 AND is_admin=1 AND EXISTS(SELECT 1 FROM json_each(users.roles) WHERE value='office'))",deviceId,digest(value),label,1,new Date().toISOString(),Date.now()+180*86400000,Date.now(),p.uid);if(result.meta.changes!==1)fail('resource-exhausted','Gerätegrenze oder Administratorfreigabe prüfen.');return {data:{authorized:true,deviceId},cookies:[cookie(DEVICE,value,180*86400)]};
 }
 if(action==='revokeDriverDevice'){fields(input,['deviceId']);const deviceId=id(input.deviceId);await env.DB.batch([env.DB.prepare('UPDATE driver_devices SET active=0 WHERE id=?').bind(deviceId),env.DB.prepare('DELETE FROM driver_sessions WHERE device_id=?').bind(deviceId)]);return {data:{revoked:true}};}
 fields(input,['uid','pin']);if(typeof input.uid!=='string'||input.uid.length>128||typeof input.pin!=='string'||!/^\d{6}$/.test(input.pin)||/^(\d)\1{5}$/.test(input.pin)||['123456','654321','012345','987654'].includes(input.pin))fail('invalid-argument','Eine persönliche sechsstellige PIN ohne einfache Zahlenfolge wählen.');
 const user=await first(env.DB,'SELECT roles FROM users WHERE uid=?',input.uid);if(!user||!JSON.parse(user.roles).includes('driver'))fail('not-found','Fahrerkonto fehlt.');const salt=randomBytes(16).toString('base64url'),hash=pinDigest(env.DRIVER_PIN_PEPPER,input.uid,salt,input.pin);
 await env.DB.batch([env.DB.prepare('INSERT INTO driver_pins VALUES (?,?,?,1) ON CONFLICT(uid) DO UPDATE SET salt=excluded.salt,pin_hash=excluded.pin_hash,active=1').bind(input.uid,salt,hash),env.DB.prepare('DELETE FROM driver_sessions WHERE uid=?').bind(input.uid),env.DB.prepare('DELETE FROM driver_pin_attempts WHERE uid=?').bind(input.uid)]);return {data:{updated:true}};
}
