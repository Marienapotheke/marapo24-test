import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {fixtureRuntime} from './fixture-runtime.mjs';
let f,deviceCookie,sessionCookie;
const cookie=s=>s.split(';')[0];
async function call(action,input={},identity=null,cookies=''){
 const r=await f.runtime.dispatchFetch('https://fictional.invalid/api/'+action,{method:'POST',headers:{'Content-Type':'application/json','X-Firebase-AppCheck':f.appToken(),...(identity?{Authorization:'Bearer '+f.authToken(identity)}:{}),...(cookies?{Cookie:cookies}:{})},body:JSON.stringify(input)});
 return {status:r.status,body:await r.json(),setCookie:r.headers.get('set-cookie')};
}
before(async()=>{f=await fixtureRuntime();});after(async()=>{if(f)await f.runtime.dispose();});
test('driver names and PIN login are available without prior device approval',async()=>{
 assert.equal((await call('driverLoginOptions')).status,200);assert.equal((await call('authorizeDriverDevice',{label:'Testtablet'},'office')).status,403);
 const r=await call('authorizeDriverDevice',{label:'Fiktives Testtablet'},'admin');assert.equal(r.status,200);assert.match(r.setCookie,/Secure/);assert.match(r.setCookie,/HttpOnly/);assert.match(r.setCookie,/SameSite=Strict/);deviceCookie=cookie(r.setCookie);
 for(const [uid,pin] of [['driver-a','642893'],['driver-b','819264'],['dual','463892']])assert.equal((await call('setDriverPin',{uid,pin},'admin')).status,200);
 const options=await call('driverLoginOptions',{},null,deviceCookie);assert.equal(options.status,200);assert.equal(options.body.data.drivers.length,3);assert.equal(JSON.stringify(options.body).includes('pin_hash'),false);
});
test('PIN sessions never grant office or administrator rights, including for dual-role employees',async()=>{
 const r=await call('driverPinLogin',{uid:'dual',pin:'463892'},null,deviceCookie);assert.equal(r.status,200);sessionCookie=cookie(r.setCookie);const both=deviceCookie+'; '+sessionCookie;
 assert.equal((await call('state',{view:'driver'},null,both)).status,200);assert.equal((await call('state',{view:'office'},null,both)).status,403);
 assert.equal((await call('downloadProtectedProof',{tourId:'fictitious',stopId:'fictitious'},null,both)).status,403);assert.equal((await call('listUsers',{},null,both)).status,403);assert.equal((await call('authorizeDriverDevice',{label:'Forbidden'},null,both)).status,403);
});
test('parallel PIN guesses share an atomic attempt limit and cannot create a session',async()=>{
 const guesses=await Promise.all(Array.from({length:8},()=>call('driverPinLogin',{uid:'driver-b',pin:'555555'},null,deviceCookie)));
 assert.equal(guesses.filter(r=>r.body.error?.code==='unauthenticated').length,5);assert.equal(guesses.filter(r=>r.body.error?.code==='resource-exhausted').length,3);assert.equal(guesses.some(r=>r.setCookie),false);
 assert.equal((await call('driverPinLogin',{uid:'driver-b',pin:'819264'},null,deviceCookie)).body.error.code,'resource-exhausted');
 assert.equal((await call('setDriverPin',{uid:'driver-b',pin:'123456'},'admin')).status,400);assert.equal((await call('setDriverPin',{uid:'driver-b',pin:'819264'},'admin')).status,200);
});
test('PIN changes, logout, account suspension and device revocation invalidate old sessions',async()=>{
 const login=()=>call('driverPinLogin',{uid:'driver-a',pin:'642893'},null,deviceCookie);
 let r=await login(),both=deviceCookie+'; '+cookie(r.setCookie);assert.equal(r.status,200);
 await call('setDriverPin',{uid:'driver-a',pin:'642893'},'admin');assert.equal((await call('state',{view:'driver'},null,both)).status,401);
 r=await login();both=deviceCookie+'; '+cookie(r.setCookie);assert.equal((await call('driverPinLogout',{},null,both)).status,200);assert.equal((await call('state',{view:'driver'},null,both)).status,401);
 r=await login();both=deviceCookie+'; '+cookie(r.setCookie);await f.db.prepare("UPDATE users SET active=0 WHERE uid='driver-a'").run();assert.equal((await call('state',{view:'driver'},null,both)).status,401);await f.db.prepare("UPDATE users SET active=1 WHERE uid='driver-a'").run();
 const devices=await call('listDriverDevices',{},'admin');await call('revokeDriverDevice',{deviceId:devices.body.data.devices[0].id},'admin');assert.equal((await call('state',{view:'driver'},null,both)).status,401);assert.equal((await call('driverLoginOptions',{},null,deviceCookie)).status,200);
});
test('administrator can authorize more than three distinct driver devices',async()=>{const ids=[];for(let i=0;i<5;i++){const r=await call('authorizeDriverDevice',{label:'Fiktives Zusatzgerät '+i},'admin');assert.equal(r.status,200);assert.ok(r.setCookie);ids.push(r.body.data.deviceId);}assert.equal(new Set(ids).size,5);});

test('fresh browsers log in directly with PIN, keep separate sessions and require the automatic browser binding',async()=>{
 await call('setDriverPin',{uid:'driver-a',pin:'642893'},'admin');const sessions=[];
 for(let i=0;i<2;i++){const r=await f.runtime.dispatchFetch('https://fictional.invalid/api/driverPinLogin',{method:'POST',headers:{'Content-Type':'application/json','X-Firebase-AppCheck':f.appToken()},body:JSON.stringify({uid:'driver-a',pin:'642893'})});assert.equal(r.status,200);const cookies=r.headers.getSetCookie().map(cookie);assert.equal(cookies.length,2);sessions.push(cookies.join('; '));assert.equal((await call('state',{view:'driver'},null,cookies[0])).status,401);}
 for(const cookies of sessions)assert.equal((await call('state',{view:'driver'},null,cookies)).status,200);
});
