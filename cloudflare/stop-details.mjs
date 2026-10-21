export const cashExemptType=type=>['pflege','partner'].includes(type);
export function parcelCount(value){
 if(value===undefined)return 1;
 if(!Number.isSafeInteger(value)||value<1||value>999)throw Object.assign(Error('Anzahl Päckchen muss eine ganze Zahl von 1 bis 999 sein.'),{code:'invalid-argument'});
 return value;
}
export const countedParcels=stop=>stop.type==='arzt'?0:parcelCount(stop.parcelCount);
export const parcelDescription=stop=>stop.type==='arzt'?'Arztlieferung · nicht in der Päckchensumme':parcelCount(stop.parcelCount)+' Päckchen';
export const totalParcels=stops=>stops.reduce((sum,s)=>sum+(s.voided||s.removed?0:countedParcels(s)),0);
export const dueCents=stop=>stop.cashExempt===true||stop.removed?0:stop.cents;
export const recipientNames=stop=>[stop.name,stop.secondName].filter(Boolean).join(' / ');
// Display only: keep the planned relative order and never write a new route here.
export function driverDisplayStops(stops,queue=[]){
 const visible=stops.filter(s=>!s.removed||queue.some(q=>q.input.stopId===s.id));
 const open=s=>!s.voided&&!s.removed&&(queue.find(q=>q.input.stopId===s.id)?.input.status||s.status)==='offen';
 return [...visible.filter(open),...visible.filter(s=>!open(s))];
}
export function phoneHref(phone){
 const number=String(phone||'').trim().replace(/^(\+\d{1,3})\s*\(0\)/,'$1').replace(/[\s()./-]/g,'');
 return /^\+?[0-9]{3,20}$/.test(number)?'tel:'+number:null;
}
export function driverComment(value){
 if(value===undefined)return '';
 if(typeof value!=='string'||value.length>500||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value))throw Object.assign(Error('Fahrerkommentar prüfen (höchstens 500 Zeichen).'),{code:'invalid-argument'});
 return value.trim();
}
