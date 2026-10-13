import envelope from '../functions/envelope.cjs';
import policy from '../functions/policy.cjs';
const decode=(value,max)=>{if(typeof value!=='string'||value.length>max||!/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value))policy.reject('invalid-argument','Invalid envelope');return Uint8Array.from(atob(value),c=>c.charCodeAt(0));};
let lastPem,lastKey;
export function deliveryKey(pem){
 if(pem!==lastPem){const metadata=envelope.keys(pem),der=decode(pem.replace(/-----[^-]+-----|\s/g,''),10000),rsa=crypto.subtle.importKey('pkcs8',der,{name:'RSA-OAEP',hash:'SHA-256'},false,['decrypt']);lastKey={keyId:metadata.keyId,publicKey:metadata.publicKey,rsa};lastPem=pem;}
 return lastKey;
}
export async function openWebEnvelope(box,identity,pem,now=Date.now()){
 if(!box||Array.isArray(box)||Object.keys(box).some(k=>!['version','keyId','wrappedKey','iv','ciphertext'].includes(k))||box.version!==1)policy.reject('invalid-argument','Invalid envelope');
 const key=deliveryKey(pem);if(box.keyId!==key.keyId)policy.reject('failed-precondition','Wrong key');
 const wrapped=decode(box.wrappedKey,1024),iv=decode(box.iv,32),ciphertext=decode(box.ciphertext,260000);
 if(iv.length!==12||ciphertext.length<17)policy.reject('invalid-argument','Invalid envelope');
 let payload;
 try{
  const rsa=await key.rsa;
  const raw=await crypto.subtle.decrypt({name:'RSA-OAEP'},rsa,wrapped);
  if(raw.byteLength!==32)throw Error('Invalid AES key');
  const aes=await crypto.subtle.importKey('raw',raw,'AES-GCM',false,['decrypt']);new Uint8Array(raw).fill(0);
  const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode(JSON.stringify(identity))},aes,ciphertext);
  payload=JSON.parse(new TextDecoder().decode(plain));
 }catch{policy.reject('invalid-argument','Envelope changed');}
 if(!payload||Object.keys(payload).some(k=>!['signature','capturedAt'].includes(k))||typeof payload.signature!=='string'||payload.signature.length>180000||typeof payload.capturedAt!=='string')policy.reject('invalid-argument','Invalid payload');
 const captured=Date.parse(payload.capturedAt);
 if(!Number.isFinite(captured)||captured>now+300000||now-captured>172800000)policy.reject('failed-precondition','Capture age');
 return payload;
}
