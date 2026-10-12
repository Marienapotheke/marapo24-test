'use strict';
if(process.env.APPROVED_MARAPO24_DEPLOY!=='marap024-botendienst-test:protected-deliveries'){
 console.error('Deployment gesperrt: Kosten, isolierte Testbereitstellung und Ziel müssen ausdrücklich freigegeben werden.');process.exit(1);
}
const fs=require('node:fs'),path=require('node:path');
const config=JSON.parse(fs.readFileSync(path.resolve('firebase.json'),'utf8'));
if(config.firestore?.some(x=>x.database!=='protected-deliveries')||config.hosting?.target!=='protected-app')throw Error('Unsicheres Bereitstellungsziel.');
