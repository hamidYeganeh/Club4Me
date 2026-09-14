/** Run explicitly after creating a PostHog project. Never prints credentials. */
import { readFile } from "node:fs/promises";
const registry = await readFile(
  new URL("../packages/api/src/tracking/events.ts", import.meta.url),
  "utf8",
);
const events = Object.fromEntries(
  [...registry.matchAll(/([A-Z_]+):\s*"([^"]+)"/g)].map((m) => [m[1], m[2]]),
);
const reportEnvironment =
  process.env.POSTHOG_REPORT_ENVIRONMENT || "production";
if (!["production", "development", "test"].includes(reportEnvironment))
  throw new Error(
    "POSTHOG_REPORT_ENVIRONMENT must be production, development or test",
  );
const environmentProperties = [
  {
    key: "environment",
    value: reportEnvironment,
    operator: "exact",
    type: "event",
  },
];
const event = (name, math = "total") => ({
  kind: "EventsNode",
  event: events[name],
  name: events[name],
  math,
});
const trend = (series, extra = {}) => ({
  kind: "TrendsQuery",
  series,
  interval: "day",
  dateRange: { date_from: "-30d" },
  ...extra,
});
const definitions = [
  {
    name: "Club4Me · Product",
    insights: [
      { name: "Active users", query: trend([event("APP_OPENED", "dau")]) },
      {
        name: "Club and class views",
        query: trend([
          event("DISCOVERY_CLUB_VIEWED"),
          event("DISCOVERY_ENTITY_VIEWED"),
        ]),
      },
      {
        name: "Reservation funnel",
        query: {
          kind: "FunnelsQuery",
          series: [
            event("DISCOVERY_CLUB_VIEWED"),
            event("CHECKOUT_STARTED"),
            event("RESERVATION_CREATED"),
            {
              ...event("PAYMENT_SUCCEEDED"),
              properties: [
                {
                  key: "reference_type",
                  value: "reservation",
                  operator: "exact",
                  type: "event",
                },
              ],
            },
          ],
          dateRange: { date_from: "-30d" },
          funnelsFilter: {
            funnelOrderType: "ordered",
            funnelWindowInterval: 30,
            funnelWindowIntervalUnit: "day",
          },
        },
      },
      {
        name: "Weekly reservation retention",
        query: {
          kind: "RetentionQuery",
          dateRange: { date_from: "-90d" },
          retentionFilter: {
            targetEntity: { id: events.RESERVATION_CREATED, type: "events" },
            returningEntity: { id: events.RESERVATION_CREATED, type: "events" },
            period: "Week",
            totalIntervals: 5,
            retentionType: "retention_first_time",
          },
        },
      },
      {
        name: "Searches with no results",
        query: trend([
          {
            ...event("SEARCH_PERFORMED"),
            properties: [
              {
                key: "result_count",
                value: 0,
                operator: "exact",
                type: "event",
              },
            ],
          },
        ]),
      },
      {
        name: "Payments · behavioral counts, not accounting",
        query: trend([
          event("PAYMENT_STARTED"),
          event("PAYMENT_SUCCEEDED"),
          event("PAYMENT_FAILED"),
        ]),
      },
      {
        name: "App versions",
        query: trend([event("APP_OPENED", "dau")], {
          breakdownFilter: {
            breakdown: "app_version",
            breakdown_type: "event",
          },
        }),
      },
    ],
  },
  {
    name: "Club4Me · Clubs (internal)",
    insights: [
      {
        name: "Reservations by club",
        query: trend([event("RESERVATION_CREATED")], {
          breakdownFilter: { breakdown: "club_id", breakdown_type: "event" },
        }),
      },
      {
        name: "Views by club",
        query: trend([event("DISCOVERY_CLUB_VIEWED")], {
          breakdownFilter: { breakdown: "club_id", breakdown_type: "event" },
        }),
      },
      {
        name: "Cancellations by club",
        query: trend([event("RESERVATION_CANCELLED")], {
          breakdownFilter: { breakdown: "club_id", breakdown_type: "event" },
        }),
      },
    ],
  },
];
for (const dashboard of definitions) {
  for (const insight of dashboard.insights) {
    insight.query.properties = environmentProperties;
    insight.query.filterTestAccounts = true;
    insight.query = { kind: "InsightVizNode", source: insight.query };
  }
}
if (process.argv.includes("--dry-run")) {
  console.log(JSON.stringify(definitions, null, 2));
  process.exit(0);
}
const {
  POSTHOG_API_HOST = "https://eu.posthog.com",
  POSTHOG_PROJECT_ID,
  POSTHOG_PERSONAL_API_KEY,
} = process.env;
if (
  !POSTHOG_PROJECT_ID ||
  !/^\d+$/.test(POSTHOG_PROJECT_ID) ||
  !POSTHOG_PERSONAL_API_KEY
)
  throw new Error(
    "Set POSTHOG_PROJECT_ID and POSTHOG_PERSONAL_API_KEY in the local environment",
  );
const origin = new URL(POSTHOG_API_HOST);
if (origin.protocol !== "https:") throw new Error("HTTPS is required");
async function api(path, method = "GET", body) {
  const url = new URL(path, origin);
  if (url.origin !== origin.origin)
    throw new Error("Unexpected pagination origin");
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${POSTHOG_PERSONAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok)
    throw new Error(`PostHog ${method} failed: HTTP ${response.status}`);
  return response.json();
}
const base = `/api/projects/${POSTHOG_PROJECT_ID}`;
async function list(path) {
  const rows = [];
  let next = path;
  while (next) {
    const page = await api(next);
    rows.push(...page.results);
    next = page.next;
  }
  return rows;
}
const dashboards = await list(`${base}/dashboards/?limit=100`);
for (const definition of definitions) {
  let dashboard = dashboards.find(
    (d) => d.name === definition.name && !d.deleted,
  );
  if (!dashboard)
    dashboard = await api(`${base}/dashboards/`, "POST", {
      name: definition.name,
      description:
        "Managed by scripts/setup-posthog.mjs. Internal analytics only; financial truth lives in Club4Me.",
      tags: ["club4me-managed"],
    });
  const existing = await list(
    `${base}/insights/?dashboards=${dashboard.id}&limit=100`,
  );
  for (const insight of definition.insights) {
    const match = existing.find((i) => i.name === insight.name && !i.deleted);
    const payload = {
      ...insight,
      dashboards: [dashboard.id],
      tags: ["club4me-managed"],
    };
    await api(
      `${base}/insights/${match ? `${match.id}/` : ""}`,
      match ? "PATCH" : "POST",
      payload,
    );
  }
  console.log(
    `Ready: ${definition.name} — ${origin.origin}/project/${POSTHOG_PROJECT_ID}/dashboard/${dashboard.id}`,
  );
}
