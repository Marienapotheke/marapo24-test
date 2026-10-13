import PDFDocument from '../functions/node_modules/pdfkit/js/pdfkit.standalone.js';
export async function officePdf(proof){
 const pdf=new PDFDocument({size:'A4',margin:50}),chunks=[];
 const done=new Promise((resolve,reject)=>{pdf.on('data',c=>chunks.push(c));pdf.on('error',reject);pdf.on('end',()=>{const size=chunks.reduce((n,c)=>n+c.length,0),out=new Uint8Array(size);let offset=0;for(const c of chunks){out.set(c,offset);offset+=c.length;}resolve(out);});});
 pdf.fontSize(20).text('MARAPO24 - Zustellnachweis');pdf.fontSize(11).text('TEST - NUR FIKTIVE DATEN').moveDown();
 for(const [label,value] of Object.entries({Lieferung:proof.stopId,Tour:proof.tourId,Herkunftsapotheke:proof.origin,Empfänger:proof.name,Adresse:proof.address,Status:proof.status,'Barzahlbetrag (€)':(proof.cents/100).toFixed(2),'Erfasst laut Gerät (ungeprüft)':proof.capturedAtClient,'Serverseitig archiviert':proof.completedAt,'Signatur SHA-256':proof.signatureSha256||'Keine Unterschrift'}))pdf.text(label+': '+value).moveDown(.5);
 if(proof.signature)pdf.image(proof.signature,{fit:[480,150]});pdf.end();return done;
}
