export function pharmacyClass(origin){return origin==='Marienapotheke'?'pharmacy-marien':origin==='Cusanus-Apotheke'?'pharmacy-cusanus':'';}
export function stopClasses(stop){return [pharmacyClass(stop.origin),stop.status==='nicht zugestellt'&&!stop.removed&&!stop.voided?'not-delivered':'',stop.status==='zugestellt'&&!stop.removed&&!stop.voided?'delivered':''].filter(Boolean).join(' ');}
// A display projection only: never change the stored route or historical proof values.
export function officeGroups(stops,finished){
 if(!finished)return [{label:'',stops}];
 const billable=stops.filter(s=>!s.removed&&!s.voided&&(s.cents>0||s.collectedCents>0));
 const origins=[...new Set(['Marienapotheke','Cusanus-Apotheke',...billable.map(s=>s.origin)])];
 const groups=origins.map(label=>({label,stops:billable.filter(s=>s.origin===label).sort((a,b)=>a.name.localeCompare(b.name,'de-DE'))})).filter(g=>g.stops.length);
 const rest=stops.filter(s=>!billable.includes(s));
 if(rest.length)groups.push({label:'Weitere Päckchen und Verlauf',stops:rest});
 return groups;
}
