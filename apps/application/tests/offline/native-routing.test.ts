import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { adaptNativePage } from "../../native/page-adapter";
import {
  matchRoute,
  routePath,
  routeSpecificity,
} from "../../native/route-matcher";

test("all current pages can be bundled without enumerating server data", () => {
  const files = (readdirSync("app", { recursive: true }) as string[])
    .filter((path) => path.endsWith("page.tsx"))
    .map((path) => `app/${path}`);
  assert.ok(files.length > 50);
  for (const file of files) {
    const source = readFileSync(resolve(file), "utf8");
    const compiled = adaptNativePage(source, file);
    assert.doesNotMatch(compiled, /export default async function/);
    assert.doesNotMatch(compiled, /function generateStaticParams/);
  }
});
test("dynamic routes resolve unknown IDs, nested routes and encoded slugs locally", () => {
  assert.deepEqual(
    matchRoute(
      "/athlete/reservations/[reservationId]",
      "/athlete/reservations/brand-new-id/",
    ),
    { reservationId: "brand-new-id" },
  );
  assert.deepEqual(
    matchRoute(
      "/discovery/city/[cityId]/district/[districtId]",
      "/discovery/city/tehran/district/north",
    ),
    { cityId: "tehran", districtId: "north" },
  );
  assert.equal(
    matchRoute("/discovery/clubs/[id]", "/discovery/clubs/one/reviews"),
    null,
  );
  assert.ok(
    routeSpecificity("/discovery/clubs/new") >
      routeSpecificity("/discovery/clubs/[id]"),
  );
  assert.equal(routePath("../app/athlete/page.tsx"), "/athlete");
});
test("new server-only work fails the native build instead of producing a broken screen", () => {
  assert.throws(
    () =>
      adaptNativePage(
        'export default async function Page() { return await fetch("/api"); }',
        "page.tsx",
      ),
    /server-only/,
  );
});
test("client event handlers may perform async work", () => {
  const compiled = adaptNativePage(
    '"use client"; export default function Page() { const submit = async () => await fetch("/api"); return <button onClick={submit} />; }',
    "page.tsx",
  );
  assert.match(compiled, /await fetch/);
});
