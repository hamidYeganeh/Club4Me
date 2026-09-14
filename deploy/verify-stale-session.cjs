// Exercise real HTTP auth routes without creating an account or exposing tokens.
const jwt = require('/app/node_modules/jsonwebtoken');
const { randomUUID } = require('node:crypto');
const { MongoClient, ObjectId } = require('/app/node_modules/mongodb');

async function main() {
  const client = new MongoClient(process.env.MONGODB_URL);
  let id;
  try {
    await client.connect();
    id = new ObjectId();
    if (await client.db().collection('users').findOne({ _id: id })) {
      throw new Error('Expected a nonexistent account');
    }
  } finally {
    await client.close();
  }
  const sign = (tokenUse) => jwt.sign({
    sub: String(id), phone: 'invalid-test-account', roles: [],
    tokenUse, jti: randomUUID(),
  }, process.env.JWT_SECRET, { expiresIn: '60s' });
  const accessToken = sign('access');
  const refreshToken = sign('refresh');
  for (const portal of ['account', 'admin', 'business']) {
    for (const kind of ['me', 'auth/refresh']) {
      const response = await fetch(`http://127.0.0.1:7088/api/v1/${portal}/${kind}`, kind === 'me' ? {
        headers: { Authorization: `Bearer ${accessToken}` },
      } : {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const result = await response.json();
      if (response.status !== 401 || result.error?.code !== 'UNAUTHORIZED') {
        throw new Error(`${portal}/${kind}: expected UNAUTHORIZED/401, got ${response.status}/${result.error?.code}`);
      }
      console.log(`${portal}/${kind}: stale session rejected with 401`);
    }
  }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
