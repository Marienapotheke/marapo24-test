// Provider results are proposals, never a replacement for a confirmed address.
const clean=(value,max)=>typeof value==='string'&&value.trim().length<=max&&!/[\u0000-\u001f\u007f]/.test(value)?value.trim():'';
export function normalizeHouseNumber(value){
 const number=typeof value==='string'?value.trim().toLowerCase().replace(/(\d)\s+([a-z])(?=$|\s*[-/])/g,'$1$2').replace(/\s*([-\/])\s*/g,'$1'):'';
 return /^\d+[a-z]?(?:[-/]\d+[a-z]?)?$/.test(number)?number:'';
}
export function splitStreetAddress(value){
 const full=String(value||'').trim(),match=full.match(/(?:^|\s)(\d+(?:\s*[a-z])?(?:\s*[-/]\s*\d+(?:\s*[a-z])?)?)$/i);
 return match?{street:full.slice(0,match.index).trim(),number:normalizeHouseNumber(match[1])}:{street:full,number:''};
}
export function addressSuggestions(features,input){
 const {number}=splitStreetAddress(input.street),seen=new Set(),result=[];
 for(const feature of Array.isArray(features)?features.slice(0,5):[]){
  const p=feature?.properties;if(!p||!Number.isFinite(p.lat)||!Number.isFinite(p.lon)||p.lat<47||p.lat>56||p.lon<5||p.lon>16||p.country_code&&p.country_code!=='de')continue;
  const road=clean(p.street,90),postalCode=clean(p.postcode,5),city=[p.city,p.town,p.village,p.municipality,p.suburb].map(v=>clean(v,90)).find(Boolean),rawHouse=clean(p.housenumber,20),house=normalizeHouseNumber(rawHouse);
  if(!road||!/^\d{5}$/.test(postalCode)||!city||rawHouse&&!house)continue;
  // A street-only result retains the user's number for review. It is never
  // cached as a verified building and its number remains explicitly unconfirmed.
  const street=road+((house||number)?' '+(house||number):'');if(street.length>100)continue;
  const key=JSON.stringify([street.toLocaleLowerCase('de-DE'),postalCode,city.toLocaleLowerCase('de-DE'),!!house]);if(seen.has(key))continue;seen.add(key);
  result.push({street,postalCode,city,houseConfirmed:!!house});
 }
 return result;
}
