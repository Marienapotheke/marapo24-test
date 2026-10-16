import {euroCents} from './tour-workflow.mjs';
const unique=values=>[...new Set(values.map(v=>v.trim()).filter(Boolean))];
function parseGenericLabel(raw){
 if(typeof raw!=='string'||raw.length>16000)throw Error('Erkannter Text ist zu lang. Bitte einen einzelnen Botendienstzettel aufnehmen.');
 const lines=raw.normalize('NFKC').split(/\r?\n/).map(s=>s.trim()).filter(Boolean),text=lines.join('\n'),warnings=[];
 const fields={name:'',street:'',postalCode:'',city:'',phone:'',origin:'',amount:'',paymentReason:''};
 const select=(key,values)=>{const choices=unique(values);if(choices.length===1)fields[key]=choices[0];else if(choices.length>1)warnings.push('Mehrere mögliche Angaben für '+key+' – bitte prüfen.');};
 select('name',lines.flatMap(line=>{const m=line.match(/^(?:Name|Kunde|Empfänger|Patient)(?:\s*\/\s*Name)?\s*:\s*(.{2,90})$/i);return m?[m[1]]:[];}));
 select('street',lines.flatMap(line=>{const m=line.match(/^(?:(?:Straße(?:\s*(?:und|\/)\s*Hausnummer)?|Strasse|Anschrift|Adresse)\s*:\s*)?([\p{L}][\p{L} .'-]{2,80}\s+\d+[a-z]?(?:\s*[-/]\s*\d+[a-z]?)?)$/iu);return m?[m[1]]:[];}));
 const places=unique(lines.flatMap(line=>{const m=line.match(/^(?:(?:PLZ\s*(?:\/|und)\s*Ort|Ort)\s*:\s*)?(\d{5})\s+([\p{L}][\p{L} .()'-]{1,89})$/u);return m?[m[1]+' '+m[2]]:[];}));
 if(places.length===1){fields.postalCode=places[0].slice(0,5);fields.city=places[0].slice(6);}else if(places.length>1)warnings.push('Mehrere Ortsangaben – Empfängeradresse auswählen.');
 select('phone',lines.flatMap(line=>{const m=line.match(/^(?:Telefon|Tel\.?|Mobil|Handy)\s*:?\s*(\+?[0-9][0-9 ()/.-]{2,38})$/i);return m?[m[1]]:[];}));
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
const receiptTitle=/botendienstbe[li1]eg/i;
const moneyFor=(text,label)=>unique([...text.matchAll(new RegExp('\\b(?:'+label+')\\s*[:.]?\\s*(\\d{1,4}(?:[.,]\\d{1,2})?)(?![\\dA-Za-z.,]|\\s*[.,])\\s*(?:€|EUR)?','gi'))].flatMap(match=>{try{return [String(euroCents(match[1]))];}catch{return [];}}));
export function parseLabel(raw){
 if(typeof raw!=='string'||raw.length>16000)throw Error('Erkannter Text ist zu lang. Bitte einen einzelnen Botendienstzettel aufnehmen.');
 const lines=raw.normalize('NFKC').split(/\r?\n/).map(s=>s.trim()).filter(Boolean),title=lines.findIndex(s=>receiptTitle.test(s));
 if(title<0&&!/\bOffen\s*[:.]?\s*\d/i.test(raw)&&!/(?:Bar|Faktura|EC\s*[- ]?\s*Karte)\s*:\s*\d/i.test(raw))return parseGenericLabel(raw);
 const nameIndex=lines.findIndex(s=>/^(?:Frau|Herrn?|Name\s*:|Kunde\s*:|Empfänger\s*:|Patient\s*:)/i.test(s));
 const start=title>=0?title+1:nameIndex>=0?nameIndex:0,body=lines.slice(start),header=lines.slice(0,title>=0?title:nameIndex>=0?nameIndex:lines.length).join('\n');
 const named=body.find(s=>/^(?:Frau|Herrn?)\s+\S/i.test(s)),candidate=named?.replace(/^(?:Frau|Herrn?)\s+/i,'');
 const streetIndex=body.findIndex(s=>/^[\p{L}][\p{L} .'-]{2,80}\s+\d+[a-z]?(?:\s*[-/]\s*\d+[a-z]?)?$/iu.test(s));
 const previous=streetIndex>0?body[streetIndex-1]:'';
 const fallback=title>=0&&/^[\p{L}][\p{L} .,'()-]{1,89}$/u.test(previous)&&!/(?:apotheke|botendienstbe[li1]eg)/i.test(previous)?previous:'';
 const parsed=parseGenericLabel([...(candidate||fallback?['Name: '+(candidate||fallback)]:[]),...body].join('\n'));
 const {fields}=parsed,warnings=parsed.warnings.filter(s=>!/(?:Betrag|Zahlungs|Rechnung\/Bezahlt|Herkunftsapotheke)/.test(s));
 const pharmacies=[];if(/marien\s*-?\s*apotheke/i.test(header)||/\bmarien\b/i.test(header)&&/apotheke/i.test(header))pharmacies.push('Marienapotheke');if(/cusanus\s*-?\s*apotheke/i.test(header))pharmacies.push('Cusanus-Apotheke');fields.origin=pharmacies.length===1?pharmacies[0]:'';
 fields.amount='';fields.paymentReason='';const text=body.join('\n'),open=moneyFor(text,'Offen'),paid=[];
 for(const [label,pattern,reason] of [['Bar','Bar','Bereits bar bezahlt'],['Faktura','Faktura','Auf Rechnung'],['EC Karte','EC\\s*[- ]?\\s*Karte|EC','Bereits mit EC bezahlt']]){const values=moneyFor(text,pattern);if(values.length===1)paid.push({label,cents:Number(values[0]),reason});else if(values.length>1)warnings.push('Mehrere Beträge für '+label+' – bitte mit dem Beleg prüfen.');}
 if(open.length===1){fields.amount=(Number(open[0])/100).toFixed(2).replace('.',',');if(Number(open[0])===0){const positive=paid.filter(p=>p.cents>0);if(positive.length===1)fields.paymentReason=positive[0].reason;else if(positive.length>1){fields.paymentReason='Bereits bezahlt';warnings.push('Mehrere bereits abgewickelte Zahlungsarten – Zahlungsgrund prüfen.');}else warnings.push('Offen ist 0 €, aber die Zahlungsart ist nicht eindeutig. Zahlungsgrund manuell auswählen.');}}
 else warnings.push('Der Wert bei „Offen“ ist nicht eindeutig erkannt. Bar, Faktura und EC ersetzen diesen Restbetrag nicht.');
 if(fields.phone&&!/^(?:0|\+)/.test(fields.phone)&&fields.phone.replace(/\D/g,'').length<7)warnings.push('Kurze Telefonnummer ohne Vorwahl erkannt – vor einem Anruf vervollständigen.');
 if(!fields.origin)warnings.push('Herkunftsapotheke im Logo nicht eindeutig erkannt – bitte auswählen.');
 return {fields,warnings,paymentBreakdown:paid.map(({label,cents})=>({label,cents})),receiptLayout:true};
}
export function labelScore(parsed){return ['name','street','postalCode','city'].reduce((score,key)=>score+(parsed.fields[key]?3:0),0)+(parsed.fields.amount!==''?3:0)+(parsed.fields.origin?2:0)+(parsed.fields.phone?1:0);}
export function isMobileCameraDevice(navigator){const ua=navigator.userAgent||'';return navigator.userAgentData?.mobile===true||/Android|iPhone|iPad|iPod/i.test(ua)||/Macintosh/i.test(ua)&&navigator.maxTouchPoints>1;}
