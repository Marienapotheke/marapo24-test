import {createPublicKey} from 'node:crypto';
import {fail} from './domain.mjs';
const AUTH_KEYS='https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
const APP_KEYS='https://firebaseappcheck.googleapis.com/v1/jwks';
const cache=new Map();
const decode=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
async function publicKeys(url){const old=cache.get(url);if(old&&old.expires>Date.now())return old.value;const response=await fetch(url);if(!response.ok)fail('unavailable','Anmeldung kann derzeit nicht geprüft werden.');const value=await response.json(),age=Math.min(21600,Number(response.headers.get('Cache-Control')?.match(/max-age=(\d+)/)?.[1])||300);cache.set(url,{value,expires:Date.now()+age*1000});return value;}
async function token(raw,url){
 if(typeof raw!=='string'||raw.length>16384)fail('unauthenticated','Anmeldung erforderlich.');let h,p,parts;
 try{parts=raw.split('.');if(parts.length!==3)throw Error();h=JSON.parse(new TextDecoder().decode(decode(parts[0])));p=JSON.parse(new TextDecoder().decode(decode(parts[1])));}catch{fail('unauthenticated','Anmeldung ungültig.');}
 if(h.alg!=='RS256'||typeof h.kid!=='string'||h.kid.length>128||(url===APP_KEYS&&h.typ!=='JWT'))fail('unauthenticated','Anmeldung ungültig.');
 const now=Math.floor(Date.now()/1000);if(!Number.isFinite(p.exp)||p.exp<=now||!Number.isFinite(p.iat)||p.iat>now||typeof p.sub!=='string'||!p.sub||p.sub.length>128)fail('unauthenticated','Anmeldung abgelaufen oder ungültig.');
 const keys=await publicKeys(url);let jwk;
 if(url===AUTH_KEYS){const cert=Object.hasOwn(keys,h.kid)&&keys[h.kid];if(typeof cert==='string')try{jwk=createPublicKey(cert).export({format:'jwk'});}catch{}}
 else jwk=keys.keys?.find(k=>k.kid===h.kid&&k.kty==='RSA');
 if(!jwk){cache.delete(url);fail('unauthenticated','Anmeldung erneut prüfen.');}
 let valid=false;try{const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);valid=await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decode(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1]));}catch{}
 if(!valid)fail('unauthenticated','Anmeldung ungültig.');return p;
}
export async function authenticate(request,env){
 if(env.FIREBASE_PROJECT_ID!=='marap024-botendienst-test'||env.FIREBASE_PROJECT_NUMBER!=='233196612528')fail('failed-precondition','Nur das freigegebene Testprojekt ist zulässig.');
 const match=request.headers.get('Authorization')?.match(/^Bearer ([A-Za-z0-9_.-]+)$/);const auth=await token(match?.[1],AUTH_KEYS);
 if(auth.aud!==env.FIREBASE_PROJECT_ID||auth.iss!=='https://securetoken.google.com/'+env.FIREBASE_PROJECT_ID||!Number.isFinite(auth.auth_time)||auth.auth_time>Math.floor(Date.now()/1000)||auth.email_verified!==true)fail('unauthenticated','Mitarbeiter-Anmeldung und E-Mail-Bestätigung prüfen.');
 const app=await token(request.headers.get('X-Firebase-AppCheck'),APP_KEYS);
 if(app.iss!=='https://firebaseappcheck.googleapis.com/'+env.FIREBASE_PROJECT_NUMBER||!Array.isArray(app.aud)||!app.aud.includes('projects/'+env.FIREBASE_PROJECT_NUMBER)||app.sub!==env.FIREBASE_APP_ID)fail('unauthenticated','App-Prüfung fehlgeschlagen.');
 return auth.sub;
}
