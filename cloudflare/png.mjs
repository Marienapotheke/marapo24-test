import {fail} from './domain.mjs';
import {inflateSync,crc32} from 'node:zlib';
export {crc32};
// Canvas exports non-interlaced 8-bit RGB/RGBA. Native bounded decompression
// avoids shipping the synchronous JavaScript PNG/inflate implementation.
const paeth=(a,b,c)=>{const p=a+b-c,da=Math.abs(p-a),db=Math.abs(p-b),dc=Math.abs(p-c);return da<=db&&da<=dc?a:db<=dc?b:c;};
export async function validatePng(signature){
 if(typeof signature!=='string'||signature.length>180000||!/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(signature))fail('invalid-argument','Unterschrift prüfen.');
 const bytes=Buffer.from(signature.slice(22),'base64');
 if(bytes.length<45||bytes.toString('base64')!==signature.slice(22)||!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))fail('invalid-argument','PNG prüfen.');
 let offset=8,width,height,bpp,seenHeader=false,seenData=false,closedData=false,ended=false,total=0;const chunks=[];
 while(offset<bytes.length){
  if(offset+12>bytes.length)fail('invalid-argument','PNG beschädigt.');
  const size=bytes.readUInt32BE(offset),end=offset+12+size;if(end>bytes.length)fail('invalid-argument','PNG beschädigt.');
  const kind=bytes.toString('ascii',offset+4,offset+8),data=bytes.subarray(offset+8,offset+8+size);
  if(crc32(bytes.subarray(offset+4,offset+8+size))!==bytes.readUInt32BE(offset+8+size))fail('invalid-argument','PNG beschädigt.');
  if(!seenHeader&&kind!=='IHDR')fail('invalid-argument','PNG-Kopf fehlt.');
  if(kind==='IHDR'){
   if(seenHeader||size!==13)fail('invalid-argument','PNG-Kopf prüfen.');seenHeader=true;width=data.readUInt32BE(0);height=data.readUInt32BE(4);
   if(width<1||width>600||height<1||height>150)fail('invalid-argument','Unterschrift zu groß für den Testlauf.');
   if(data[8]!==8||![2,6].includes(data[9])||data[10]!==0||data[11]!==0||data[12]!==0)fail('invalid-argument','Unterschrift bitte in der App erfassen.');bpp=data[9]===6?4:3;
  }else if(kind==='IDAT'){
   if(closedData)fail('invalid-argument','PNG-Reihenfolge prüfen.');seenData=true;chunks.push(data);total+=size;
  }else if(kind==='IEND'){
   if(!seenData||size!==0||end!==bytes.length)fail('invalid-argument','PNG-Abschluss prüfen.');ended=true;
  }else{
   if(!['sRGB','gAMA','cHRM','pHYs','sBIT'].includes(kind)||size>32)fail('invalid-argument','PNG-Zusatzdaten nicht zulässig.');if(seenData)closedData=true;
  }
  offset=end;
 }
 if(!ended||!total)fail('invalid-argument','PNG unvollständig.');
 const compressed=Buffer.concat(chunks,total),stride=width*bpp,expected=(stride+1)*height;let raw;
 try{raw=inflateSync(compressed,{maxOutputLength:expected});}catch{fail('invalid-argument','PNG beschädigt oder zu groß.');}
 if(raw.length!==expected)fail('invalid-argument','PNG-Bildgröße prüfen.');
 for(let y=0;y<height;y++)if(raw[y*(stride+1)]>4)fail('invalid-argument','PNG-Filter prüfen.');
 let previous=new Uint8Array(stride),current=new Uint8Array(stride),ink=0;
 for(let y=0;y<height;y++){
  const start=y*(stride+1),filter=raw[start];if(filter>4)fail('invalid-argument','PNG-Filter prüfen.');
  if(filter===0)current.set(raw.subarray(start+1,start+1+stride));
  else for(let x=0;x<stride;x++){const a=x>=bpp?current[x-bpp]:0,b=previous[x],c=x>=bpp?previous[x-bpp]:0;let v=raw[start+1+x];if(filter===1)v+=a;else if(filter===2)v+=b;else if(filter===3)v+=(a+b)>>>1;else if(filter===4)v+=paeth(a,b,c);current[x]=v&255;}
  for(let x=0;x<stride;x+=bpp)if((bpp===3||current[x+3]>32)&&(current[x]<200||current[x+1]<200||current[x+2]<200))ink++;
  if(ink>=10)return {width,height,bytes:bytes.length};
  [previous,current]=[current,previous];
 }
 if(ink<10)fail('invalid-argument','Unterschrift ist leer.');return {width,height,bytes:bytes.length};
}
