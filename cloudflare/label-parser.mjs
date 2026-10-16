import {euroCents} from './tour-workflow.mjs';
const unique=values=>[...new Set(values.map(v=>v.trim()).filter(Boolean))];
export function parseLabel(raw){
 if(typeof raw!=='string'||raw.length>16000)throw Error('Erkannter Text ist zu lang. Bitte einen einzelnen Botendienstzettel aufnehmen.');
 const lines=raw.normalize('NFKC').split(/\r?\n/).map(s=>s.trim()).filter(Boolean),text=lines.join('\n'),warnings=[];
 const fields={name:'',street:'',postalCode:'',city:'',phone:'',origin:'',amount:'',paymentReason:''};
 const select=(key,values)=>{const choices=unique(values);if(choices.length===1)fields[key]=choices[0];else if(choices.length>1)warnings.push('Mehrere mögliche Angaben für '+key+' – bitte prüfen.');};
 select('name',lines.flatMap(line=>{const m=line.match(/^(?:Name|Kunde|Empfänger|Patient)(?:\s*\/\s*Name)?\s*:\s*(.{2,90})$/i);return m?[m[1]]:[];}));
 select('street',lines.flatMap(line=>{const m=line.match(/^(?:(?:Straße(?:\s*(?:und|\/)\s*Hausnummer)?|Strasse|Anschrift|Adresse)\s*:\s*)?([\p{L}][\p{L} .'-]{2,80}\s+\d+[a-z]?(?:\s*[-/]\s*\d+[a-z]?)?)$/iu);return m?[m[1]]:[];}));
 const places=unique(lines.flatMap(line=>{const m=line.match(/^(?:(?:PLZ\s*(?:\/|und)\s*Ort|Ort)\s*:\s*)?(\d{5})\s+([\p{L}][\p{L} .()'-]{1,89})$/u);return m?[m[1]+' '+m[2]]:[];}));
 if(places.length===1){fields.postalCode=places[0].slice(0,5);fields.city=places[0].slice(6);}else if(places.length>1)warnings.push('Mehrere Ortsangaben – Empfängeradresse auswählen.');
 select('phone',lines.flatMap(line=>{const m=line.match(/^(?:Telefon|Tel\.?|Mobil|Handy)\s*:?\s*(\+?[0-9][0-9 ()/.-]{5,38})$/i);return m?[m[1]]:[];}));
 const origins=[];if(/Marien\s*-?\s*apotheke/i.test(text))origins.push('Marienapotheke');if(/Cusanus\s*-?\s*apotheke/i.test(text))origins.push('Cusanus-Apotheke');select('origin',origins);
 // Bare "Bar", "EC" or a generic invoice heading never prove prior payment.
 const invoice=/\b(?:faktura|auf\s+rechnung|rechnungskauf)\b/i.test(text);
 const paidBar=/\b(?:bar\s*(?:bezahlt|gezahlt)|(?:bezahlt|gezahlt)\s*:?\s*bar)\b/i.test(text);
 const paidCard=/\b(?:(?:EC|girocard|karte)\s*(?:bezahlt|gezahlt)|(?:bezahlt|gezahlt)\s*:?\s*(?:mit\s+)?(?:EC|girocard|karte))\b/i.test(text);
 const paid=/\bbereits\s+bezahlt\b/i.test(text);
 const negated=/\b(?:nicht|noch\s+nicht|un)\s*(?:bezahlt|gezahlt)\b/i.test(text);
 const reasons=[...(invoice?['Auf Rechnung']:[]),...(paidBar?['Bereits bar bezahlt']:[]),...(paidCard?['Bereits mit EC bezahlt']:[]),...(paid&&!paidBar&&!paidCard?['Bereits bezahlt']:[])];
 if(reasons.length===1&&!negated){fields.amount='0,00';fields.paymentReason=reasons[0];}
 else if(reasons.length>1||negated){warnings.push('Zahlungsstatus widersprüchlich oder nicht eindeutig – Betrag und Zahlungsgrund manuell prüfen.');}
 const amounts=unique(lines.flatMap(line=>{const m=line.match(/^(?:zu\s+kassieren|Nachnahme|offener\s+Betrag|Restbetrag|Betrag)\s*:?\s*(\d{1,4}(?:[.,]\d{1,2})?)\s*(?:€|EUR)?$/i);if(!m)return [];try{return [String(euroCents(m[1]))];}catch{return [];}}));
 if(amounts.length>1)warnings.push('Mehrere Beträge erkannt – bitte prüfen.');
 if(amounts.length===1&&!fields.paymentReason&&!reasons.length&&!negated)fields.amount=(Number(amounts[0])/100).toFixed(2).replace('.',',');
 if(fields.paymentReason&&amounts.some(v=>Number(v)>0)){fields.amount='';fields.paymentReason='';warnings.push('Positiver Betrag neben Rechnung/Bezahlt-Vermerk – bitte manuell klären.');}
 if(!fields.name)warnings.push('Empfängername nicht eindeutig erkannt.');if(!fields.street||!fields.city)warnings.push('Empfängeradresse bitte vervollständigen.');if(!fields.origin)warnings.push('Herkunftsapotheke auswählen.');if(fields.amount==='')warnings.push('Betrag und Zahlungsstatus fehlen oder sind unklar.');
 return {fields,warnings};
}
export function isMobileCameraDevice(navigator){const ua=navigator.userAgent||'';return navigator.userAgentData?.mobile===true||/Android|iPhone|iPad|iPod/i.test(ua)||/Macintosh/i.test(ua)&&navigator.maxTouchPoints>1;}
