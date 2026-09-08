#!/usr/bin/env node
import { readFile, mkdir, writeFile, open, rename, unlink, copyFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { resolve, join, extname } from "node:path";
import { createHash } from "node:crypto";
import { summarize, writeDatabase } from "./model.mjs";

// Offline preparation only. Nothing in the running app imports this script.
const input = process.argv[2];
if (!input) throw new Error("Usage: node scripts/exercise-catalog/download-media.mjs <run-directory> [--videos]");
const includeVideos = process.argv.includes("--videos");
const run = resolve(input);
const reuseIndex = process.argv.indexOf("--reuse");
const reuseRoot = reuseIndex < 0 ? null : resolve(process.argv[reuseIndex + 1] ?? "");
const reused = reuseRoot ? JSON.parse(await readFile(join(reuseRoot, "catalog.json"), "utf8")) : null;
if (reused?.manifest.transfer.failures.some(f => /Stopped at HTTP/.test(f.reason))) throw new Error("Resolve recorded upstream restriction before retrying this package");
const previousMedia = new Map((reused?.exercises ?? []).flatMap(e => e.media).map(m => [m.id, m]));
const { exercises, manifest: originalManifest } = JSON.parse(await readFile(join(run, "catalog.json"), "utf8"));
if (originalManifest.schemaVersion !== 1) throw new Error("Unsupported snapshot version");
const output = join(run, `selfhost-${includeVideos ? "all" : "images"}-${new Date().toISOString().replaceAll(":", "-")}`);
await mkdir(output); await mkdir(join(output, "media"));
const budget = includeVideos ? 5 * 1024 ** 3 : 300 * 1024 ** 2;
let transferred = 0, complete = 0;
const failures = [];
const media = exercises.flatMap(e => e.media).filter(m => m.rightsStatus === "license_eligible" && (includeVideos || m.kind === "image"));
for (const m of media) {
  const url = new URL(m.sourceUrl);
  const ext = extname(url.pathname).toLowerCase();
  const key = `${createHash("sha256").update(m.id).digest("hex").slice(0, 24)}${ext}`;
  const target = join(output, "media", key), partial = `${target}.partial`;
  let file;
  try {
    if (url.protocol !== "https:" || url.hostname !== "wger.de" || url.port || url.username || url.password || !/^\/media\/(exercise-images|exercise-video)\//.test(url.pathname) || ![".png", ".jpg", ".jpeg", ".jfif", ".avif", ".webp", ".gif", ".mov", ".mp4"].includes(ext)) throw new Error("Media URL/type not allowlisted");
    const previous = previousMedia.get(m.id);
    if (previous?.localPath && previous.sourceUrl === m.sourceUrl && /^media\/[a-f0-9]{24}\.(jpg|jpeg|jfif|avif|png|webp|gif|mov|mp4)$/.test(previous.localPath)) {
      const hash = createHash("sha256"); let size = 0;
      for await (const chunk of createReadStream(join(reuseRoot, previous.localPath))) { hash.update(chunk); size += chunk.length; }
      if (hash.digest("hex") !== previous.localSha256 || size !== previous.localSizeBytes) throw new Error("Reusable asset failed checksum");
      await copyFile(join(reuseRoot, previous.localPath), target, 1);
      m.localPath = `media/${key}`; m.localSha256 = previous.localSha256; m.localSizeBytes = size; m.localContentType = previous.localContentType;
      complete++; continue;
    }
    await new Promise(r => setTimeout(r, 250));
    const response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(180000), headers: { "User-Agent": "Club4Me-exercise-catalog/1.0 (licensed media transfer)" } });
    if (!response.ok) {
      await response.body?.cancel();
      // Respect refusal/rate limiting. Do not route around it or keep requesting other assets.
      if ([401, 403, 429, 503].includes(response.status)) {
        failures.push({ id: m.id, reason: `Stopped at HTTP ${response.status}; rerun only after resolving the source restriction.` }); break;
      }
      throw new Error(`HTTP ${response.status}`);
    }
    const type = response.headers.get("content-type")?.split(";")[0] ?? "";
    const allowedMime = m.kind === "image" ? ["image/png", "image/jpeg", "image/avif", "image/webp", "image/gif"] : ["video/mp4", "video/quicktime", "application/octet-stream"];
    if (!allowedMime.includes(type)) { await response.body?.cancel(); throw new Error(`Unexpected MIME ${type}`); }
    file = await open(partial, "wx"); const hash = createHash("sha256"); let size = 0;
    for await (const bytes of response.body) {
      size += bytes.length; transferred += bytes.length;
      if (size > (m.kind === "image" ? 20 : 500) * 1024 ** 2 || transferred > budget) throw new Error("Transfer byte budget exceeded");
      hash.update(bytes); await file.writeFile(bytes);
    }
    if (!size) throw new Error("Empty media");
    await file.close(); file = undefined; await rename(partial, target);
    m.localPath = `media/${key}`; m.localSha256 = hash.digest("hex"); m.localSizeBytes = size; m.localContentType = type;
    complete++;
    if (m.kind === "video" || complete % 20 === 0 || complete === media.length) console.log(`Local media ${complete}/${media.length}; ${(transferred / 1024 ** 2).toFixed(1)} MiB`);
  } catch (error) {
    await file?.close(); await unlink(partial).catch(() => {});
    failures.push({ id: m.id, reason: error.message });
    if (transferred > budget) break;
  }
}
const summary = summarize(exercises); summary.downloadedMedia = complete;
const manifest = { ...originalManifest, packagedAt: new Date().toISOString(), summary, sourceSnapshot: run, publishing: "Unreviewed local media package. No records automatically added to the app; no production DB modified.", transfer: { includeVideos, budgetBytes: budget, transferredBytes: transferred, eligibleFiles: media.length, downloaded: complete, failures }, runtimePolicy: "Read local database and local media only. sourceUrl and license URLs are attribution references, never media fallbacks." };
await copyFile(join(run, "FREE-EXERCISE-DB-LICENSE.txt"), join(output, "FREE-EXERCISE-DB-LICENSE.txt"), 1);
await writeFile(join(output, "catalog.json"), JSON.stringify({ manifest, exercises }, null, 2), { flag: "wx" });
await writeFile(join(output, "manifest.json"), JSON.stringify(manifest, null, 2), { flag: "wx" });
await writeFile(join(output, "ATTRIBUTION.json"), JSON.stringify(exercises.map(e => ({ id: e.id, sourceUrl: e.sourceUrl, license: e.license, authors: e.authors, translations: e.translations, media: e.media })), null, 2), { flag: "wx" });
writeDatabase(join(output, "catalog.sqlite"), exercises, manifest);
// A candidate import for our own backend: only explicit per-item license eligibility,
// with local media paths. Coaches must still review content before publication.
const candidate = exercises.filter(e => e.rightsStatus === "license_eligible").flatMap(e => {
  const text = e.translations.find(t => t.language === "fa" && t.rightsStatus === "license_eligible") ?? e.translations.find(t => t.language === "en" && t.rightsStatus === "license_eligible");
  if (!text) return [];
  return [{ id: e.id, name: text.name, language: text.language, instructions: text.description, muscle: e.primaryMuscles.join("، ") || e.category, equipment: e.equipment.join("، "), status: "draft", attribution: { sourceUrl: e.sourceUrl, license: e.license, authors: e.authors, text }, media: e.media.filter(m => m.localPath).map(m => ({ kind: m.kind, path: m.localPath, sha256: m.localSha256, contentType: m.localContentType, license: m.license, authors: m.authors, sourceUrl: m.sourceUrl, originalUrl: m.originalUrl, authorUrl: m.authorUrl, attributionTitle: m.attributionTitle })) }];
});
await writeFile(join(output, "backend-import.draft.json"), JSON.stringify(candidate, null, 2), { flag: "wx" });
console.log(JSON.stringify({ output, localFiles: complete, draftExercises: candidate.length, transferMiB: +(transferred / 1024 ** 2).toFixed(1), failures }, null, 2));
if (failures.length) process.exitCode = 2;
