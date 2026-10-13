// Read-only preparation: no destructive execution before the operating policy is approved.
export function retentionCutoff(now=new Date()){
 if(!Number.isFinite(+now))throw Error('Invalid retention clock.');
 return new Date(+now-365*86400000).toISOString();
}
export function retentionQueries(now=new Date()){
 const cutoff=retentionCutoff(now);
 return {cutoff,queries:[
  ['proofs',"SELECT count(*) AS n FROM proofs WHERE json_extract(data,'$.completedAt') < ?"],
  ['stops',"SELECT count(*) AS n FROM stops s LEFT JOIN proofs p ON p.id=s.proof_id WHERE s.created_at < ? AND (p.id IS NULL OR json_extract(p.data,'$.completedAt') < ?)"],
  ['customers',"SELECT count(*) AS n FROM customers WHERE last_delivered_at < ?"],
  ['addressLocations',"SELECT count(*) AS n FROM address_locations WHERE updated_at < ?"]
 ]};
}
export async function previewRetention(db,now=new Date()){
 const {cutoff,queries}=retentionQueries(now),counts={};
 for(const [name,sql] of queries){const parameters=Array((sql.match(/\?/g)||[]).length).fill(cutoff);counts[name]=(await db.prepare(sql).bind(...parameters).first()).n;}
 return {mode:'preview-only',maximumDays:365,cutoff,counts,deleted:0,requiresApprovedDeletionProcedure:true};
}
