export const normalizeSearch=value=>String(value||'').normalize('NFKC').trim().toLocaleLowerCase('de-DE');
export function matchingStops(stops,query){const needle=normalizeSearch(query);return needle?stops.filter(s=>normalizeSearch(s.name).includes(needle)||normalizeSearch(s.secondName).includes(needle)):stops;}
