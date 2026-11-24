'use strict';
const crypto = require('node:crypto');
const { reject } = require('./policy.cjs');
function keys(pem) {
  const privateKey = crypto.createPrivateKey(pem);
  const publicKey = crypto.createPublicKey(privateKey);
  const spki = publicKey.export({type:'spki',format:'der'});
  return { privateKey, publicKey:spki.toString('base64'), keyId:crypto.createHash('sha256').update(spki).digest('hex') };
}
function base64(value, maximum) {
  if(typeof value!=='string'||value.length>maximum||!/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value))reject('invalid-argument','Ungültiger verschlüsselter Nachweis.');
  return Buffer.from(value,'base64');
}
function openEnvelope(box, identity, pem, now=Date.now()) {
  if(!box||typeof box!=='object'||Array.isArray(box)||Object.keys(box).some(k=>!['version','keyId','wrappedKey','iv','ciphertext'].includes(k))||box.version!==1)
    reject('invalid-argument','Ungültiger verschlüsselter Nachweis.');
  const key=keys(pem);
  if(box.keyId!==key.keyId)reject('failed-precondition','Verschlüsselungsschlüssel nicht mehr verfügbar. Nachweis bleibt auf dem Gerät.');
  const wrapped=base64(box.wrappedKey,1024),iv=base64(box.iv,32),ciphertext=base64(box.ciphertext,260000);
  if(iv.length!==12||ciphertext.length<17)reject('invalid-argument','Ungültiger verschlüsselter Nachweis.');
  let payload;
  try {
    const aes=crypto.privateDecrypt({key:key.privateKey,oaepHash:'sha256',padding:crypto.constants.RSA_PKCS1_OAEP_PADDING},wrapped);
    if(aes.length!==32)throw Error('key');
    const decipher=crypto.createDecipheriv('aes-256-gcm',aes,iv);
    decipher.setAAD(Buffer.from(JSON.stringify(identity)));
    decipher.setAuthTag(ciphertext.subarray(-16));
    payload=JSON.parse(Buffer.concat([decipher.update(ciphertext.subarray(0,-16)),decipher.final()]).toString('utf8'));
    aes.fill(0);
  } catch { reject('invalid-argument','Nachweis wurde verändert oder gehört zu einer anderen Lieferung.'); }
  if(!payload||Object.keys(payload).some(k=>!['signature','capturedAt'].includes(k))||typeof payload.signature!=='string'||payload.signature.length>180000||typeof payload.capturedAt!=='string')
    reject('invalid-argument','Ungültiger Nachweisinhalt.');
  const captured=Date.parse(payload.capturedAt);
  if(!Number.isFinite(captured)||captured>now+5*60*1000||now-captured>48*60*60*1000)
    reject('failed-precondition','Gerätezeit prüfen. Offline-Nachweis muss innerhalb von 48 Stunden übertragen werden.');
  return payload;
}
module.exports={keys,openEnvelope};
