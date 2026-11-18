'use strict';
const fs=require('node:fs'),path=require('node:path');
const out=path.resolve('dist');
fs.mkdirSync(out,{recursive:true});
for(const file of ['index.html','app.mjs','app-config.js','offline-store.mjs','sw.js','manifest.webmanifest'])fs.copyFileSync(file,path.join(out,file));
console.log('App files prepared in dist; no backend files or secrets included.');
