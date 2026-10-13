import {createHmac,timingSafeEqual,randomBytes} from 'node:crypto';
import {digest} from './driver-auth.mjs';
import {fail,fields,hasRole} from './domain.mjs';
const SESSION='__Host-marapo24-office';
const first=(db,sql,...args)=>db.prepare(sql).bind(...args).first();
const cookie=(value,seconds)=>SESSION+'='+value+'; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age='+seconds;
function sessionToken(request){const value=(request.headers.get('Cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(SESSION+'='))?.slice(SESSION.length+1);return /^[A-Za-z0-9_-]{43}$/.test(value||'')?value:null;}
export function username(value){if(typeof value!=='string'||value.length>120)fail('invalid-argument','Benutzernamen prüfen.');const name=value.trim().normalize('NFKC').toLowerCase();if(!/^[a-z0-9._-]+(?:@marapo24\.de)?$/.test(name)||name.length<3)fail('invalid-argument','Benutzernamen prüfen.');return name.includes('@')?name:name+'@marapo24.de';}
export async function passwordDigest(pepper,uid,salt,proof){
 if(typeof pepper!=='string'||pepper.length<40)fail('unavailable','Büro-Anmeldung noch nicht eingerichtet.');
 if(typeof proof!=='string'||!/^[a-f0-9]{64}$/.test(proof))fail('invalid-argument','Passwortnachweis prüfen.');
 return createHmac('sha256',pepper).update(uid+'\0'+salt+'\0'+proof).digest('hex');
}
export async function officeSession(request,env){
 const value=sessionToken(request);if(!value)fail('unauthenticated','Bitte mit Benutzername und Passwort anmelden.');
 const s=await first(env.DB,"SELECT s.uid,c.must_change,c.password_hash,c.username FROM office_sessions s JOIN office_credentials_v2 c ON c.uid=s.uid JOIN users u ON u.uid=s.uid WHERE s.token_hash=? AND s.expires_at>? AND s.credential_hash=c.password_hash AND c.active=1 AND u.active=1 AND EXISTS(SELECT 1 FROM json_each(u.roles) WHERE value='office')",digest(value),Date.now());
 if(!s)fail('unauthenticated','Büro-Anmeldung abgelaufen oder gesperrt.');return {uid:s.uid,mustChange:s.must_change===1,credentialHash:s.password_hash,username:s.username};
}
export async function officePublicAction(action,input,request,env){
 if(action==='officePasswordLogout'){fields(input,[]);const value=sessionToken(request);if(value)await env.DB.prepare('DELETE FROM office_sessions WHERE token_hash=?').bind(digest(value)).run();return {data:{signedOut:true},cookies:[cookie('',0)]};}
 fields(input,['officeForgotPassword','officePasswordChallenge'].includes(action)?['username']:['username','passwordProof']);const name=username(input.username);
 if(!['officeForgotPassword','officePasswordChallenge'].includes(action)&&(typeof input.passwordProof!=='string'||!/^[a-f0-9]{64}$/.test(input.passwordProof)))fail('invalid-argument','Zugangsdaten prüfen.');
 // Bound unknown-account attempts by network address; never store arbitrary supplied usernames.
 const bucket='network:'+digest(request.headers.get('CF-Connecting-IP')||'unknown'),window=Math.floor(Date.now()/900000);
 await env.DB.prepare('DELETE FROM office_attempts WHERE window<?').bind(window-1).run();
 const rate=await first(env.DB,'INSERT INTO office_attempts VALUES (?,?,1) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN window=excluded.window THEN count+1 ELSE 1 END,window=excluded.window RETURNING count',bucket,window);
 if(rate.count>100)fail('resource-exhausted','Zu viele Versuche. Bitte 15 Minuten warten.');
 const c=await first(env.DB,"SELECT c.*,u.active AS user_active,u.roles FROM office_credentials_v2 c JOIN users u ON u.uid=c.uid WHERE c.username=?",name);
 if(action==='officePasswordChallenge'){return {data:{username:name,salt:c?.salt||createHmac('sha256',env.OFFICE_PASSWORD_PEPPER).update('unknown:'+name).digest('base64url').slice(0,22),scheme:c?.must_change===1?'temporary':'personal'}};}
if(action==='officeForgotPassword'){
  if(c?.active===1&&c.user_active===1)await env.DB.prepare('INSERT INTO password_reset_requests VALUES (?,?) ON CONFLICT(uid) DO NOTHING').bind(c.uid,new Date().toISOString()).run();
  return {data:{requested:true}};
 }
 if(!c)fail('unauthenticated','Benutzername oder Passwort nicht freigegeben.');
 const attempts=await first(env.DB,'INSERT INTO office_attempts VALUES (?,?,1) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN window=excluded.window THEN count+1 ELSE 1 END,window=excluded.window RETURNING count','user:'+c.uid,window);
 if(attempts.count>5)fail('resource-exhausted','Zu viele Versuche. Bitte 15 Minuten warten oder Administratorin kontaktieren.');
 const calculated=await passwordDigest(env.OFFICE_PASSWORD_PEPPER,c.uid,c.salt,input.passwordProof);
 if(!/^[a-f0-9]{64}$/.test(c.password_hash)||!timingSafeEqual(Buffer.from(calculated,'hex'),Buffer.from(c.password_hash,'hex'))||c.active!==1||c.user_active!==1||!JSON.parse(c.roles).includes('office'))fail('unauthenticated','Benutzername oder Passwort nicht freigegeben.');
 const value=randomBytes(32).toString('base64url'),expires=Date.now()+8*3600000;
 const result=await env.DB.batch([env.DB.prepare('DELETE FROM office_sessions WHERE expires_at<=?').bind(Date.now()),env.DB.prepare("INSERT INTO office_sessions SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM office_credentials_v2 c JOIN users u ON u.uid=c.uid WHERE c.uid=? AND c.password_hash=? AND c.active=1 AND u.active=1 AND EXISTS(SELECT 1 FROM json_each(u.roles) WHERE value='office'))").bind(digest(value),c.uid,c.password_hash,expires,c.uid,c.password_hash),env.DB.prepare('DELETE FROM office_attempts WHERE key=?').bind('user:'+c.uid)]);
 if(result[1].meta.changes!==1)fail('unauthenticated','Kontofreigabe wurde geändert.');
 return {data:{uid:c.uid,mustChangePassword:c.must_change===1,expiresAt:expires},cookies:[cookie(value,8*3600)]};
}
export function isRecoveryAdmin(p,env){return hasRole(p,'office')&&p.isAdmin&&p.sessionKind==='firebase'&&typeof env.MASTER_ADMIN_EMAIL==='string'&&p.loginEmail?.toLowerCase()===env.MASTER_ADMIN_EMAIL.toLowerCase();}
export async function officeAccountAction(action,input,request,env,p){
 if(action==='changeOfficePassword'){
  fields(input,['passwordProof','salt']);if(typeof input.salt!=='string'||!/^[A-Za-z0-9_-]{22}$/.test(input.salt))fail('invalid-argument','Passwortänderung prüfen.');if(p.sessionKind!=='office')fail('permission-denied','Mit dem persönlichen Bürozugang anmelden.');
  const session=await officeSession(request,env),salt=input.salt,value=await passwordDigest(env.OFFICE_PASSWORD_PEPPER,p.uid,salt,input.passwordProof);
  const changed=await env.DB.prepare("UPDATE office_credentials_v2 SET salt=?,password_hash=?,must_change=0 WHERE uid=? AND password_hash=? AND active=1 AND EXISTS(SELECT 1 FROM users WHERE uid=? AND active=1 AND EXISTS(SELECT 1 FROM json_each(users.roles) WHERE value='office'))").bind(salt,value,session.uid,session.credentialHash,session.uid).run();if(changed.meta.changes!==1)fail('unauthenticated','Kontofreigabe oder Passwort wurde inzwischen geändert.');
  await env.DB.batch([env.DB.prepare('DELETE FROM office_sessions WHERE uid=?').bind(session.uid),env.DB.prepare('DELETE FROM password_reset_requests WHERE uid=?').bind(session.uid)]);
  return {data:{changed:true},cookies:[cookie('',0)]};
 }
 if(!isRecoveryAdmin(p,env))fail('permission-denied','Nur der persönliche Administratorzugang darf Passwörter wiederherstellen.');
 if(action==='listPasswordRequests'){fields(input,[]);return {data:{requests:(await env.DB.prepare('SELECT r.uid,u.display_name AS displayName,c.username,r.requested_at AS requestedAt FROM password_reset_requests r JOIN users u ON u.uid=r.uid JOIN office_credentials_v2 c ON c.uid=r.uid ORDER BY r.requested_at LIMIT 100').all()).results}};}
 fields(input,['uid','username']);if(typeof input.uid!=='string'||input.uid.length>128)fail('invalid-argument','Konto prüfen.');
 const name=username(input.username),u=await first(env.DB,'SELECT roles FROM users WHERE uid=?',input.uid);if(!u||!JSON.parse(u.roles).includes('office'))fail('not-found','Bürokonto fehlt.');if(input.uid===p.uid)fail('failed-precondition','Der persönliche Administratorzugang wird über seine echte E-Mail wiederhergestellt.');
 const password=randomBytes(18).toString('base64url'),salt=randomBytes(16).toString('base64url'),value=await passwordDigest(env.OFFICE_PASSWORD_PEPPER,input.uid,salt,digest(password));
 await env.DB.batch([env.DB.prepare('INSERT INTO office_credentials_v2 VALUES (?,?,?,?,1,1) ON CONFLICT(uid) DO UPDATE SET username=excluded.username,salt=excluded.salt,password_hash=excluded.password_hash,active=1,must_change=1').bind(input.uid,name,salt,value),env.DB.prepare('DELETE FROM office_sessions WHERE uid=?').bind(input.uid),env.DB.prepare('DELETE FROM office_attempts WHERE key=?').bind('user:'+input.uid),env.DB.prepare('DELETE FROM password_reset_requests WHERE uid=?').bind(input.uid)]);
 return {data:{username:name,temporaryPassword:password,mustChangePassword:true}};
}
