const encoder=new TextEncoder();
const base64=bytes=>{let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s);};
const bytes=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
const fingerprint=async key=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',key)),b=>b.toString(16).padStart(2,'0')).join('');
async function derive(password,salt){if(typeof password!=='string'||password.length<20||password.length>160)throw Error('Ein eigenes Wiederherstellungskennwort mit mindestens 20 Zeichen verwenden.');const material=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt,iterations:600000},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);}
export async function wrapRecoveryKey(recovery,password,target){
 if(recovery?.version!==1||bytes(recovery.key).length!==32||typeof target!=='string'||!target)throw Error('Ungültiger Sicherungsschlüssel.');
 const raw=bytes(recovery.key),salt=crypto.getRandomValues(new Uint8Array(32)),iv=crypto.getRandomValues(new Uint8Array(12));
 const header={version:1,kind:'MARAPO24-RECOVERY-KEY',target,keyId:await fingerprint(raw),kdf:'PBKDF2-SHA256',iterations:600000,salt:base64(salt),iv:base64(iv)};
 const key=await derive(password,salt),ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:encoder.encode(JSON.stringify(header))},key,encoder.encode(JSON.stringify(recovery)));raw.fill(0);return {header,ciphertext:base64(new Uint8Array(ciphertext))};
}
export async function unwrapRecoveryKey(vault,password,expectedTarget){
 const h=vault?.header;if(h?.version!==1||h.kind!=='MARAPO24-RECOVERY-KEY'||h.kdf!=='PBKDF2-SHA256'||h.iterations!==600000||typeof h.target!=='string'||!h.target||!/^[a-f0-9]{64}$/.test(h.keyId)||!h.salt||!h.iv||typeof vault.ciphertext!=='string'||vault.ciphertext.length>20000||expectedTarget&&h.target!==expectedTarget)throw Error('Falsche oder beschädigte Schlüsseldatei.');
 const salt=bytes(h.salt),iv=bytes(h.iv);if(salt.length!==32||iv.length!==12)throw Error('Ungültige Schlüsseldatei.');
 const key=await derive(password,salt);let plain;try{plain=await crypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:encoder.encode(JSON.stringify(h))},key,bytes(vault.ciphertext));}catch{throw Error('Wiederherstellungskennwort falsch oder Schlüsseldatei beschädigt.');}
 const result=JSON.parse(new TextDecoder().decode(plain));new Uint8Array(plain).fill(0);const raw=bytes(result.key);if(result.version!==1||raw.length!==32||await fingerprint(raw)!==h.keyId)throw Error('Sicherungsschlüssel stimmt nicht überein.');raw.fill(0);return result;
}
