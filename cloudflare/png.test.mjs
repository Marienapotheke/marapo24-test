import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {deflateSync} from 'node:zlib';
import {validatePng,crc32} from './png.mjs';
const require=createRequire(import.meta.url),{PNG}=require('../functions/node_modules/pngjs');
const url=bytes=>'data:image/png;base64,'+bytes.toString('base64');
function image(ink=true){const p=new PNG({width:360,height:150});p.data.fill(255);if(ink)for(let x=20;x<180;x++){const i=(60*360+x)*4;p.data[i]=p.data[i+1]=p.data[i+2]=0;}return p;}
function chunk(type,data){const b=Buffer.alloc(data.length+12);b.writeUInt32BE(data.length);b.write(type,4);data.copy(b,8);b.writeUInt32BE(crc32(b.subarray(4,-4)),b.length-4);return b;}
function handcrafted(raw,{width=1,height=1,filter=0}={}){const h=Buffer.alloc(13);h.writeUInt32BE(width);h.writeUInt32BE(height,4);h[8]=8;h[9]=6;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',h),chunk('IDAT',deflateSync(raw||Buffer.from([filter,0,0,0,255]))),chunk('IEND',Buffer.alloc(0))]);}
test('native PNG validation accepts canvas RGB/RGBA with all five scanline filters',async()=>{for(const colorType of [2,6])for(const filterType of [0,1,2,3,4])assert.equal((await validatePng(url(PNG.sync.write(image(),{colorType,inputColorType:6,filterType})))).width,360);});
test('blank and transparent images cannot become signature evidence',async()=>{await assert.rejects(validatePng(url(PNG.sync.write(image(false)))));const p=image();for(let i=3;i<p.data.length;i+=4)p.data[i]=0;await assert.rejects(validatePng(url(PNG.sync.write(p))));});
test('CRC damage, truncation and hidden appended chunks are rejected',async()=>{const b=PNG.sync.write(image()),changed=Buffer.from(b);changed[changed.length-6]^=1;for(const invalid of [changed,b.subarray(0,-4),Buffer.concat([b,chunk('IEND',Buffer.alloc(0))])])await assert.rejects(validatePng(url(invalid)));});
test('declared dimensions cannot bypass decompression output or filter limits',async()=>{for(const b of [handcrafted(Buffer.alloc(2_000_000)),handcrafted(Buffer.alloc(4)),handcrafted(undefined,{filter:5}),handcrafted(undefined,{width:601})])await assert.rejects(validatePng(url(b)));});
test('an invalid filter after visible ink still rejects the entire image',async()=>{const width=20,height=2,raw=Buffer.alloc((width*4+1)*height);raw.fill(255);raw[0]=0;for(let i=1;i<width*4;i+=4)raw[i]=raw[i+1]=raw[i+2]=0;raw[width*4+1]=5;await assert.rejects(validatePng(url(handcrafted(raw,{width,height}))));});
test('unsupported interlacing and critical/ancillary image extensions fail closed',async()=>{const b=handcrafted(),data=Buffer.from(b.subarray(16,29));data[12]=1;const interlace=Buffer.concat([b.subarray(0,8),chunk('IHDR',data),b.subarray(33)]);const extension=Buffer.concat([b.subarray(0,33),chunk('zTXt',Buffer.from('hidden data')),b.subarray(33)]);await assert.rejects(validatePng(url(interlace)));await assert.rejects(validatePng(url(extension)));});
