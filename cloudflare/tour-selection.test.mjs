import {test} from 'node:test';import assert from 'node:assert/strict';import {showTourCatalog,openTourOptions,chooseDriverTour,canEnterPackage,canAddPackage} from './tour-selection.mjs';
test('catalog opens after the selected tour ends even when the driver owns other tours',()=>{
 const tours=[{id:'ended',status:'finished'},{id:'next',status:'open'}];assert.equal(showTourCatalog(tours,'ended','finished'),true);assert.equal(showTourCatalog(tours,'next','open'),false);assert.equal(showTourCatalog([],'',undefined),true);assert.equal(showTourCatalog(tours,'stale',undefined),true);
});
test('only open catalog tours appear; cached older catalog records remain usable',()=>{
 const catalog=[{id:'available',status:'open'},{id:'finished',status:'finished'},{id:'running',status:'running'},{id:'old-cache'}];assert.deepEqual(openTourOptions(catalog).map(t=>t.id),['available','old-cache']);assert.deepEqual(openTourOptions(null),[]);
});

test('resume prefers current work over an older tour and preserves an explicitly selected assigned tour',()=>{
 const tours=[{id:'old',date:'2026-10-26',status:'running'},{id:'ended',date:'2026-11-02',status:'finished'},{id:'today',date:'2026-11-02',status:'open'}];
 assert.equal(chooseDriverTour(tours,'','2026-11-02'),'today');
 assert.equal(chooseDriverTour(tours,'foreign','2026-11-02'),'today');
 assert.equal(chooseDriverTour(tours,'old','2026-11-02'),'old');
 tours.push({id:'active',date:'2026-11-02',status:'running'});assert.equal(chooseDriverTour(tours,'','2026-11-02'),'active');
 assert.equal(chooseDriverTour([],'old','2026-11-02'),'');
});
test('new driver entries require a current-day active tour; past records remain available for permitted existing corrections',()=>{
 const old={date:'2026-10-26',status:'running'},today={date:'2026-11-02',status:'open'};
 assert.equal(canEnterPackage(old,'driver'),true);assert.equal(canAddPackage(old,'driver','2026-11-02'),false);
 assert.equal(canAddPackage(today,'driver','2026-11-02'),true);assert.equal(canAddPackage(today,'driver','2026-11-02','finished'),false);
 assert.equal(canAddPackage({...today,status:'finished'},'driver','2026-11-02'),false);
 assert.equal(canAddPackage({...today,date:'2026-11-03'},'office','2026-11-02'),true);
 assert.equal(canEnterPackage({...today,status:'running'},'office'),false);assert.equal(canAddPackage(undefined,'driver','2026-11-02'),false);
});
