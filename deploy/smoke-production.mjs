const baseUrl = process.env.SMOKE_API_URL ?? "http://127.0.0.1:7088/api/v1";
const password = process.env.SEED_DEMO_PASSWORD;

if (!password) {
  throw new Error("SEED_DEMO_PASSWORD is required");
}

const clubId = "66d400000000000000000001";
const sessionId = "66d600000000000000000002";
let accessToken = "";

async function request(step, path, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    signal: AbortSignal.timeout(15_000),
    headers: {
      accept: "application/json",
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      ...init.headers,
    },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const code = payload?.error?.code ?? payload?.message ?? "unknown_error";
    throw new Error(`${step} failed: HTTP ${response.status} (${code})`);
  }
  console.log(`${step}: HTTP ${response.status}`);
  return payload?.data ?? payload;
}

const discovery = await request("discovery", "/discovery");
if (!discovery) throw new Error("discovery returned no data");

const club = await request("club_detail", `/discovery/catalog/clubs/${clubId}`);
if (!club?.id) throw new Error("club detail returned no id");

const sessions = await request(
  "sessions",
  `/public/clubs/${clubId}/reservable-sessions`,
);
const selected = sessions?.items?.find((item) => item.id === sessionId);
if (!selected) throw new Error("seeded reservable session was not found");

const auth = await request("login", "/account/auth/login", {
  method: "POST",
  body: JSON.stringify({ phone: "09120000001", password }),
});
accessToken = auth?.accessToken;
if (!accessToken) throw new Error("login returned no access token");

const reservation = await request("reservation", "/reservations", {
  method: "POST",
  body: JSON.stringify({ sessionId, participantCount: 1 }),
});
if (!reservation?.id) throw new Error("reservation returned no id");

const intent = await request("payment_intent", "/payments/intents", {
  method: "POST",
  body: JSON.stringify({
    referenceType: "reservation",
    referenceId: reservation.id,
    idempotencyKey: `production-smoke-${reservation.id}`,
    returnUrl: "https://gym4me.ir/payment-return",
    walletAmount: 0,
  }),
});
if (!intent?.id) throw new Error("payment intent returned no id");

const payment = await request(
  "payment",
  `/payments/intents/${intent.id}/mock/decision`,
  { method: "POST", body: JSON.stringify({ status: "paid" }) },
);
if (payment?.status !== "paid") throw new Error("payment was not captured");

await request("notifications", "/notifications");

const cancelled = await request(
  "cancellation_refund",
  `/reservations/${reservation.id}/cancel`,
  { method: "PATCH" },
);
if (cancelled?.status !== "cancelled") {
  throw new Error("reservation was not cancelled");
}
if (cancelled?.paymentStatus !== "refunded") {
  throw new Error("paid reservation was not refunded");
}

console.log("production_lifecycle: passed");
