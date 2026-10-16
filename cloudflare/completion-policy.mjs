import policy from '../functions/policy.cjs';
import {needsSignature} from './tour-workflow.mjs';
// Separate workflow policy leaves the earlier Firebase/v3 completion contract unchanged.
export function validateCompletion(input,uid,tour,stop,signature){
 policy.authorize(uid,{role:'driver',active:true},'driver');policy.identifiers(input);
 if(tour.driverId!==uid)policy.reject('permission-denied','Tour nicht zugewiesen.');
 if(tour.schemaVersion!==2||stop.schemaVersion!==2||'signature' in stop)policy.reject('failed-precondition','Lieferdaten prüfen.');
 if(stop.status!=='offen')policy.reject('already-exists','Lieferung bereits abgeschlossen.');
 if(needsSignature(stop.type,input.status,input.deliveryMethod??'recipient')){
  if(typeof signature!=='string'||signature.length>180000||!/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(signature))policy.reject('invalid-argument','Gültige Unterschrift erforderlich.');
 }else if(signature!=null)policy.reject('invalid-argument','Unterschrift bei dieser Übergabe nicht erlaubt.');
}
