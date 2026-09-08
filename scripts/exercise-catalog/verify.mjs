#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, join } from "node:path";
import { DatabaseSync } from "node:sqlite";

// Deliberately offline: checks the actual files, not upstream availability.
if (!process.argv[2]) throw new Error("Usage: node scripts/exercise-catalog/verify.mjs <selfhost-directory>");
const root = resolve(process.argv[2]);
const { exercises, manifest } = JSON.parse(await readFile(join(root, "catalog.json"), "utf8"));
const local = exercises.flatMap(e => e.media).filter(m => m.localPath);
const byPath = new Map(local.map(m => [m.localPath, m]));
let bytes = 0;
for (const m of local) {
  assert.match(m.localPath, /^media\/[a-f0-9]{24}\.(jpg|jpeg|jfif|avif|png|webp|gif|mov|mp4)$/);
  assert.equal(m.rightsStatus, "license_eligible");
  const hash = createHash("sha256"); let size = 0;
  for await (const chunk of createReadStream(join(root, m.localPath))) { hash.update(chunk); size += chunk.length; }
  assert.equal(hash.digest("hex"), m.localSha256, m.id);
  assert.equal(size, m.localSizeBytes, m.id); bytes += size;
}
assert.equal(local.length, manifest.transfer.downloaded);
assert.equal(local.length, manifest.transfer.eligibleFiles, "Incomplete media package");
assert.deepEqual(manifest.transfer.failures, []);
const draft = JSON.parse(await readFile(join(root, "backend-import.draft.json"), "utf8"));
for (const e of draft) {
  assert.equal(e.status, "draft");
  for (const m of e.media) {
    assert.ok(byPath.has(m.path), `Missing local media for ${e.id}`);
    assert.equal(m.sha256, byPath.get(m.path).localSha256);
  }
}
const db = new DatabaseSync(join(root, "catalog.sqlite"), { readOnly: true });
try {
  assert.equal(db.prepare("PRAGMA integrity_check").get().integrity_check, "ok");
  assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM exercises").get().n, exercises.length);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM media WHERE local_path IS NOT NULL").get().n, local.length);
  assert.ok(db.prepare("SELECT COUNT(*) AS n FROM exercise_search WHERE exercise_search MATCH 'squat'").get().n > 0);
} finally { db.close(); }
console.log(JSON.stringify({ verified: true, exercises: exercises.length, draftExercises: draft.length, images: local.filter(m => m.kind === "image").length, videos: local.filter(m => m.kind === "video").length, bytes }, null, 2));
