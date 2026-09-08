import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { rights, normalizeWger, normalizeFree, summarize, writeDatabase } from "./model.mjs";
const cc = { id: 2, url: "https://creativecommons.org/licenses/by-sa/4.0/deed.en" };
const licenses = new Map([[2, cc]]);
function sample() {
  return { id: 12, uuid: "sample", license: { id: 2 }, license_author: "Exercise author", translations: [{ id: 100, name: "Squat", language: 2, description: "<p>Controlled <b>movement</b></p>", license: 2, license_author: "Text author", license_author_url: "https://example.com/author", license_title: "Squat guide" }], images: [{ id: 1, license: 2, license_author: "", image: "https://wger.de/media/exercise-images/12/a.png" }], videos: [{ id: 2, license: 2, license_author: "Video author", video: "https://wger.de/media/exercise-video/12/a.MOV", size: 1234 }] };
}
test("only explicitly recognized commercial-compatible licenses pass the first gate", () => {
  assert.equal(rights(cc, ["author"]), "license_eligible");
  assert.equal(rights(cc, []), "attribution_missing");
  assert.equal(rights(cc, ["author"], true), "ai_media_review");
  assert.equal(rights({ url: "https://creativecommons.org/licenses/by-nc/4.0/" }, ["author"]), "license_review");
  assert.equal(rights({ url: "https://creativecommons.org.fake.test/licenses/by/4.0/" }, ["author"]), "license_review");
  assert.equal(rights(undefined, ["author"]), "license_review");
  assert.equal(rights({ url: "http://creativecommons.org/publicdomain/zero/1.0/" }, []), "license_eligible");
});
test("asset attribution is independent, never inherited from the exercise author", () => {
  const e = normalizeWger([sample()], licenses, new Map([[2, "en"]]))[0];
  assert.equal(e.media[0].rightsStatus, "attribution_missing");
  assert.equal(e.media[1].rightsStatus, "license_eligible");
  assert.equal(e.translations[0].authorUrl, "https://example.com/author");
  assert.equal(e.translations[0].description, "Controlled movement");
  assert.equal(e.reviewStatus, "unreviewed");
});
test("external media is flagged; AI images are not silently approved", () => {
  const x = sample(); x.images[0].image = "https://other.test/image.jpg";
  let e = normalizeWger([x], licenses, new Map())[0]; assert.equal(e.media[0].rightsStatus, "url_review");
  x.images[0].image = "https://wger.de/media/exercise-images/12/a.png"; x.images[0].is_ai_generated = true;
  e = normalizeWger([x], licenses, new Map())[0]; assert.equal(e.media[0].rightsStatus, "ai_media_review");
});
test("free-exercise-db revision is pinned; media stays quarantined and names do not merge sources", () => {
  const raw = [{ id: "squat", name: "Squat", instructions: ["Example"], images: ["squat/0.jpg"] }];
  const a = normalizeFree(raw, "a".repeat(40)), b = normalizeFree(raw, "b".repeat(40));
  assert.equal(a[0].id, b[0].id);
  assert.ok(a[0].sourceUrl.includes("a".repeat(40)));
  assert.equal(a[0].media[0].rightsStatus, "image_provenance_review");
  assert.equal(summarize([...a, ...normalizeWger([sample()], licenses, new Map([[2, "en"]]))]).possibleDuplicateNames.length, 1);
});
test("SQLite is searchable, relational, attributed and refuses to overwrite an existing database", () => {
  const path = join(mkdtempSync(join(tmpdir(), "club4me-catalog-test-")), "catalog.sqlite");
  const items = normalizeWger([sample()], licenses, new Map([[2, "en"]]));
  writeDatabase(path, items, { test: true });
  const db = new DatabaseSync(path, { readOnly: true });
  assert.equal(db.prepare("select count(*) as n from exercises").get().n, 1);
  assert.equal(db.prepare("select count(*) as n from exercise_search where exercise_search match ?").get("squat").n, 1);
  assert.equal(db.prepare("select count(*) as n from license_eligible_media").get().n, 1);
  assert.equal(db.prepare("PRAGMA integrity_check").get().integrity_check, "ok");
  db.close();
  assert.throws(() => writeDatabase(path, items, {}), /EEXIST/);
});
