import assert from 'node:assert/strict';
const base = process.env.SMOKE_API_URL || 'https://api.gym4me.ir/api/v1';
async function get(path) {
  const r = await fetch(base + path, {signal: AbortSignal.timeout(20000)});
  assert.equal(r.status, 200, path);
  const payload = await r.json();
  return payload.data ?? payload;
}
for (const kind of ['clubs','coaches','classes','articles']) {
  const data = await get(`/discovery/catalog/${kind}?page=1&limit=20`);
  assert.ok(data.items?.length, `${kind} has public content`);
  console.log(`${kind}: ${data.items.length} visible records`);
}
const club = await get('/discovery/catalog/clubs/scenario-gym');
assert.equal(club.id, 'e37e3a0fec2ee4cbe9a0f1b4');
const slots = await get(`/public/clubs/${club.id}/reservable-sessions`);
assert.equal(slots.items.length, 27);
const packages = await get(`/public/clubs/${club.id}/benefit-products`);
assert.equal(packages.items.length, 2);
await get('/discovery/catalog/coaches/scenario-coach-1');
await get('/discovery/catalog/classes/scenario-class-1');
await get('/discovery');
console.log('Public discovery, club slots, packages, coach and class details passed.');
