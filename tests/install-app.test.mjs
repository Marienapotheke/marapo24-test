import {test} from 'node:test';
import assert from 'node:assert/strict';
import {installAppButton} from '../cloudflare/install-app.mjs';
function fixture(standalone=false){const win=new EventTarget(),button=new EventTarget();win.matchMedia=()=>({matches:standalone});const messages=[];installAppButton(button,{windowObject:win,navigatorObject:{},message:text=>messages.push(text)});return {win,button,messages};}
test('installation only offered after browser approval; one prompt cannot be reused',async()=>{
 const {win,button,messages}=fixture();assert.equal(button.hidden,true);let count=0;
 const event=new Event('beforeinstallprompt',{cancelable:true});event.prompt=async()=>{count++;};event.userChoice=Promise.resolve({outcome:'accepted'});win.dispatchEvent(event);assert.equal(event.defaultPrevented,true);assert.equal(button.hidden,false);
 button.dispatchEvent(new Event('click'));button.dispatchEvent(new Event('click'));await new Promise(resolve=>setImmediate(resolve));assert.equal(count,1);assert.equal(button.hidden,true);assert.equal(button.disabled,false);assert.equal(messages.length,1);
});
test('already installed application does not offer a second installation',()=>{const {win,button}=fixture(true);win.dispatchEvent(new Event('beforeinstallprompt',{cancelable:true}));assert.equal(button.hidden,true);});
test('installation in another window withdraws pending prompt',()=>{const {win,button}=fixture();win.dispatchEvent(new Event('beforeinstallprompt',{cancelable:true}));assert.equal(button.hidden,false);win.dispatchEvent(new Event('appinstalled'));assert.equal(button.hidden,true);button.dispatchEvent(new Event('click'));});
