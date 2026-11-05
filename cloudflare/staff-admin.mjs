import {randomBytes} from 'node:crypto';
import {fields,text,fail} from './domain.mjs';
import {isRecoveryAdmin,username,passwordDigest} from './office-auth.mjs';
import {pinDigest} from './driver-auth.mjs';
export async function createStaffAccount(input,env,p){
 if(!isRecoveryAdmin(p,env))fail('permission-denied','Persönlicher Administratorzugang zum Anlegen von Konten erforderlich.');
 fields(input,['requestId','displayName','roles','username','temporaryPasswordProof','pin']);
 if(typeof input.requestId!=='string'||! /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.requestId)||!Array.isArray(input.roles)||!input.roles.length||input.roles.length>2||new Set(input.roles).size!==input.roles.length||input.roles.some(r=>!['driver','office'].includes(r)))fail('invalid-argument','Name und Rolle prüfen.');
 const uid='staff-'+input.requestId.toLowerCase(),name=text(input.displayName,80,true),roles=[...input.roles].sort(),office=roles.includes('office'),driver=roles.includes('driver'),db=env.DB;
 const login=office?username(input.username):null;
 if(!office&&('username'in input||'temporaryPasswordProof'in input)||!driver&&'pin'in input)fail('invalid-argument','Zugangsdaten passen nicht zur Rolle.');
 if(driver&&(typeof input.pin!=='string'||!/^\d{6}$/.test(input.pin)||/^(\d)\1{5}$/.test(input.pin)||['123456','654321','012345','987654'].includes(input.pin)))fail('invalid-argument','Eine persönliche sechsstellige PIN ohne einfache Zahlenfolge wählen.');
 const officeSalt=office?randomBytes(16).toString('base64url'):null,officeHash=office?await passwordDigest(env.OFFICE_PASSWORD_PEPPER,uid,officeSalt,input.temporaryPasswordProof):null;
 const pinSalt=driver?randomBytes(16).toString('base64url'):null,pinHash=driver?pinDigest(env.DRIVER_PIN_PEPPER,uid,pinSalt,input.pin):null;
 async function existing(){
  const row=await db.prepare('SELECT * FROM users WHERE uid=?').bind(uid).first();if(!row)return false;
  let same=row.display_name===name&&row.roles===JSON.stringify(roles)&&row.active===1&&row.is_admin===0;
  if(office){const c=await db.prepare('SELECT * FROM office_credentials_v2 WHERE uid=?').bind(uid).first();same=!!(same&&c&&c.username===login&&c.active===1&&c.must_change===1&&c.password_hash===await passwordDigest(env.OFFICE_PASSWORD_PEPPER,uid,c.salt,input.temporaryPasswordProof));}
  if(driver){const c=await db.prepare('SELECT * FROM driver_pins WHERE uid=?').bind(uid).first();same=!!(same&&c&&c.active===1&&c.pin_hash===pinDigest(env.DRIVER_PIN_PEPPER,uid,c.salt,input.pin));}
  if(!same)fail('already-exists','Dieser Anlegevorgang wurde bereits bestätigt. Vorhandenes Konto in der Kontenliste prüfen.');return true;
 }
 if(await existing())return {created:true,uid,username:login};
 if(office&&await db.prepare('SELECT uid FROM office_credentials_v2 WHERE username=?').bind(login).first())fail('already-exists','Dieser Benutzername ist bereits vergeben.');
 // Profile and credentials commit together; authorization and UI capacity are checked in the insert.
 const statements=[db.prepare("INSERT INTO users(uid,display_name,roles,active,is_admin,can_special) SELECT ?,?,?,1,0,0 WHERE EXISTS(SELECT 1 FROM users WHERE uid=? AND active=1 AND is_admin=1 AND EXISTS(SELECT 1 FROM json_each(users.roles) WHERE value='office')) AND (SELECT count(*) FROM users)<100 AND (?=0 OR (SELECT count(*) FROM users WHERE EXISTS(SELECT 1 FROM json_each(users.roles) WHERE value='driver'))<50)").bind(uid,name,JSON.stringify(roles),p.uid,driver?1:0)];
 if(office)statements.push(db.prepare('INSERT INTO office_credentials_v2(uid,username,salt,password_hash,active,must_change) VALUES (?,?,?,?,1,1)').bind(uid,login,officeSalt,officeHash));
 if(driver)statements.push(db.prepare('INSERT INTO driver_pins(uid,salt,pin_hash,active) VALUES (?,?,?,1)').bind(uid,pinSalt,pinHash));
 try{const result=await db.batch(statements);if(result[0].meta.changes!==1)fail('failed-precondition','Administratorfreigabe oder Kontolimit prüfen.');}
 catch(error){if(await existing())return {created:true,uid,username:login};if(office&&await db.prepare('SELECT uid FROM office_credentials_v2 WHERE username=?').bind(login).first())fail('already-exists','Dieser Benutzername ist bereits vergeben.');fail('failed-precondition','Konto nicht angelegt. Administratorfreigabe und Kontolimit prüfen; anschließend erneut versuchen.');}
 return {created:true,uid,username:login};
}
