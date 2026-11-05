// Keep the catalog outside the package form when the selected tour has ended.
// The package form is hidden for finished tours and must not hide the next tour.
export function showTourCatalog(tours,selected,effectiveStatus){return tours.length===0||effectiveStatus==='finished'||!tours.some(t=>t.id===selected);}
export function openTourOptions(catalog){return (catalog||[]).filter(t=>!t.status||t.status==='open');}

// Restore a deliberate choice; otherwise prefer work in progress over an old,
// empty tour. Never use a remembered ID belonging to another signed-in account.
export function chooseDriverTour(tours,preferred,date){
 if(tours.some(t=>t.id===preferred))return preferred;
 const newest=items=>[...items].sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(b.createdAt||'').localeCompare(String(a.createdAt||'')))[0]?.id;
 return newest(tours.filter(t=>t.date===date&&t.status==='running'))||newest(tours.filter(t=>t.date===date&&t.status==='open'))||newest(tours.filter(t=>t.status==='running'))||newest(tours.filter(t=>t.status==='open'))||newest(tours)||'';
}
export function canEnterPackage(tour,view,effectiveStatus=tour?.status){return !!tour&&(view==='office'?tour.status==='open':['open','running'].includes(effectiveStatus));}
export function canAddPackage(tour,view,date,effectiveStatus=tour?.status){return canEnterPackage(tour,view,effectiveStatus)&&(view==='office'||tour.date===date);}
