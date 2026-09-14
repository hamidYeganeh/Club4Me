// Run in a one-off backend container. Prepare first; replace only after a verified backup.
const mongoose = require('/app/node_modules/mongoose');
const { spawnSync } = require('node:child_process');
const { ResourcesService } = require('/app/dist/modules/resources/resources.service');
const { DEFAULT_DISCOVERY_SECTIONS } = require('/app/dist/modules/discovery/discovery-section.defaults');
const STAGING = 'gym4me_seed_20260913';
const TARGET = 'gym4me';
async function main() {
  const connection = await mongoose.createConnection(process.env.MONGODB_URL, { dbName: STAGING }).asPromise();
  const client = connection.getClient();
  try {
    const source = client.db(STAGING);
    if (process.argv.includes('--prepare')) {
      if (process.argv.includes('--refresh-prepared')) {
        const previous = await source.collection('scenario_seed_runs').findOne({ _id: 'scenarios-2026-09-13-v2' });
        if (!previous) throw Error('Only this release’s prepared database may be refreshed');
        await source.dropDatabase();
      }
      if ((await source.listCollections().toArray()).length) throw Error('Staging database already exists; inspect it before retrying');
      const resources = await new ResourcesService(connection).seedAll();
      console.log(JSON.stringify({ resourcesCreated: resources.created }));
      const now = new Date();
      await source.collection('discovery_sections').insertMany(DEFAULT_DISCOVERY_SECTIONS.map(s => ({ ...s, createdAt: now, updatedAt: now })));
      const result = spawnSync(process.execPath, ['/tmp/seed-scenarios.cjs', '--apply'], {
        env: { ...process.env, SEED_DATABASE: STAGING }, stdio: 'inherit',
      });
      if (result.status !== 0) throw Error('Scenario preparation failed');
    } else if (process.argv.includes('--replace-all') || process.argv.includes('--rehearse')) {
      const rehearsal = process.argv.includes('--rehearse');
      if (!rehearsal && process.env.CONFIRM_RESET_DATABASE !== TARGET) throw Error('Explicit target confirmation required');
      const manifest = await source.collection('scenario_seed_runs').findOne({ _id: 'scenarios-2026-09-13-v2' });
      if (!manifest) throw Error('Validated staging manifest missing');
      const target = client.db(rehearsal ? 'gym4me_reset_rehearsal_20260913' : TARGET);
      if (rehearsal) {
        if ((await target.listCollections().toArray()).length) throw Error('Rehearsal database already exists');
        const live = client.db(TARGET);
        for (const item of await live.listCollections().toArray()) {
          if (item.type !== 'collection' || item.name.startsWith('system.')) continue;
          await target.createCollection(item.name);
          const records = await live.collection(item.name).find().toArray();
          if (records.length) await target.collection(item.name).insertMany(records);
          for (const index of await live.collection(item.name).listIndexes().toArray()) {
            if (index.name === '_id_') continue;
            const { key, v, ns, ...options } = index;
            await target.collection(item.name).createIndex(key, options);
          }
        }
      }
      const names = new Set((await target.listCollections().toArray()).filter(c => c.type === 'collection' && !c.name.startsWith('system.')).map(c => c.name));
      const staged = {};
      for (const item of await source.listCollections().toArray()) {
        if (item.type !== 'collection' || item.name.startsWith('system.')) continue;
        staged[item.name] = await source.collection(item.name).find().toArray();
        if (!names.has(item.name)) await target.createCollection(item.name);
        names.add(item.name);
      }
      const session = client.startSession();
      try {
        await session.withTransaction(async () => {
          for (const name of names) {
            await target.collection(name).deleteMany({}, { session });
            if (staged[name]?.length) await target.collection(name).insertMany(staged[name], { session });
          }
        });
      } finally { await session.endSession(); }
      const counts = {};
      for (const name of names) {
        counts[name] = await target.collection(name).countDocuments();
        if (counts[name] !== (staged[name]?.length || 0)) throw Error(`Count mismatch: ${name}`);
      }
      console.log(JSON.stringify({ database: target.databaseName, replaced: true, counts }, null, 2));
      if (rehearsal) await target.dropDatabase();
    } else throw Error('Use --prepare or --replace-all');
  } finally { await connection.close(); }
}
main().catch(e => { console.error(e.message); process.exitCode = 1; });
