// LOCAL FEASIBILITY HARNESS ONLY. Fixture roles are not authentication.
// No deploy configuration, account credentials or public application endpoint.
import {openWebEnvelope} from '../cloudflare/web-envelope.mjs';
import policy from '../functions/policy.cjs';
import PDFDocument from '../functions/node_modules/pdfkit/js/pdfkit.standalone.js';
import pngjs from '../functions/node_modules/pngjs/browser.js';

export function validatePng(signature){
 const bytes=Buffer.from(signature.slice(22),'base64');
 if(bytes.length<33||!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw Error('Invalid PNG');
 const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);
 if(width>1600||height>400||width<1||height<1)throw Error('PNG dimensions');
 const png=pngjs.PNG.sync.read(bytes,{checkCRC:true});let ink=0;
 for(let i=0;i<png.data.length;i+=4)if(png.data[i+3]>32&&Math.min(png.data[i],png.data[i+1],png.data[i+2])<200)ink++;
 if(ink<10)throw Error('Blank signature');return {width,height,bytes:bytes.length};
}
export async function makePdf(signature){
 const pdf=new PDFDocument({size:'A4',margin:50});const chunks=[];
 const done=new Promise((resolve,reject)=>{pdf.on('data',c=>chunks.push(c));pdf.on('end',()=>resolve(Buffer.concat(chunks)));pdf.on('error',reject);});
 pdf.fontSize(20).text('MARAPO24 - FIKTIVER TECHNIKTEST');pdf.fontSize(11).text('Erika Muster / Musterweg 1');
 pdf.image(signature,{fit:[480,150]});pdf.end();return done;
}
export default {
 async fetch(request,env){
  if(env.LOCAL_FICTIONAL_PROBE!=='yes')return new Response('Local probe only',{status:503});
  try{
   const body=await request.json(),path=new URL(request.url).pathname;
   policy.authorize(body.uid,body.profile,path==='/pdf'?'office':'driver');
   if(path==='/decrypt'){
    const opened=await openWebEnvelope(body.box,body.identity,env.FICTIONAL_KEY);
    const png=validatePng(opened.signature);
    return Response.json({opened:true,...png,capturedAt:opened.capturedAt});
   }
   if(path==='/pdf')return new Response(await makePdf(body.signature),{headers:{'Content-Type':'application/pdf','Cache-Control':'no-store'}});
   return new Response('Unknown probe',{status:404});
  }catch(e){return Response.json({code:e.code||'invalid-argument',fictionalProbeError:e.message},{status:e.code==='permission-denied'?403:400});}
 }
};
