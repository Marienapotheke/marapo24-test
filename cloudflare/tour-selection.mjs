// Keep the catalog outside the package form when the selected tour has ended.
// The package form is hidden for finished tours and must not hide the next tour.
export function showTourCatalog(tours,selected,effectiveStatus){return tours.length===0||effectiveStatus==='finished'||!tours.some(t=>t.id===selected);}
export function openTourOptions(catalog){return (catalog||[]).filter(t=>!t.status||t.status==='open');}
