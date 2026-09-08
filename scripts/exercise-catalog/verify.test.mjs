import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { normalizeWger, writeDatabase } from "./model.mjs";

test("offline package verification detects corrupt or missing media", () => {
  const root = mkdtempSync(join(tmpdir(), "club4me-media-test-"));
  mkdirSync(join(root, "media"));
  const license = { id: 1, url: "https://creativecommons.org/licenses/by/4.0/" };
  const exercises = normalizeWger([{ id: 1, uuid: "test", license: 1, license_author: "Test", translations: [{ id: 1, language: 2, name: "Squat", description: "Fixture", license: 1, license_author: "Test" }], images: [{ id: 1, license: 1, license_author: "Test", image: "https://wger.de/media/exercise-images/1/test.jpg" }] }], new Map([[1, license]]), new Map([[2, "en"]]));
  const media = exercises[0].media[0];
  const bytes = Buffer.from("Test fixture bytes, not an actual exercise photo");
  Object.assign(media, { localPath: `media/${"a".repeat(24)}.jpg`, localSizeBytes: bytes.length, localSha256: createHash("sha256").update(bytes).digest("hex") });
  const manifest = { transfer: { downloaded: 1, eligibleFiles: 1, failures: [] } };
  writeFileSync(join(root, media.localPath), bytes);
  writeFileSync(join(root, "catalog.json"), JSON.stringify({ exercises, manifest }));
  writeFileSync(join(root, "backend-import.draft.json"), JSON.stringify([{ id: exercises[0].id, status: "draft", media: [{ path: media.localPath, sha256: media.localSha256 }] }]));
  writeDatabase(join(root, "catalog.sqlite"), exercises, manifest);
  const run = () => spawnSync(process.execPath, [new URL("./verify.mjs", import.meta.url).pathname, root], { encoding: "utf8" });
  const good = run(); assert.equal(good.status, 0, good.stderr); assert.equal(JSON.parse(good.stdout).verified, true);
  writeFileSync(join(root, media.localPath), "Corrupted fixture");
  assert.notEqual(run().status, 0);
});
