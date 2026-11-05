import {createPublicKey} from 'node:crypto';
import {fail} from './domain.mjs';
const AUTH_KEYS='https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
const APP_KEYS='https://firebaseappcheck.googleapis.com/v1/jwks';
const cache=new Map();
const verified=new Map(),loading=new Map();
const decode=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
async function publicKeys(url,refresh=false){
 const old=cache.get(url),now=Date.now();if(old&&old.expires>now&&(!refresh||now-old.fetched<60000))return old;
 if(loading.has(url))return loading.get(url);
 const pending=(async()=>{let response;try{response=await fetch(url,{signal:AbortSignal.timeout(8000)});}catch{fail('unavailable','Anmeldung kann derzeit nicht geprüft werden.');}if(!response.ok)fail('unavailable','Anmeldung kann derzeit nicht geprüft werden.');const value=await response.json(),age=Math.min(21600,Number(response.headers.get('Cache-Control')?.match(/max-age=(\d+)/)?.[1])||300),entry={value,expires:Date.now()+age*1000,fetched:Date.now(),imported:new Map()};cache.set(url,entry);return entry;})();
 loading.set(url,pending);try{return await pending;}finally{loading.delete(url);}
}
async function signingKey(url,kid){
 let entry=await publicKeys(url);
 const find=e=>url===AUTH_KEYS?(Object.hasOwn(e.value,kid)&&e.value[kid]):e.value.keys?.find(k=>k.kid===kid&&k.kty==='RSA');
 let candidate=find(entry);if(!candidate){entry=await publicKeys(url,true);candidate=find(entry);}if(!candidate)fail('unauthenticated','Anmeldung erneut prüfen.');
 if(!entry.imported.has(kid))entry.imported.set(kid,(async()=>{const jwk=url===AUTH_KEYS?createPublicKey(candidate).export({format:'jwk'}):candidate;return crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);})());
 return entry.imported.get(kid);
}
async function token(raw,url){
 if(typeof raw!=='string'||raw.length>16384)fail('unauthenticated','Anmeldung erforderlich.');let h,p,parts;
 const cached=verified.get(url+'|'+raw);if(cached&&cached.until>Date.now()&&cached.claims.exp>Math.floor(Date.now()/1000))return cached.claims;
 try{parts=raw.split('.');if(parts.length!==3)throw Error();h=JSON.parse(new TextDecoder().decode(decode(parts[0])));p=JSON.parse(new TextDecoder().decode(decode(parts[1])));}catch{fail('unauthenticated','Anmeldung ungültig.');}
 if(h.alg!=='RS256'||typeof h.kid!=='string'||h.kid.length>128||(url===APP_KEYS&&h.typ!=='JWT'))fail('unauthenticated','Anmeldung ungültig.');
 const now=Math.floor(Date.now()/1000);if(!Number.isFinite(p.exp)||p.exp<=now||!Number.isFinite(p.iat)||p.iat>now||typeof p.sub!=='string'||!p.sub||p.sub.length>128)fail('unauthenticated','Anmeldung abgelaufen oder ungültig.');
 let valid=false;const key=await signingKey(url,h.kid);try{valid=await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decode(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1]));}catch{}
 if(!valid)fail('unauthenticated','Anmeldung ungültig.');
 for(const [k,v] of verified)if(v.until<=Date.now())verified.delete(k);
 if(verified.size>=256)verified.delete(verified.keys().next().value);
 verified.set(url+'|'+raw,{claims:p,until:Math.min(Date.now()+60000,p.exp*1000)});return p;
}
export async function authenticateIdentity(request,env){
 if(env.FIREBASE_PROJECT_ID!=='marap024-botendienst-test'||env.FIREBASE_PROJECT_NUMBER!=='233196612528')fail('failed-precondition','Nur das freigegebene Testprojekt ist zulässig.');
 const match=request.headers.get('Authorization')?.match(/^Bearer ([A-Za-z0-9_.-]+)$/);const auth=await token(match?.[1],AUTH_KEYS);
 if(auth.aud!==env.FIREBASE_PROJECT_ID||auth.iss!=='https://securetoken.google.com/'+env.FIREBASE_PROJECT_ID||!Number.isFinite(auth.auth_time)||auth.auth_time>Math.floor(Date.now()/1000)||auth.email_verified!==true)fail('unauthenticated','Mitarbeiter-Anmeldung und E-Mail-Bestätigung prüfen.');
 await authenticateApp(request,env);
 return {uid:auth.sub,email:auth.email};
}
export async function authenticate(request,env){return (await authenticateIdentity(request,env)).uid;}
export async function authenticateApp(request,env){
 if(env.FIREBASE_PROJECT_ID!=='marap024-botendienst-test'||env.FIREBASE_PROJECT_NUMBER!=='233196612528')fail('failed-precondition','Nur das freigegebene Testprojekt ist zulässig.');
 const app=await token(request.headers.get('X-Firebase-AppCheck'),APP_KEYS);
 if(app.iss!=='https://firebaseappcheck.googleapis.com/'+env.FIREBASE_PROJECT_NUMBER||!Array.isArray(app.aud)||!app.aud.includes('projects/'+env.FIREBASE_PROJECT_NUMBER)||app.sub!==env.FIREBASE_APP_ID)fail('unauthenticated','App-Prüfung fehlgeschlagen.');
}
