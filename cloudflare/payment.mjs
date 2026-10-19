export function payment(input,due,status){
 const invalid=()=>{throw Object.assign(Error('Kassierten Betrag und Zahlungsgrund prüfen.'),{code:'invalid-argument'});};
 const supplied=['collectedCents','collectionReason'].some(k=>k in input);
 // Preserve pending completions from older tablets without inventing an explicit confirmation.
 if(!supplied)return {collectedCents:status==='zugestellt'?due:0,collectionReason:'',collectionConfirmed:false};
 const cents=input.collectedCents,reason=input.collectionReason;
 if(!Number.isSafeInteger(cents)||cents<0||cents>due||typeof reason!=='string'||reason.length>120)invalid();
 if(status!=='zugestellt'&&(cents!==0||reason!==''))invalid();
 if(status==='zugestellt'&&cents<due&&!['Kein Geld vorhanden','Nur Teilbetrag vorhanden','Zahlung abgelehnt','Sonstiger Grund'].includes(reason))invalid();
 if(cents===due&&reason!=='')invalid();
 return {collectedCents:cents,collectionReason:reason,collectionConfirmed:true};
}
export function collected(stop){return Number.isSafeInteger(stop.collectedCents)?stop.collectedCents:stop.status==='zugestellt'?stop.cents:0;}
export function cashByPharmacy(stops){
 const totals=new Map([['Marienapotheke',0],['Cusanus-Apotheke',0]]);
 for(const stop of stops)if(!stop.voided&&!stop.removed&&stop.status==='zugestellt')totals.set(stop.origin,(totals.get(stop.origin)||0)+collected(stop));
 return [...totals].map(([origin,cents])=>({origin,cents}));
}
