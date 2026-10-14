// Synthetic identity provider and D1 fixtures for LOCAL TESTS ONLY.
// Never bundled into the application or Worker.
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../cloudflare-probe/package.json',import.meta.url));
const {build}=require('esbuild'),{Miniflare}=require('miniflare');
export const project='marap024-botendienst-test',number='233196612528',appId='1:233196612528:web:fictional-cloudflare-test';
export function signedToken(key,claims,kid='fictional-key',header={}){const h=Buffer.from(JSON.stringify({alg:'RS256',typ:'JWT',kid,...header})).toString('base64url'),p=Buffer.from(JSON.stringify(claims)).toString('base64url');return h+'.'+p+'.'+crypto.sign('RSA-SHA256',Buffer.from(h+'.'+p),key).toString('base64url');}
export async function fixtureRuntime({bindings={},outbound}={}){
 const auth=crypto.generateKeyPairSync('rsa',{modulusLength:2048}),check=crypto.generateKeyPairSync('rsa',{modulusLength:2048}),delivery=crypto.generateKeyPairSync('rsa',{modulusLength:3072});
 const pem=delivery.privateKey.export({type:'pkcs8',format:'pem'}),authPublic=auth.publicKey.export({type:'spki',format:'pem'}),checkPublic={...check.publicKey.export({format:'jwk'}),kid:'fictional-key',alg:'RS256',use:'sig'};
 const base=path.dirname(fileURLToPath(import.meta.url));
 const built=await build({absWorkingDir:base,entryPoints:['worker.mjs'],bundle:true,write:false,platform:'node',format:'esm',target:'es2022',external:['node:*','fs','stream','zlib','buffer','events','util','crypto'],banner:{js:"import {createRequire} from 'node:module';const require=createRequire('/bundle/worker.js');"},minify:true});
 const runtime=new Miniflare({modules:true,script:built.outputFiles[0].text,compatibilityDate:'2026-07-30',compatibilityFlags:['nodejs_compat'],bindings:{FIREBASE_PROJECT_ID:project,FIREBASE_PROJECT_NUMBER:number,FIREBASE_APP_ID:appId,DELIVERY_PROOF_PRIVATE_KEY:pem,DRIVER_PIN_PEPPER:'fictional-test-pepper-0123456789abcdef0123456789abcdef',OFFICE_PASSWORD_PEPPER:'fictional-office-pepper-0123456789abcdef0123456789abcdef',MASTER_ADMIN_EMAIL:'admin@example.test',...bindings},d1Databases:{DB:'fictional-marapo24'},outboundService:request=>{
  if(request.url==='https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com')return Response.json({'fictional-key':authPublic},{headers:{'Cache-Control':'max-age=3600'}});
  if(request.url==='https://firebaseappcheck.googleapis.com/v1/jwks')return Response.json({keys:[checkPublic]},{headers:{'Cache-Control':'max-age=3600'}});
  if(outbound)return outbound(request);return new Response('External network disabled in tests',{status:503});
 }});
 await runtime.ready;const db=await runtime.getD1Database('DB');await db.exec((await fs.readFile(path.join(base,'schema.sql'),'utf8')).replace(/\r?\n/g,' '));
 await db.exec((await fs.readFile(path.join(base,'driver-auth.sql'),'utf8')).replace(/\r?\n/g,' '));
 await db.exec((await fs.readFile(path.join(base,'office-auth.sql'),'utf8')).replace(/\r?\n/g,' '));
 await db.exec((await fs.readFile(path.join(base,'customers-routes.sql'),'utf8')).replace(/\r?\n/g,' '));
 await db.exec((await fs.readFile(path.join(base,'workflow-schema.sql'),'utf8')).replace(/\r?\n/g,' '));
 await db.exec((await fs.readFile(path.join(base,'cash-settlement.sql'),'utf8')).replace(/\r?\n/g,' '));
 for(const [uid,roles,isAdmin,special] of [['driver-a',['driver'],0,0],['driver-b',['driver'],0,0],['office',['office'],0,0],['dual',['office','driver'],0,0],['admin',['office'],1,1]])await db.prepare('INSERT INTO users VALUES (?,?,?,1,?,?)').bind(uid,'Fiktiv '+uid,JSON.stringify(roles),isAdmin,special).run();
 for(let i=4;i<=11;i++)await db.prepare('INSERT INTO users VALUES (?,?,?,1,0,0)').bind('driver-'+i,'Fiktiver Fahrer '+i,'["driver"]').run();
 for(let i=4;i<=20;i++)await db.prepare('INSERT INTO users VALUES (?,?,?,1,0,0)').bind('office-'+i,'Fiktives Büro '+i,'["office"]').run();
 await db.prepare('INSERT INTO vehicles VALUES (?,?,1,?)').bind('car1','Fiktives Testauto',new Date().toISOString()).run();
 function authToken(uid,change={},header={}){const now=Math.floor(Date.now()/1000);return signedToken(auth.privateKey,{aud:project,iss:'https://securetoken.google.com/'+project,sub:uid,iat:now,exp:now+3600,auth_time:now,email:uid+'@example.test',email_verified:true,...change},'fictional-key',header);}
 function appToken(change={},header={}){const now=Math.floor(Date.now()/1000);return signedToken(check.privateKey,{aud:['projects/'+number],iss:'https://firebaseappcheck.googleapis.com/'+number,sub:appId,iat:now,exp:now+3600,...change},'fictional-key',header);}
 async function call(uid,action,input={},options={}){if(['state','claimRegularTour','claimSpecialTour'].includes(action)&&!('workflowVersion' in input))input={...input,workflowVersion:2};const response=await runtime.dispatchFetch('http://worker-test.invalid/api/'+action,{method:'POST',headers:{Authorization:'Bearer '+(options.auth??authToken(uid)),'X-Firebase-AppCheck':options.app??appToken(),'Content-Type':'application/json',...options.headers},body:JSON.stringify(input)});return {status:response.status,body:await response.json()};}
 return {runtime,db,call,pem,authToken,appToken,authKey:auth.privateKey,appKey:check.privateKey,bundleBytes:built.outputFiles[0].contents.length};
}
