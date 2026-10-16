import {test} from 'node:test';import assert from 'node:assert/strict';import {parseLabel,labelScore} from './label-parser.mjs';
const head='MARIEN m APOTHEKE\nApotheker Fiktiv Beispiel\nApothekenweg 99 - 99999 Apothekenstadt\nTel.: 01234 999999\nBotendienstbeleg\nA000000000\nC0-K0 12:34:56 16.10.2026\n';
const recipient='Frau Erika Muster\nMusterweg 12\n54321 Musterstadt\nTel.: 3733\n';
test('receipt parser ignores logo contact, heading, barcode and IDs; recipient needs no Name label',()=>{
 const parsed=parseLabel(head+recipient+'Bar: 0,00\nOffen: 5,00');assert.deepEqual(parsed.fields,{name:'Erika Muster',street:'Musterweg 12',postalCode:'54321',city:'Musterstadt',phone:'3733',origin:'Marienapotheke',amount:'5,00',paymentReason:''});assert.ok(parsed.warnings.some(s=>s.includes('Vorwahl')));assert.equal(parsed.receiptLayout,true);assert.equal(labelScore(parsed),18);
});
test('only Offen is due to the driver; positive pharmacy payments determine zero-payment reason, never driver cash',()=>{
 for(const [label,reason] of [['Bar','Bereits bar bezahlt'],['Faktura','Auf Rechnung'],['EC Karte','Bereits mit EC bezahlt']]){
  const paid=parseLabel(head+recipient+label+': 5,00 EUR\nOffen: 0,00');assert.equal(paid.fields.amount,'0,00');assert.equal(paid.fields.paymentReason,reason);assert.equal(paid.paymentBreakdown.find(p=>p.label===label).cents,500);
  const partial=parseLabel(head+recipient+label+': 5,00\nOffen: 7,50');assert.equal(partial.fields.amount,'7,50');assert.equal(partial.fields.paymentReason,'');
 }
 assert.equal(parseLabel(head+recipient+'Bar: 0,00\nOffen: 0,00').fields.paymentReason,'');
});
test('missing, conflicting or damaged Offen stays manual; another logo and split lines remain isolated from pharmacy address',()=>{
 for(const tail of ['Bar: 5,00','Offen: 0,00\nOffen: 5,00','Offen: 5,OO','Offen: 5 ,50'])assert.equal(parseLabel(head+recipient+tail).fields.amount,'');
 const changed=parseLabel(head.replace('MARIEN m APOTHEKE','Cusanus-Apotheke')+recipient.replace('Frau Erika Muster','Herr\nTheo Beispiel')+'EC Karte: 5,00 Offen: 0,00');assert.equal(changed.fields.name,'Theo Beispiel');assert.equal(changed.fields.origin,'Cusanus-Apotheke');assert.equal(changed.fields.street,'Musterweg 12');
});
test('portrait camera layout tolerates the stylized MARIN logo and no customer telephone without copying pharmacy contact',()=>{const raw=head.replace('MARIEN m APOTHEKE','MARIN. | I APOTHEKE').replace('Tel.: 01234 999999','Tel. (01234) 999999 · Fax 999998')+recipient.replace('Tel.: 3733\n','')+'Bar:                 0,00\nOffen: 12,50';const parsed=parseLabel(raw);assert.equal(parsed.fields.name,'Erika Muster');assert.equal(parsed.fields.street,'Musterweg 12');assert.equal(parsed.fields.postalCode,'54321');assert.equal(parsed.fields.city,'Musterstadt');assert.equal(parsed.fields.origin,'Marienapotheke');assert.equal(parsed.fields.phone,'');assert.equal(parsed.fields.amount,'12,50');assert.equal(parsed.fields.paymentReason,'');});
