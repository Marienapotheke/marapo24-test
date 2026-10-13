import pngjs from '../functions/node_modules/pngjs/browser.js';
import {fail} from './domain.mjs';
export function validatePng(signature){
 if(typeof signature!=='string'||signature.length>180000||!/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(signature))fail('invalid-argument','Unterschrift prüfen.');
 const bytes=Buffer.from(signature.slice(22),'base64');
 if(bytes.length<33||bytes.toString('base64')!==signature.slice(22)||!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))fail('invalid-argument','PNG prüfen.');
 const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);
 if(width>600||height>150||width<1||height<1)fail('invalid-argument','Unterschrift zu groß für den Testlauf.');
 let png;try{png=pngjs.PNG.sync.read(bytes,{checkCRC:true});}catch{fail('invalid-argument','PNG beschädigt.');}let ink=0;
 for(let i=0;i<png.data.length;i+=4)if(png.data[i+3]>32&&Math.min(png.data[i],png.data[i+1],png.data[i+2])<200)ink++;
 if(ink<10)fail('invalid-argument','Unterschrift ist leer.');return {width,height,bytes:bytes.length};
}
