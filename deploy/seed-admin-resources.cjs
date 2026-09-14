// Run inside the backend container. Dry-run inventory unless --apply is given.
// Uses the application's idempotent seed: preserves records and fills missing fields.
require('/app/node_modules/reflect-metadata');
const mongoose = require('/app/node_modules/mongoose');
const { ResourcesService } = require('/app/dist/modules/resources/resources.service');
const { serverResourceDefinitions } = require('/app/dist/modules/resources/resources.registry');
const { resourceSeedData } = require('/app/dist/modules/resources/resources.seed-data');

async function main() {
  await mongoose.connect(process.env.MONGODB_URL, { autoIndex: false });
  try {
    const connection = mongoose.connection;
    const before = [];
    for (const definition of serverResourceDefinitions) {
      before.push({
        collection: definition.collection,
        stored: await connection.collection(definition.collection).countDocuments(),
        seed: (resourceSeedData[definition.key] ?? []).length,
      });
    }
    console.log(JSON.stringify({ mode: process.argv.includes('--apply') ? 'apply' : 'preflight', resources: before }));
    if (process.argv.includes('--apply')) {
      const service = new ResourcesService(connection);
      console.log(JSON.stringify({ result: await service.seedAll() }));
      const verification = await service.seedAll();
      if (verification.created !== 0) throw new Error('Seed was not idempotent');
      console.log(JSON.stringify({ verified: true, secondRunCreated: verification.created }));
    }
    console.log(JSON.stringify({
      activeAdmins: await connection.collection('users').countDocuments({ roles: 'admin', status: 'active' }),
      activeOwners: await connection.collection('users').countDocuments({ roles: 'owner', status: 'active' }),
    }));
  } finally {
    await mongoose.disconnect();
  }
}
main().catch((error) => {
  console.error(error.name, String(error.message).replace(/mongodb(?:\+srv)?:\/\/[^\s]+/g, '[redacted]'));
  process.exitCode = 1;
});
