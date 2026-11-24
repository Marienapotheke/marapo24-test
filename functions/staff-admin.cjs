'use strict';
// Explicit operator tool. No email is sent, no password is printed or stored.
const fs=require('node:fs');
const {initializeApp,applicationDefault}=require('firebase-admin/app');
const {getAuth}=require('firebase-admin/auth');
const {getFirestore,FieldValue}=require('firebase-admin/firestore');
function validateRoster(roster){
 if(!Array.isArray(roster)||roster.length>100)throw Error('Mitarbeiterliste muss ein Array mit höchstens 100 Einträgen sein.');
 const seen=new Set();
 for(const row of roster){
  if(!row||Object.keys(row).some(k=>!['email','displayName','role','active'].includes(k))||typeof row.email!=='string'||row.email.length>254||!/^\S+@\S+\.\S+$/.test(row.email)||typeof row.displayName!=='string'||row.displayName.length<1||row.displayName.length>80||!['office','driver'].includes(row.role)||typeof row.active!=='boolean')throw Error('Ungültiger Mitarbeitereintrag.');
  const email=row.email.toLowerCase();if(seen.has(email))throw Error('Doppelte E-Mail-Adresse.');seen.add(email);
 }
 return roster;
}
async function main(){
 const args=process.argv.slice(2),projectIndex=args.indexOf('--project'),project=projectIndex<0?null:args[projectIndex+1];
 if(project!=='marap024-botendienst-test'&&project!=='demo-marapo24')throw Error('Nur das freigegebene Projekt ist erlaubt.');
 const roster=validateRoster(JSON.parse(fs.readFileSync(args[0],'utf8')));
 console.log(`Geprüft: ${roster.filter(x=>x.role==='driver').length} Fahrer und ${roster.filter(x=>x.role==='office').length} Büro-Konten. Ziel: ${project}/protected-deliveries.`);
 if(!args.includes('--apply')){console.log('Trockenlauf: Keine Konten oder Rollen geändert.');return;}
 if(!args.includes('--approved-account-changes'))throw Error('Kontenänderungen müssen ausdrücklich freigegeben sein.');
 if(project==='demo-marapo24'&&(!process.env.FIRESTORE_EMULATOR_HOST||!process.env.FIREBASE_AUTH_EMULATOR_HOST))throw Error('Demo benötigt lokale Emulatoren.');
 const app=initializeApp({projectId:project,...(project==='demo-marapo24'?{}:{credential:applicationDefault()})});
 const db=getFirestore(app,'protected-deliveries'),auth=getAuth(app);
 for(const row of roster){
  let user;
  try{user=await auth.getUserByEmail(row.email)}catch(e){if(e.code!=='auth/user-not-found')throw e;user=await auth.createUser({email:row.email,displayName:row.displayName,disabled:!row.active});}
  if(row.active&&user.disabled)throw Error('Bestehendes Auth-Konto ist gesperrt. Separate Freigabe erforderlich; es wird nicht automatisch entsperrt.');
  // Only the dedicated database is changed. Disabling a profile revokes this
  // app's access without disabling a shared v3 Auth identity.
  await db.doc(`users/${user.uid}`).set({role:row.role,active:row.active,displayName:row.displayName,updatedAt:FieldValue.serverTimestamp()});
 }
 console.log('Freigegebene Profile gespeichert. Keine Einladungen versendet.');
}
module.exports={validateRoster};
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
