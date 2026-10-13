import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {pipeline} from 'node:stream/promises';
const MAGIC='MARAPO24-ENCRYPTED-BACKUP-1\n';
const keyId=key=>crypto.createHash('sha256').update(key).digest('hex');
const hashFile=async file=>{const hash=crypto.createHash('sha256');for await(const chunk of fs.createReadStream(file))hash.update(chunk);return hash.digest('hex');};
function checkKey(key){if(!Buffer.isBuffer(key)||key.length!==32)throw Error('A separate 256-bit recovery key is required.');}
export async function encryptBackup(source,destination,key,target){
 checkKey(key);if(path.resolve(source)===path.resolve(destination))throw Error('Backup source and destination must differ.');
 const stat=await fsp.stat(source);if(!stat.isFile()||stat.size===0)throw Error('Empty or invalid SQL export.');
 const iv=crypto.randomBytes(12),header={version:1,createdAt:new Date().toISOString(),target,keyId:keyId(key),bytes:stat.size,sha256:await hashFile(source),iv:iv.toString('base64')};
 const metadata=Buffer.from(JSON.stringify(header)),prefix=Buffer.from(MAGIC+metadata.toString()+'\n');
 const cipher=crypto.createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(metadata);
 await fsp.writeFile(destination,prefix,{flag:'wx',mode:0o600});
 try{await pipeline(fs.createReadStream(source),cipher,fs.createWriteStream(destination,{flags:'a'}));await fsp.appendFile(destination,cipher.getAuthTag());}
 catch(e){await fsp.unlink(destination).catch(()=>{});throw e;}return header;
}
export async function decryptBackup(source,destination,key,expectedTarget){
 checkKey(key);if(path.resolve(source)===path.resolve(destination))throw Error('Restore destination must differ.');
 const file=await fsp.open(source,'r');let stat,prefix,offset,header,metadata,tag;
 try{stat=await file.stat();const b=Buffer.alloc(Math.min(8192,stat.size));await file.read(b,0,b.length,0);prefix=b.toString();if(!prefix.startsWith(MAGIC))throw Error('Unsupported backup format.');const end=b.indexOf(10,Buffer.byteLength(MAGIC));if(end<0)throw Error('Missing backup header.');offset=end+1;metadata=b.subarray(Buffer.byteLength(MAGIC),end);header=JSON.parse(metadata.toString());tag=Buffer.alloc(16);if(stat.size<offset+17)throw Error('Incomplete backup.');await file.read(tag,0,16,stat.size-16);}finally{await file.close();}
 if(header.version!==1||header.keyId!==keyId(key)||!Number.isSafeInteger(header.bytes)||header.bytes<1||!/^[a-f0-9]{64}$/.test(header.sha256))throw Error('Wrong recovery key or invalid backup header.');
 if(expectedTarget&&JSON.stringify(header.target)!==JSON.stringify(expectedTarget))throw Error('Backup belongs to another database.');
 const iv=Buffer.from(header.iv,'base64');if(iv.length!==12)throw Error('Invalid backup nonce.');
 const decipher=crypto.createDecipheriv('aes-256-gcm',key,iv);decipher.setAAD(metadata);decipher.setAuthTag(tag);
 // Never overwrite a target; failed authentication removes only this new temp file.
 const destinationFile=await fsp.open(destination,'wx',0o600);await destinationFile.close();
 try{await pipeline(fs.createReadStream(source,{start:offset,end:stat.size-17}),decipher,fs.createWriteStream(destination,{flags:'r+'}));const restored=await fsp.stat(destination);if(restored.size!==header.bytes||await hashFile(destination)!==header.sha256)throw Error('Restored SQL integrity mismatch.');}
 catch(e){await fsp.unlink(destination).catch(()=>{});throw e;}return header;
}
