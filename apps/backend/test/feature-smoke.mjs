import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";

// Uses only the explicitly started fullstack-server temporary database.
const origin = "http://127.0.0.1:7088";
const fixtureResponse = await fetch(`${origin}/__acceptance/fixture`);
assert.equal(fixtureResponse.status, 200);
const fixture = await fixtureResponse.json();
assert.equal(fixture.club.slug, "fullstack-club");
const checks = [];
async function api(role, method, path, body) {
  const response = await fetch(`${origin}/api/v1${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(role ? { Authorization: `Bearer ${fixture[role].accessToken}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const json = await response.json();
  assert.ok(
    response.ok,
    `${method} ${path}: ${response.status} ${JSON.stringify(json)}`,
  );
  return json.data ?? json;
}

for (const path of [
  "/discovery/catalog/clubs",
  "/discovery/catalog/coaches",
  "/discovery/catalog/classes",
  "/discovery/catalog/search?q=باشگاه",
]) {
  await api(null, "GET", path);
  checks.push(`GET ${path}`);
}
const saved = await api("athlete", "POST", "/discovery/saved-searches", {
  title: "جست‌وجوی پذیرش",
  alerts: true,
  filters: { q: "باشگاه" },
});
assert.ok(
  (await api("athlete", "GET", "/discovery/saved-searches")).items.some(
    (item) => item.id === saved.id,
  ),
);
await api("other", "DELETE", `/discovery/saved-searches/${saved.id}`);
assert.ok(
  (await api("athlete", "GET", "/discovery/saved-searches")).items.some(
    (item) => item.id === saved.id,
  ),
);
checks.push("saved search persistence + account isolation");

const habitId = randomUUID();
await api("athlete", "PUT", `/training/habits/${habitId}`, {
  title: "پیاده‌روی پذیرش",
  unit: "دقیقه",
  target: 20,
});
const habits = await api("athlete", "GET", "/training/habits");
await api("athlete", "PUT", `/training/habits/${habitId}/log`, {
  date: habits.today,
  value: 20,
});
assert.deepEqual(
  (await api("athlete", "GET", "/training/habits")).items.find(
    (item) => item.id === habitId,
  ).logs,
  [{ date: habits.today, value: 20, target: 20 }],
);
checks.push("habit create + durable daily log");

await api("owner", "PATCH", `/business/clubs/${fixture.club.id}`, {
  trialBookingEnabled: true,
  trialBookingPrice: 120000,
});
const reservationInput = {
  sessionId: fixture.sessionId,
  participantCount: 1,
  isTrial: true,
  expectedTotalPrice: 120000,
  expectedCurrency: "IRR",
};
assert.equal(
  (await api("athlete", "POST", "/reservations/quote", reservationInput))
    .totalPrice,
  120000,
);
const reservation = await api(
  "athlete",
  "POST",
  "/reservations",
  reservationInput,
);
assert.equal(reservation.totalPrice, 120000);
assert.equal(reservation.paymentStatus, "pending");
async function pay(referenceType, referenceId) {
  const intent = await api("athlete", "POST", "/payments/intents", {
    referenceType,
    referenceId,
    idempotencyKey: randomUUID(),
    returnUrl: "http://127.0.0.1:7081/athlete",
  });
  assert.equal(intent.provider, "mock");
  await api("athlete", "POST", `/payments/intents/${intent.id}/mock/decision`, {
    status: "paid",
  });
}
await pay("reservation", reservation.id);
assert.equal(
  (await api("athlete", "GET", "/reservations")).items.find(
    (item) => item.id === reservation.id,
  ).paymentStatus,
  "paid",
);
checks.push("paid trial quote + reservation + mock settlement");

const purchase = await api(
  "athlete",
  "POST",
  `/athlete/services/${fixture.coachPackageOfferingId}/purchases`,
  { idempotencyKey: randomUUID() },
);
await pay("coach_package_purchase", purchase.id);
const planId = randomBytes(12).toString("hex");
const plan = {
  title: "برنامه پذیرش فیچرها",
  description: "تمرین آزمایشی برای بررسی رابط و ذخیره‌سازی",
  days: [
    {
      id: "day-1",
      title: "تمرین امروز",
      weekday: (new Date(Date.now() + 12600000).getUTCDay() + 1) % 7,
      exercises: [
        {
          exerciseId: "squat",
          sets: 2,
          reps: 10,
          weight: 0,
          restSeconds: 60,
          note: "",
          supersetGroup: "A",
          alternativeExerciseIds: ["goblet-squat"],
        },
        {
          exerciseId: "dumbbell-press",
          sets: 2,
          reps: 10,
          weight: 10,
          restSeconds: 60,
          note: "",
          supersetGroup: "A",
        },
      ],
    },
  ],
};
await api("coach", "PUT", `/training/coach/plans/${planId}`, {
  mutationId: randomUUID(),
  expectedVersion: 0,
  plan,
});
const assignment = (
  await api("coach", "PUT", "/training/coach/assignments", {
    planId,
    version: 1,
    recipient: "athlete",
    recipientId: fixture.athlete.id,
    startsAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    endsAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    mutationId: randomUUID(),
  })
).items[0];
await api("athlete", "PUT", `/training/assignments/${assignment.id}/consent`, {
  accepted: true,
});
const sessionId = randomUUID();
const previous = {
  mutationId: randomUUID(),
  expectedRevision: 0,
  assignmentId: assignment.id,
  dayId: "day-1",
  startedAt: new Date(Date.now() - 86400000).toISOString(),
  finishedAt: new Date(Date.now() - 82800000).toISOString(),
  status: "completed",
  sets: [
    {
      exerciseIndex: 0,
      setIndex: 0,
      reps: 10,
      weight: 8,
      done: true,
      actualExerciseId: "goblet-squat",
    },
  ],
  note: "ثبت پذیرش",
  effort: "balanced",
  followUpRequested: true,
};
const stored = await api(
  "athlete",
  "PUT",
  `/training/sessions/${sessionId}`,
  previous,
);
assert.equal(stored.sets[0].actualExerciseId, "goblet-squat");
assert.equal(stored.snapshot.days[0].exercises[0].exerciseId, "squat");
assert.equal(
  (
    await api(
      "coach",
      "GET",
      `/training/coach/assignments/${assignment.id}/sessions`,
    )
  ).items.length,
  1,
);
checks.push(
  "coach purchase + versioned plan + consent + alternative exercise + shared history",
);
await api(
  "owner",
  "PATCH",
  `/business/clubs/${fixture.club.id}/operations/classes/${fixture.clubClassId}`,
  { model: "open", title: "بازی آزاد پذیرش" },
);
const openGames = await api(
  null,
  "GET",
  "/discovery/business-classes?classModel=open",
);
assert.ok(
  openGames.items.some(
    (item) => item.id === fixture.clubClassId && item.model === "open",
  ),
);
assert.ok(
  !(
    await api(null, "GET", "/discovery/business-classes?classModel=group")
  ).items.some((item) => item.id === fixture.clubClassId),
);
const enrollment = await api(
  "athlete",
  "POST",
  `/athlete/club-classes/${fixture.clubClassId}/enroll`,
);
await pay("business_class_enrollment", enrollment.id);
assert.equal(
  (await api("athlete", "GET", "/athlete/club-classes")).items.find(
    (item) => item.id === enrollment.id,
  ).paymentStatus,
  "paid",
);
checks.push("open play filtering + individual enrollment + mock payment");
console.log(
  JSON.stringify(
    {
      passed: checks,
      reservationId: reservation.id,
      assignmentId: assignment.id,
      planId,
      clubId: fixture.club.id,
      classId: fixture.clubClassId,
    },
    null,
    2,
  ),
);
