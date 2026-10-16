// Pending proofs contain only backend-encrypted envelopes; never plaintext signatures.
const DB_NAME='marapo24-protected-offline-v1';
const encoder=new TextEncoder(),decoder=new TextDecoder();
let opening;
function open(){return opening??=new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME,1);r.onupgradeneeded=()=>r.result.createObjectStore('items');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function operation(mode,fn){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('items',mode),store=tx.objectStore('items');let value;try{const r=fn(store);if(r){r.onsuccess=()=>value=r.result;r.onerror=()=>tx.abort();}}catch(e){reject(e);return;}tx.oncomplete=()=>resolve(value);tx.onabort=()=>reject(tx.error||Error('Gerätespeicher nicht verfügbar.'));tx.onerror=()=>reject(tx.error);});}
const get=key=>operation('readonly',s=>s.get(key));
const put=(key,value)=>operation('readwrite',s=>s.put(value,key));
const remove=key=>operation('readwrite',s=>s.delete(key));
export function toBase64(bytes){let s='';for(const b of new Uint8Array(bytes))s+=String.fromCharCode(b);return btoa(s);}
function fromBase64(text){return Uint8Array.from(atob(text),c=>c.charCodeAt(0));}
export async function sealSignature(publicKey,identity,signature,capturedAt){
  const rsa=await crypto.subtle.importKey('spki',fromBase64(publicKey.publicKey),{name:'RSA-OAEP',hash:'SHA-256'},false,['encrypt']);
  const aes=await crypto.subtle.generateKey({name:'AES-GCM',length:256},true,['encrypt']);
  const raw=await crypto.subtle.exportKey('raw',aes),iv=crypto.getRandomValues(new Uint8Array(12));
  const wrappedKey=await crypto.subtle.encrypt({name:'RSA-OAEP'},rsa,raw);
  new Uint8Array(raw).fill(0);
  const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:encoder.encode(JSON.stringify(identity))},aes,encoder.encode(JSON.stringify({signature,capturedAt})));
  return {version:1,keyId:publicKey.keyId,wrappedKey:toBase64(wrappedKey),iv:toBase64(iv),ciphertext:toBase64(ciphertext)};
}
export async function savePublicKey(uid,key){await put(`public:${uid}`,key);}
export async function getPublicKey(uid){return get(`public:${uid}`);}
export async function enqueue(uid,input){
  if('signature' in input)throw Error('Unverschlüsselte Unterschrift darf nicht gespeichert werden.');
  const db=await open();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('items','readwrite'),s=tx.objectStore('items'),r=s.getAll();
    let failure;
    r.onsuccess=()=>{
      const records=r.result.filter(x=>x?.kind==='pending'&&x.uid===uid);
      if(records.some(x=>(x.input.action||'delivery')===(input.action||'delivery')&&x.input.tourId===input.tourId&&x.input.stopId===input.stopId)){failure=Error('Für diesen Vorgang ist bereits ein Abschluss gespeichert.');tx.abort();return;}
      if(records.length>=200){failure=Error('200 Abschlüsse warten auf Übertragung. Bitte zuerst synchronisieren.');tx.abort();return;}
      const sequence=1+records.reduce((maximum,x)=>Math.max(maximum,x.sequence||0),0);
      s.put({kind:'pending',uid,input,error:null,sequence},`pending:${uid}:${input.completionId}`);
    };
    tx.oncomplete=()=>resolve();tx.onabort=()=>reject(failure||tx.error||Error('Abschluss konnte nicht auf dem Gerät gespeichert werden.'));tx.onerror=()=>reject(tx.error);
  });
}
export async function pending(uid){const all=await operation('readonly',s=>s.getAll());return all.filter(x=>x?.kind==='pending'&&x.uid===uid).sort((a,b)=>(a.sequence||0)-(b.sequence||0));}
export async function acknowledge(uid,completionId){await remove(`pending:${uid}:${completionId}`);}
export async function pendingError(uid,item,error){await put(`pending:${uid}:${item.input.completionId}`,{...item,error});}
export async function saveAssignments(uid,value){
  let key=await get(`cache-key:${uid}`);
  if(!key){key=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);await put(`cache-key:${uid}`,key);}
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:encoder.encode(uid)},key,encoder.encode(JSON.stringify({...value,savedAt:Date.now()})));
  await put(`assignments:${uid}`,{iv,ciphertext});
}
export async function loadAssignments(uid){
  const [key,box]=await Promise.all([get(`cache-key:${uid}`),get(`assignments:${uid}`)]);
  if(!key||!box)return null;
  const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:box.iv,additionalData:encoder.encode(uid)},key,box.ciphertext);
  const value=JSON.parse(decoder.decode(plain));
  if(Date.now()-value.savedAt>12*60*60*1000){await clearAssignments(uid);return null;}
  return value;
}
export async function clearAssignments(uid){await remove(`assignments:${uid}`);await remove(`cache-key:${uid}`);await remove(`public:${uid}`);}
