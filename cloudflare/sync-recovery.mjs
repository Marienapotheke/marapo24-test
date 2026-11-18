const transient=new Set(['unavailable','internal','deadline-exceeded']);
export function withinDeadline(operation,milliseconds=20000){
 let timer;return Promise.race([Promise.resolve().then(operation),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Object.assign(Error('Übertragung nicht bestätigt. Automatischer neuer Versuch bei geöffneter App; gespeicherte Vorgänge bleiben erhalten.'),{code:'unavailable'})),milliseconds);})]).finally(()=>clearTimeout(timer));
}
export async function drainQueue({list,send,accepted,acknowledge,recordError,valid,online}){
 const attempted=new Set(),blocked=new Set();
 outer:while(valid()&&online()){
  const items=(await list()).filter(item=>!attempted.has(item.input.completionId));if(!items.length)break;
  for(const item of items){
   if(!valid()||!online())break outer;const input=item.input;attempted.add(input.completionId);if(blocked.has(input.tourId))continue;
   try{const result=await send(item),confirmation=input.action==='start'?'started':input.action==='finish'?'finished':'completed';
    if(result?.[confirmation]!==true)throw Object.assign(Error('Serverbestätigung fehlt. Vorgang bleibt auf diesem Gerät und wird erneut übertragen.'),{code:'unavailable'});
    if(!valid())break outer;await accepted(item);if(!valid())break outer;await acknowledge(item);
   }catch(error){if(!valid())break outer;await recordError(item,error);if(transient.has(error.code))break outer;blocked.add(input.tourId);}
  }
 }
}
// Mobile browsers may suspend timers while hidden. Resume immediately when the
// app becomes visible, without waiting for a new online event or a page reload.
export function installSyncRecovery({sync,refresh,active,onError,win=window,doc=document,interval=30000}){
 let running=false,again=false,stopped=false;
 const enabled=()=>!stopped&&!doc.hidden&&active();
 async function run(){if(!enabled())return;if(running){again=true;return;}running=true;
  try{try{await sync();}catch(error){onError(error);}if(enabled())try{await refresh();}catch(error){onError(error);}}
  finally{running=false;if(again){again=false;if(enabled())queueMicrotask(run);}}
 }
 const visible=()=>{if(!doc.hidden)void run();};const events=['online','focus','pageshow'];for(const name of events)win.addEventListener(name,visible);doc.addEventListener('visibilitychange',visible);const timer=setInterval(run,interval);
 return {run,stop(){stopped=true;clearInterval(timer);for(const name of events)win.removeEventListener(name,visible);doc.removeEventListener('visibilitychange',visible);}};
}
