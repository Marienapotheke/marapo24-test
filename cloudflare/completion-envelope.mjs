const toBase64=bytes=>btoa(Array.from(new Uint8Array(bytes),b=>String.fromCharCode(b)).join(''));
// Same authenticated envelope as signatures; comments never enter the plaintext queue.
export async function sealCompletion(publicKey,identity,signature,capturedAt,driverComment){
 const encoder=new TextEncoder(),rsa=await crypto.subtle.importKey('spki',Uint8Array.from(atob(publicKey.publicKey),c=>c.charCodeAt(0)),{name:'RSA-OAEP',hash:'SHA-256'},false,['encrypt']);
 const aes=await crypto.subtle.generateKey({name:'AES-GCM',length:256},true,['encrypt']),raw=await crypto.subtle.exportKey('raw',aes),iv=crypto.getRandomValues(new Uint8Array(12));
 const wrappedKey=await crypto.subtle.encrypt({name:'RSA-OAEP'},rsa,raw);new Uint8Array(raw).fill(0);
 const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:encoder.encode(JSON.stringify(identity))},aes,encoder.encode(JSON.stringify({signature,capturedAt,driverComment})));
 return {version:1,keyId:publicKey.keyId,wrappedKey:toBase64(wrappedKey),iv:toBase64(iv),ciphertext:toBase64(ciphertext)};
}
