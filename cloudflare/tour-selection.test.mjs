import {test} from 'node:test';import assert from 'node:assert/strict';import {showTourCatalog,openTourOptions} from './tour-selection.mjs';
test('catalog opens after the selected tour ends even when the driver owns other tours',()=>{
 const tours=[{id:'ended',status:'finished'},{id:'next',status:'open'}];assert.equal(showTourCatalog(tours,'ended','finished'),true);assert.equal(showTourCatalog(tours,'next','open'),false);assert.equal(showTourCatalog([],'',undefined),true);assert.equal(showTourCatalog(tours,'stale',undefined),true);
});
test('only open catalog tours appear; cached older catalog records remain usable',()=>{
 const catalog=[{id:'available',status:'open'},{id:'finished',status:'finished'},{id:'running',status:'running'},{id:'old-cache'}];assert.deepEqual(openTourOptions(catalog).map(t=>t.id),['available','old-cache']);assert.deepEqual(openTourOptions(null),[]);
});
