export const HANDOVER_LABELS={recipient:'Persönlich übergeben',neighbor:'Beim Nachbarn abgegeben',mailbox:'In den Briefkasten gelegt'};
export const FAILURE_REASONS=['Niemand angetroffen','Nachbar nicht erreichbar','Briefkasten nicht nutzbar','Annahme verweigert','Adresse nicht gefunden','Sonstiger Grund'];
export function localTimestamp(value){if(!value)return 'offen';const date=new Date(value);if(!Number.isFinite(+date))return 'Zeitangabe prüfen';return new Intl.DateTimeFormat('de-DE',{timeZone:'Europe/Berlin',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit',timeZoneName:'short'}).format(date);}
export function localDateTime(value){const date=value?new Date(value):null;if(!date||!Number.isFinite(+date))return {date:'Noch nicht erfasst',time:'—'};return {date:new Intl.DateTimeFormat('de-DE',{timeZone:'Europe/Berlin',day:'2-digit',month:'2-digit',year:'numeric'}).format(date),time:new Intl.DateTimeFormat('de-DE',{timeZone:'Europe/Berlin',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(date)};}
export function euroCents(value){
 const text=String(value).trim();if(!/^\d{1,4}(?:[,.]\d{1,2})?$/.test(text))throw Error('Betrag in Euro eingeben, zum Beispiel 5 oder 5,50.');
 const [euros,cents='']=text.replace(',','.').split('.');const amount=Number(euros)*100+Number(cents.padEnd(2,'0'));if(amount>999900)throw Error('Betrag darf höchstens 9.999 Euro sein.');return amount;
}
export function odometer(value){if(!Number.isSafeInteger(value)||value<0||value>9999999)throw Error('Kilometerstand als ganze Zahl zwischen 0 und 9.999.999 eingeben.');return value;}
export function needsSignature(type,status,method='recipient'){return type==='privat'&&status==='zugestellt'&&method!=='mailbox';}
export function handover(input,type){
 const method=input.deliveryMethod??(input.status==='zugestellt'?'recipient':null),reason=input.nonDeliveryReason??'',neighbor=input.neighborName??'';
 if(typeof neighbor!=='string'||neighbor.length>90||typeof reason!=='string'||reason.length>90)throw Error('Angaben zur Übergabe prüfen.');
 if(input.status==='zugestellt'){
  if(!Object.hasOwn(HANDOVER_LABELS,method)||(type!=='privat'&&method!=='recipient')||reason||(method!=='neighbor'&&neighbor))throw Error('Übergabeart prüfen.');
 }else if(input.status==='nicht zugestellt'){
  if(method!==null||neighbor||(reason&&!FAILURE_REASONS.includes(reason)))throw Error('Grund für Nichtzustellung prüfen.');
 }else throw Error('Zustellstatus prüfen.');
 return {deliveryMethod:method,nonDeliveryReason:reason,neighborName:neighbor.trim()};
}
