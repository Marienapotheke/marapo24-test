// Keep large-screen handwriting proportional when fitting the existing bounded PNG format.
function fit(context,image,width,height){const scale=Math.min(width/image.width,height/image.height);context.drawImage(image,(width-image.width*scale)/2,(height-image.height*scale)/2,image.width*scale,image.height*scale);}
export function installSignatureScreen(target,{changed,editable=()=>true,description=()=>''}){
 const button=document.createElement('button');button.type='button';button.className='secondary signature-expand';button.textContent='Unterschrift im Vollbild';button.dataset.signatureFor=target.id;target.before(button);
 const dialog=document.createElement('dialog');dialog.className='signature-screen';dialog.innerHTML='<h2>Hier unterschreiben</h2><p>Für mehr Breite kannst du das Gerät quer halten.</p><div class="signature-surface"><canvas aria-label="Große Unterschriftsfläche"></canvas></div><div class="flex"><button type="button" data-signature-clear class="secondary">Löschen</button><button type="button" data-signature-accept>Unterschrift übernehmen</button><button type="button" data-signature-cancel class="secondary">Zurück</button></div>';
 const identity=document.createElement('p');identity.className='signature-identity';dialog.querySelector('h2').after(identity);
 document.body.append(dialog);const canvas=dialog.querySelector('canvas'),context=canvas.getContext('2d');let writing=false,modified=false,observer;
 function resize(){const box=canvas.parentElement.getBoundingClientRect();if(box.width<1||box.height<1)return;const snapshot=document.createElement('canvas');snapshot.width=canvas.width;snapshot.height=canvas.height;snapshot.getContext('2d').drawImage(canvas,0,0);canvas.width=Math.max(1,Math.round(box.width));canvas.height=Math.max(1,Math.round(box.height));fit(context,snapshot,canvas.width,canvas.height);writing=false;}
 button.onclick=()=>{if(!editable())return;modified=false;identity.textContent=description();dialog.showModal();resize();context.clearRect(0,0,canvas.width,canvas.height);fit(context,target,canvas.width,canvas.height);observer=new ResizeObserver(resize);observer.observe(canvas.parentElement);};
 const point=e=>{const box=canvas.getBoundingClientRect();return {x:(e.clientX-box.left)*canvas.width/box.width,y:(e.clientY-box.top)*canvas.height/box.height};};
 canvas.onpointerdown=e=>{writing=true;canvas.setPointerCapture(e.pointerId);const p=point(e);context.beginPath();context.moveTo(p.x,p.y);context.lineWidth=3;context.lineCap='round';context.strokeStyle='#123c52';};
 canvas.onpointermove=e=>{if(!writing)return;const p=point(e);context.lineTo(p.x,p.y);context.stroke();modified=true;};
 canvas.onpointerup=canvas.onpointercancel=()=>{writing=false;};
 dialog.querySelector('[data-signature-clear]').onclick=()=>{context.clearRect(0,0,canvas.width,canvas.height);modified=true;};
 dialog.querySelector('[data-signature-accept]').onclick=()=>{if(!editable())return dialog.close();if(modified){
  const ctx=target.getContext('2d'),pixels=context.getImageData(0,0,canvas.width,canvas.height).data;let left=canvas.width,top=canvas.height,right=-1,bottom=-1;
  for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)if(pixels[(y*canvas.width+x)*4+3]>32){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
  ctx.clearRect(0,0,target.width,target.height);
  if(right>=left){const width=right-left+1,height=bottom-top+1,scale=Math.min((target.width-16)/width,(target.height-16)/height);ctx.drawImage(canvas,left,top,width,height,(target.width-width*scale)/2,(target.height-height*scale)/2,width*scale,height*scale);}
  changed(right>=left);
 }dialog.close();};
 dialog.querySelector('[data-signature-cancel]').onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>{observer?.disconnect();context.clearRect(0,0,canvas.width,canvas.height);identity.textContent='';writing=false;modified=false;});
 document.addEventListener('marapo24-clear-sensitive',()=>dialog.close());
 return {visible(value){button.hidden=!value;}};
}
