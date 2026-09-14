const { MongoClient } = require('/app/node_modules/mongodb');
async function main() {
  const client = await MongoClient.connect(process.env.MONGODB_URL);
  try {
    const db = client.db(process.env.SEED_DATABASE || 'gym4me');
    const batch = 'scenarios-2026-09-13-v2';
    const slots = await db.collection('reservable_sessions').find({ seedBatch: batch }).toArray();
    const bookings = await db.collection('session_reservations').find({ seedBatch: batch }).toArray();
    const clubs = await db.collection('clubs').find({ seedBatch: batch }).toArray();
    const now = new Date();
    const available = slots.filter(s => s.status === 'active' && s.startsAt > now && s.reservedCount < s.capacity);
    if (slots.length !== 290 || available.length !== 269) throw Error('Unexpected future slot coverage');
    for (const slot of slots) {
      const count = bookings.filter(b => String(b.sessionId) === String(slot._id) && b.status === 'reserved').reduce((n,b) => n+b.participantCount,0);
      if (slot.reservedCount !== count || count > slot.capacity || slot.endsAt <= slot.startsAt) throw Error('Slot occupancy mismatch');
      const club = clubs.find(c=>String(c._id)===String(slot.clubId));
      if (!club) throw Error('Missing slot club');
      const format = new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Tehran',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
      const day = new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Tehran',weekday:'short'}).format(slot.startsAt);
      const hours = club.weeklyHours.find(h=>h.dayOfWeek===['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(day));
      if (!hours || hours.isClosed || !hours.periods.some(p=>p.opensAt<=format.format(slot.startsAt) && p.closesAt>=format.format(slot.endsAt))) throw Error('Slot outside opening hours');
    }
    const counts = {};
    for (const collection of ['users','clubs','coaches','classes','business_training_classes','benefit_products']) {
      counts[collection] = await db.collection(collection).countDocuments({ seedBatch: batch });
    }
    const oldest = available.map(s=>s.startsAt).sort((a,b)=>a-b)[0];
    const latest = available.map(s=>s.startsAt).sort((a,b)=>b-a)[0];
    const report = { counts, slots: slots.length, available: available.length,
      full: slots.filter(s=>s.status === 'active' && s.reservedCount === s.capacity).length,
      cancelled: slots.filter(s=>s.status === 'cancelled').length,
      completed: slots.filter(s=>s.status === 'completed').length,
      firstAvailable: oldest, lastAvailable: latest };
    console.log(JSON.stringify(report, null, 2));
  } finally { await client.close(); }
}
main().catch(e=>{console.error(e.message);process.exitCode=1});
