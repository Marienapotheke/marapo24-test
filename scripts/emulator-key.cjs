'use strict';
// Synthetic key ONLY for local/CI emulators, never a deployed production secret.
const fs=require('node:fs'),crypto=require('node:crypto');
const {privateKey}=crypto.generateKeyPairSync('rsa',{modulusLength:3072,privateKeyEncoding:{type:'pkcs8',format:'pem'},publicKeyEncoding:{type:'spki',format:'pem'}});
fs.writeFileSync('functions/.secret.local','DELIVERY_PROOF_PRIVATE_KEY='+JSON.stringify(privateKey)+'\n',{mode:0o600});
