const hex=bytes=>Array.from(new Uint8Array(bytes),v=>v.toString(16).padStart(2,'0')).join('');
export function newOfficeSalt(){return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16)))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');}
export async function temporaryOfficeProof(password){return hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(password)));}
export async function deriveOfficeProof(username,salt,password){
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']),blocks=[];
 for(let i=0;i<6;i++)blocks.push(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode('MARAPO24-office-v2\0'+username+'\0'+salt+'\0'+i),iterations:100000,hash:'SHA-256'},key,256)));
 const joined=new Uint8Array(192);blocks.forEach((b,i)=>joined.set(b,i*32));return hex(await crypto.subtle.digest('SHA-256',joined));
}
