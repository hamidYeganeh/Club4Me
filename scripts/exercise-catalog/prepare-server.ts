import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadVitalCatalog } from "../../apps/backend/src/modules/training/vital-catalog";

const root = resolve(process.argv[2]!);
const { items } = loadVitalCatalog(root);
if(items.length !== 50) throw new Error("Expected exactly 50 Vital entries");
writeFileSync(resolve(root,"server-seed.json"),JSON.stringify(items,null,2),{flag:"wx"});
console.log(`Prepared ${items.length} localized seed records`);
