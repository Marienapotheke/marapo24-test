import policy from '../functions/policy.cjs';
export const fail=policy.reject;
export function hasRole(p,role){return p?.active===true&&(p.role===role||p.roles?.includes(role));}
export function requireRole(p,role){if(!hasRole(p,role))fail('permission-denied','Keine Berechtigung für diesen Vorgang.');}
export function localDate(now=new Date()){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
export function weekday(date){if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date))fail('invalid-argument','Datum prüfen.');const d=new Date(date+'T12:00:00Z');if(!Number.isFinite(+d)||d.toISOString().slice(0,10)!==date)fail('invalid-argument','Datum prüfen.');return d.getUTCDay();}
const REGULAR={doctor1:'Ärztetour 1',doctor2:'Ärztetour 2',partner:'Partnerapotheken-Tour',hunsrueck:'Hunsrück',eifel:'Eifel',mosel:'Mosel',saturday:'Samstag: Privatkunden-Vormittag'};
export function regularTours(date){const day=weekday(date);const ids=day===0?[]:day===6?['saturday']:['doctor1',...(day===3||day===5?['doctor2','partner']:[]),'hunsrueck','eifel','mosel'];return ids.map(id=>({id,label:REGULAR[id]}));}
export function fields(input,allowed){if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!allowed.includes(k)))fail('invalid-argument','Ungültige Eingabefelder.');}
export function text(value,max,required=false){if(typeof value!=='string'||value.length>max||(required&&!value.trim()))fail('invalid-argument','Textfelder prüfen.');return value.trim();}
export function id(value){if(typeof value!=='string'||!/^[A-Za-z0-9_-]{1,128}$/.test(value))fail('invalid-argument','Ungültige Vorgangsnummer.');return value;}
export function capture(input){if(typeof input.completionId!=='string'||!/^[0-9a-f-]{36}$/i.test(input.completionId)||typeof input.capturedAt!=='string'||input.capturedAt.length>40)fail('invalid-argument','Ungültiger Abschluss.');const t=Date.parse(input.capturedAt);if(!Number.isFinite(t)||t>Date.now()+300000||Date.now()-t>172800000)fail('failed-precondition','Gerätezeit oder ausstehenden Offline-Abschluss prüfen.');}
export function packageData(input,tour){
 fields(input,['tourId','type','origin','name','street','postalCode','city','phone','note','cents','paymentReason']);id(input.tourId);
 if(!['privat','arzt','pflege','partner'].includes(input.type)||!['Marienapotheke','Cusanus-Apotheke'].includes(input.origin))fail('invalid-argument','Lieferart oder Herkunft prüfen.');
 if(tour.regularType==='saturday'&&input.type!=='privat')fail('failed-precondition','Samstagstouren sind ausschließlich für Privatkunden.');
 const result={type:input.type,origin:input.origin,name:text(input.name,90,true),street:text(input.street,100,true),postalCode:text(input.postalCode,10,true),city:text(input.city,90,true),phone:text(input.phone??'',40),note:text(input.note??'',240),cents:input.cents,paymentReason:text(input.paymentReason??'',80)};
 if(!/^[0-9]{5}$/.test(result.postalCode)||!Number.isSafeInteger(result.cents)||result.cents<0||result.cents>999900)fail('invalid-argument','Postleitzahl oder Barzahlbetrag prüfen.');
 result.address=result.street+', '+result.postalCode+' '+result.city;return result;
}
