// Run inside the existing backend container. Defaults to a read-only preflight.
// The only write operation uses $setOnInsert against stable namespaced _ids.
const { MongoClient } = require("/app/node_modules/mongodb");
const { readFileSync, statSync } = require("node:fs");
const { resolve } = require("node:path");
const { createHash } = require("node:crypto");
async function main() {
  const root=resolve(process.argv[2]);
  const {exercises}=JSON.parse(readFileSync(resolve(root,"catalog.json")));
  const localized=JSON.parse(readFileSync(resolve(root,"server-seed.json")));
  if(exercises.length!==50 || localized.length!==50) throw Error("Expected 50 records");
  const names=new Map(localized.map(e=>[e.id,e]));
  const records=exercises.map(e=>{
    if(!/^vital:00(5[1-9]|[6-9][0-9])$|^vital:0100$/.test(e.id) || e.id!==`vital:${e.sourceId}` || !names.has(e.id)) throw Error("Invalid source id");
    const m=e.media[0];
    if(m.localPath!==`media/${e.sourceId}.mp4`) throw Error("Invalid media path");
    const file=resolve(root,m.localPath);
    if(statSync(file).size!==m.localSizeBytes || createHash("sha256").update(readFileSync(file)).digest("hex")!==m.localSha256) throw Error(`Checksum mismatch: ${e.id}`);
    return {...names.get(e.id),_id:e.id,source:"vital-free",sourceId:e.sourceId,status:"draft",reviewStatus:"unreviewed",media:{path:file,relativePath:m.localPath,sha256:m.localSha256,bytes:m.localSizeBytes,mimeType:"video/mp4",visibility:"private"},license:e.license,sourceRecord:e.originalRecord,createdAt:new Date(),seedVersion:"vital-free50-v1"};
  });
  if(new Set(records.map(e=>e._id)).size!==50) throw Error("Duplicate ids");
  const client=new MongoClient(process.env.MONGODB_URL);
  try {
    await client.connect();const db=client.db(),collection=db.collection("training_exercises");
    const ids=records.map(e=>e._id);
    const existing=await collection.find({_id:{$in:ids}},{projection:{_id:1,source:1,"media.sha256":1}}).toArray();
    for(const e of existing) if(e.source!=="vital-free"||e.media?.sha256!==records.find(r=>r._id===e._id).media.sha256) throw Error(`Existing record conflict: ${e._id}`);
    let inserted=0;
    if(process.argv.includes("--apply")) {
      const result=await collection.bulkWrite(records.map(e=>({updateOne:{filter:{_id:e._id},update:{$setOnInsert:e},upsert:true}})),{ordered:true});
      inserted=result.upsertedCount;
    }
    const stored=await collection.countDocuments({_id:{$in:ids}});
    console.log(JSON.stringify({mode:process.argv.includes("--apply")?"apply":"preflight",database:db.databaseName,collection:"training_exercises",verifiedFiles:50,existing:existing.length,inserted,stored},null,2));
    if(process.argv.includes("--apply")&&stored!==50) throw Error("Seed count verification failed");
  } finally {await client.close()}
}
main().catch(e=>{console.error(e.name, e.message.replace(/mongodb(?:\+srv)?:\/\/[^\s]+/g,"[redacted]"));process.exitCode=1});
