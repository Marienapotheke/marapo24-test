import {deriveOfficeProof,temporaryOfficeProof,newOfficeSalt} from './password-proof.mjs';
import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {fixtureRuntime} from './fixture-runtime.mjs';
let f,temporary,session;
async function call(action,input={},identity=null,cookie='',claims={}){
if(action==='officePasswordLogin'&&Object.hasOwn(input,'password')){const challenge=(await call('officePasswordChallenge',{username:input.username})).body.data;const passwordProof=challenge.scheme==='temporary'?await temporaryOfficeProof(input.password):await deriveOfficeProof(challenge.username,challenge.salt,input.password);input={username:input.username,passwordProof};}
if(action==='changeOfficePassword'&&Object.hasOwn(input,'password')){const s=(await call('session',{},null,cookie)).body.data.profile;const salt=newOfficeSalt();input={salt,passwordProof:input.password.length>=14?await deriveOfficeProof(s.officeUsername,salt,input.password):'invalid'};}
const r=await f.runtime.dispatchFetch('https://fictional.invalid/api/'+action,{method:'POST',headers:{'Content-Type':'application/json','X-Firebase-AppCheck':f.appToken(),...(identity?{Authorization:'Bearer '+f.authToken(identity,claims)}:{}),...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(input)});return {status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0],headers:r.headers};}
before(async()=>{f=await fixtureRuntime();});after(async()=>{await f?.runtime.dispose();});
test('only the verified personal recovery administrator can issue office credentials',async()=>{
 assert.equal((await call('resetOfficePassword',{uid:'office',username:'erika.muster'},'office')).status,403);
 assert.equal((await call('resetOfficePassword',{uid:'office',username:'erika.muster'},'admin','',{email:'someone@example.test'})).status,403);
 const r=await call('resetOfficePassword',{uid:'office',username:'erika.muster'},'admin');assert.equal(r.status,200);temporary=r.body.data.temporaryPassword;assert.equal(r.body.data.username,'erika.muster@marapo24.de');
 const stored=await f.db.prepare("SELECT * FROM office_credentials_v2 WHERE uid='office'").first();assert.equal(JSON.stringify(stored).includes(temporary),false);assert.match(stored.password_hash,/^[a-f0-9]{64}$/);
 assert.equal((await call('officePasswordLogin',{username:'erika.muster',password:'wrong-password'})).status,401);
});
test('temporary office passwords permit only personal password change before data access',async()=>{
 const r=await call('officePasswordLogin',{username:'erika.muster@marapo24.de',password:temporary});assert.equal(r.status,200);session=r.cookie;assert.match(r.headers.get('set-cookie'),/Secure; HttpOnly; SameSite=Strict/);
 assert.equal((await call('session',{},null,session)).body.data.profile.mustChangePassword,true);
 assert.equal((await call('state',{view:'office'},null,session)).status,400);assert.equal((await call('downloadProtectedProof',{tourId:'fictitious',stopId:'fictitious'},null,session)).status,400);
 assert.equal((await call('changeOfficePassword',{password:'short'},null,session)).status,400);
 assert.equal((await call('changeOfficePassword',{password:'Personal-test-passphrase-456!'},null,session)).status,200);
 assert.equal((await call('session',{},null,session)).status,401);
 const login=await call('officePasswordLogin',{username:'erika.muster',password:'Personal-test-passphrase-456!'});assert.equal(login.status,200);session=login.cookie;
 assert.equal((await call('state',{view:'office'},null,session)).status,200);const own=(await call('state',{view:'driver'},null,session));assert.equal(own.status,200);assert.deepEqual(own.body.data.tours,[]);assert.deepEqual(own.body.data.catalog,[]);
 assert.equal((await call('listPasswordRequests',{},null,session)).status,403);
});
test('forgotten password requests are private, bounded and invalidate sessions on administrator reset',async()=>{
 const known=await call('officeForgotPassword',{username:'erika.muster'}),unknown=await call('officeForgotPassword',{username:'not.present'});assert.deepEqual(known.body,unknown.body);
 assert.equal((await call('listPasswordRequests',{},'office')).status,403);
 const requests=await call('listPasswordRequests',{},'admin');assert.equal(requests.body.data.requests.length,1);
 await call('resetOfficePassword',{uid:'office',username:'erika.muster'},'admin');assert.equal((await call('state',{view:'office'},null,session)).status,401);
 assert.equal((await call('listPasswordRequests',{},'admin')).body.data.requests.length,0);
 const guesses=await Promise.all(Array.from({length:8},()=>call('officePasswordLogin',{username:'erika.muster',password:'guess-password'})));
 assert.equal(guesses.filter(r=>r.status===401).length,5);assert.equal(guesses.filter(r=>r.status===429).length,3);
});
test('cookie office sessions never gain recovery rights through an office administrator role',async()=>{
 await f.db.prepare("UPDATE users SET is_admin=1 WHERE uid='office'").run();
 const reset=await call('resetOfficePassword',{uid:'office',username:'erika.muster'},'admin'),login=await call('officePasswordLogin',{username:'erika.muster',password:reset.body.data.temporaryPassword});
 await call('changeOfficePassword',{password:'Another-personal-passphrase-789!'},null,login.cookie);
 const final=await call('officePasswordLogin',{username:'erika.muster',password:'Another-personal-passphrase-789!'});
 assert.equal((await call('listPasswordRequests',{},null,final.cookie)).status,403);
 await f.db.prepare("UPDATE users SET active=0 WHERE uid='office'").run();assert.equal((await call('session',{},null,final.cookie)).status,401);
});
