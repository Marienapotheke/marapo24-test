import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {fixtureRuntime} from './fixture-runtime.mjs';
import {temporaryOfficeProof} from './password-proof.mjs';
let f;before(async()=>{f=await fixtureRuntime();});after(async()=>{await f.runtime.dispose();});
const driver=()=>({requestId:crypto.randomUUID(),displayName:'Fiktive neue Fahrerin',roles:['driver'],pin:'627491'});
async function publicCall(action,input,cookie=''){const r=await f.runtime.dispatchFetch('https://fictional.invalid/api/'+action,{method:'POST',headers:{'Content-Type':'application/json','X-Firebase-AppCheck':f.appToken(),...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(input)});return {status:r.status,body:await r.json(),cookie:r.headers.getSetCookie().map(v=>v.split(';')[0]).join('; ')};}
test('new accounts require verified personal administrator; injected privilege fields and weak PINs are rejected',async()=>{
 for(const uid of ['office','driver-a'])assert.equal((await f.call(uid,'createStaffAccount',driver())).status,403);
 assert.equal((await f.call('admin','createStaffAccount',driver(),{auth:f.authToken('admin',{email:'wrong@example.test'})})).status,403);
 for(const change of [{isAdmin:true},{active:false},{roles:['admin']},{roles:['driver','driver']},{pin:'123456'},{pin:'000000'},{displayName:'  '}])assert.equal((await f.call('admin','createStaffAccount',{...driver(),...change})).status,400);
 assert.equal((await publicCall('createStaffAccount',driver())).status,401);
});
test('driver profile and hashed PIN are atomic and exact retries do not create duplicates or overwrite a changed PIN',async()=>{
 const input=driver(),responses=await Promise.all([f.call('admin','createStaffAccount',input),f.call('admin','createStaffAccount',input)]);assert.ok(responses.every(r=>r.status===200));const uid=responses[0].body.data.uid;assert.equal(uid,responses[1].body.data.uid);
 const row=await f.db.prepare('SELECT * FROM users WHERE uid=?').bind(uid).first();assert.equal(row.is_admin,0);assert.equal(row.active,1);assert.deepEqual(JSON.parse(row.roles),['driver']);
 const pin=await f.db.prepare('SELECT * FROM driver_pins WHERE uid=?').bind(uid).first();assert.match(pin.pin_hash,/^[a-f0-9]{64}$/);assert.equal(JSON.stringify(pin).includes(input.pin),false);
 const login=await publicCall('driverPinLogin',{uid,pin:input.pin});assert.equal(login.status,200);assert.equal((await publicCall('createStaffAccount',driver(),login.cookie)).status,403);
 assert.equal((await f.call('admin','setDriverPin',{uid,pin:'842697'})).status,200);assert.equal((await f.call('admin','createStaffAccount',input)).status,409);
});
test('office creation enforces unique username, temporary password change and preserves existing accounts on conflicts',async()=>{
 const password='Fictional-Temporary-Password-123!',proof=await temporaryOfficeProof(password),input={requestId:crypto.randomUUID(),displayName:'Fiktiver neuer Büromitarbeiter',roles:['office'],username:'fiktiv.neu',temporaryPasswordProof:proof};
 const result=await f.call('admin','createStaffAccount',input);assert.equal(result.status,200);assert.equal(result.body.data.username,'fiktiv.neu@marapo24.de');const uid=result.body.data.uid;
 assert.equal((await f.call('admin','createStaffAccount',input)).status,200);
 const login=await publicCall('officePasswordLogin',{username:'fiktiv.neu',passwordProof:proof});assert.equal(login.status,200);assert.equal(login.body.data.mustChangePassword,true);assert.equal((await publicCall('state',{},login.cookie)).status,400);
 const stored=await f.db.prepare('SELECT * FROM office_credentials_v2 WHERE uid=?').bind(uid).first();assert.equal(JSON.stringify(stored).includes(password),false);assert.equal(stored.must_change,1);
 const conflict={...input,requestId:crypto.randomUUID()};assert.equal((await f.call('admin','createStaffAccount',conflict)).status,409);assert.equal(await f.db.prepare('SELECT uid FROM users WHERE uid=?').bind('staff-'+conflict.requestId).first(),null);
 const both={...input,requestId:crypto.randomUUID(),username:'fiktiv.beide',roles:['driver','office'],pin:'523894'};assert.equal((await f.call('admin','createStaffAccount',both)).status,200);assert.equal((await f.call('admin','createStaffAccount',both)).status,200);
});
test('failed credential insertion rolls back the whole new profile',async()=>{
 await f.db.exec("CREATE TRIGGER fictional_staff_failure BEFORE INSERT ON driver_pins WHEN NEW.uid LIKE 'staff-%' BEGIN SELECT RAISE(ABORT,'fictional failure'); END;");
 const input=driver();assert.equal((await f.call('admin','createStaffAccount',input)).status,400);assert.equal(await f.db.prepare('SELECT uid FROM users WHERE uid=?').bind('staff-'+input.requestId).first(),null);await f.db.exec('DROP TRIGGER fictional_staff_failure');
});
test('existing list capacities cannot be exceeded and rejected creation leaves no profile or credentials',async()=>{
 let count=(await f.db.prepare("SELECT count(*) n FROM users WHERE EXISTS(SELECT 1 FROM json_each(users.roles) WHERE value='driver')").first()).n;
 const rows=[];for(;count<50;count++)rows.push(f.db.prepare("INSERT INTO users VALUES (?,?,'[\"driver\"]',1,0,0)").bind('fictional-capacity-driver-'+count,'Fiktive Kapazitätsprüfung '+count));if(rows.length)await f.db.batch(rows);
 const input=driver();assert.equal((await f.call('admin','createStaffAccount',input)).status,400);assert.equal(await f.db.prepare('SELECT uid FROM users WHERE uid=?').bind('staff-'+input.requestId).first(),null);
 count=(await f.db.prepare('SELECT count(*) n FROM users').first()).n;rows.length=0;for(;count<100;count++)rows.push(f.db.prepare("INSERT INTO users VALUES (?,?,'[\"office\"]',1,0,0)").bind('fictional-capacity-office-'+count,'Fiktive Büro-Kapazitätsprüfung '+count));if(rows.length)await f.db.batch(rows);
 const office={requestId:crypto.randomUUID(),displayName:'Fiktive Grenze',roles:['office'],username:'fiktiv.grenze',temporaryPasswordProof:await temporaryOfficeProof('Fictional-capacity-password-123!')};assert.equal((await f.call('admin','createStaffAccount',office)).status,400);assert.equal((await f.db.prepare('SELECT count(*) n FROM users').first()).n,100);assert.equal(await f.db.prepare('SELECT uid FROM office_credentials_v2 WHERE username=?').bind('fiktiv.grenze@marapo24.de').first(),null);
});
