import {localTimestamp} from './tour-workflow.mjs';
import {recipientNames,parcelCount} from './stop-details.mjs';
import {collected} from './payment.mjs';
// Present original archived data. Never replace signed values with later corrections.
export function deliveryPdfRows(proof){
 const rows=[['Apotheke',proof.origin],['Name',recipientNames(proof)],['Adresse',proof.address]];
 if(proof.phone)rows.push(['Telefon',proof.phone]);
 rows.push(['Status',proof.status==='zugestellt'?'Zugestellt':'Nicht zugestellt']);
 if(proof.type!=='arzt')rows.push(['Anzahl Päckchen',parcelCount(proof.parcelCount)]);
 const capture=proof.capturedAtClient||proof.completedAt;
 if(capture)rows.push([proof.capturedAtClient?(proof.status==='zugestellt'?'Zugestellt am':'Zustellversuch am'):'Gespeichert am',localTimestamp(capture)]);
 if(proof.deliveryMethod==='neighbor'&&proof.neighborName)rows.push(['Nachbar',proof.neighborName]);
 if(proof.deliveryMethod==='dropoff'&&proof.dropoffLocation)rows.push(['Ablageort',proof.dropoffLocation]);
 if(proof.deliveryMethod==='mailbox')rows.push(['Übergabe','In den Briefkasten gelegt']);
 if(proof.deliveryMethod==='recipient')rows.push(['Übergabe','Persönlich übergeben']);
 if(proof.status!=='zugestellt'&&proof.nonDeliveryReason)rows.push(['Grund der Nichtzustellung',proof.nonDeliveryReason]);
 for(const [label,key] of [['Lieferhinweis','note'],['Fahrerkommentar','driverComment']])if(proof[key])rows.push([label,proof[key]]);
 const paid=collected(proof),due=Number.isSafeInteger(proof.cents)?proof.cents:0,money=n=>(n/100).toLocaleString('de-DE',{style:'currency',currency:'EUR'});
 rows.push(['Zu kassieren',money(due)],['Tatsächlich kassiert',money(paid)]);
 rows.push(['Offener Betrag',money(due-paid)]);
 if(proof.collectionReason)rows.push(['Zahlungsvermerk',proof.collectionReason]);
 else if(!proof.collectionConfirmed&&due>0)rows.push(['Zahlungsvermerk','Altbestand: Zahlung nicht gesondert bestätigt']);
 return rows.filter(([,value])=>value!==undefined&&value!==null&&String(value).trim()!=='');
}
export async function simpleDeliveryPdf(proof,PDFDocument,{test=false}={}){
 const doc=new PDFDocument({size:'A4',margin:50,info:{Title:'MARAPO24 - Zustellnachweis'}}),chunks=[];
 const output=new Promise((resolve,reject)=>{doc.on('data',chunk=>chunks.push(chunk));doc.on('error',reject);doc.on('end',()=>{const bytes=new Uint8Array(chunks.reduce((sum,c)=>sum+c.length,0));let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}resolve(bytes);});});
 const colour=proof.origin==='Cusanus-Apotheke'?'#613586':'#174d80';
 doc.font('Helvetica-Bold').fontSize(20).fillColor(colour).text(proof.status==='zugestellt'?'MARAPO24 - Zustellnachweis':'MARAPO24 - Zustellversuch').moveDown(.6);
 doc.font('Helvetica').fontSize(11).fillColor('black');if(test)doc.text('TEST - NUR FIKTIVE DATEN').moveDown();
 if(proof.voided)doc.font('Helvetica-Bold').fillColor('#b00020').text('ZURÜCKGENOMMEN - dieser Originalabschluss ist nicht mehr gültig.').moveDown().font('Helvetica').fillColor('black');
 else if(proof.corrections?.some(c=>c.afterCompletion)||proof.packageCorrections?.some(c=>c.afterDelivery))doc.font('Helvetica-Bold').fillColor('#8a4b00').text('Nachträglich korrigiert: Hier stehen die ursprünglichen Angaben zur ursprünglichen Unterschrift. Gültige Änderungen sind im Korrekturverlauf der App einsehbar.').moveDown().font('Helvetica').fillColor('black');
 for(const [label,value] of deliveryPdfRows(proof)){if(doc.y>doc.page.height-85)doc.addPage();const unpaid=label==='Offener Betrag'&&proof.cents>collected(proof)||label==='Zahlungsvermerk'&&proof.collectionReason;doc.font(unpaid?'Helvetica-Bold':'Helvetica').fillColor(unpaid?'#b00020':label==='Apotheke'?colour:'black').text(label+': '+String(value??''),{width:495}).moveDown(.5);}
 doc.font('Helvetica').fillColor('black');
 if(proof.signature){if(doc.y+185>doc.page.height-50)doc.addPage();doc.moveDown().text('Unterschrift zur oben dokumentierten Zustellung:').moveDown(.5);doc.image(proof.signature,50,doc.y,{fit:[480,150]});}
 if(proof.photo&&proof.deliveryMethod==='dropoff'){doc.addPage();doc.font('Helvetica-Bold').fontSize(16).text('Ablagefoto').moveDown();doc.font('Helvetica').fontSize(11).text(proof.dropoffLocation||'').moveDown();doc.image(proof.photo,50,doc.y,{fit:[480,480]});}
 doc.end();return output;
}
