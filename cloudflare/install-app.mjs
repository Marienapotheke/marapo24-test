export function installAppButton(button,{windowObject=window,navigatorObject=navigator,message=()=>{}}={}){
 let prompt=null;
 const installed=()=>windowObject.matchMedia('(display-mode: standalone)').matches||navigatorObject.standalone===true;
 button.hidden=true;
 windowObject.addEventListener('beforeinstallprompt',event=>{event.preventDefault();if(installed())return;prompt=event;button.hidden=false;});
 windowObject.addEventListener('appinstalled',()=>{prompt=null;button.hidden=true;});
 button.addEventListener('click',async()=>{if(!prompt||installed())return;const event=prompt;prompt=null;button.disabled=true;try{await event.prompt();const choice=await event.userChoice;if(choice.outcome==='accepted')message('Installation bestätigt. MARAPO24 anschließend über das App-Symbol öffnen.');}catch{message('Installation nicht bestätigt. In Chrome das Menü „Installieren“ verwenden.');}finally{button.hidden=true;button.disabled=false;}});
}
