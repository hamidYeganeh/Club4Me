#!/usr/bin/env node
import { readFile, mkdir, copyFile, writeFile, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, join } from "node:path";
import { writeDatabase } from "./model.mjs";

// Offline import of the publisher's Free50 download, never its paid library.
if (!process.argv[2]) throw new Error("Usage: node scripts/exercise-catalog/import-vital.mjs <VitalAnimations-directory>");
const input = resolve(process.argv[2]);
const output = resolve(`data/exercise-catalog/runs/vital-free-${new Date().toISOString().replaceAll(":", "-")}`);
const sourceUrl = "https://vitalanimations.com/free-pack";
const license = { id: "vital-free:2026.1", short_name: "Vital Animations commercial EULA — free pack grant", url: "https://vitalanimations.com/license", grantUrl: "https://github.com/exercisedb-pro/exercisedb-dataset#-free-exercise-animations-for-developers" };
const rawBytes = await readFile(join(input, "Free50/50gymworkouts.json"));
const raw = JSON.parse(rawBytes);
if (!Array.isArray(raw) || !raw.length || raw.length > 50) throw new Error("Expected the Free50 package only");
const ids = new Set();
for (const e of raw) {
  if (!/^\d{4}$/.test(e.id) || ids.has(e.id) || typeof e.name !== "string" || !Array.isArray(e.instructions) || e.instructions.some(x => typeof x !== "string")) throw new Error("Invalid or duplicate source record");
  ids.add(e.id);
  const s = await stat(join(input, "Free50/Free50", `${e.id}.mp4`));
  if (!s.isFile() || s.size < 16 || s.size > 100 * 1024 ** 2) throw new Error(`Missing/invalid video ${e.id}`);
}
await mkdir(output); await mkdir(join(output, "media"));
const exercises = [];
for (const e of raw) {
  const id = `vital:${e.id}`, localPath = `media/${e.id}.mp4`;
  await copyFile(join(input, "Free50/Free50", `${e.id}.mp4`), join(output, localPath), 1);
  const hash = createHash("sha256"); let size = 0;
  for await (const chunk of createReadStream(join(output, localPath))) { hash.update(chunk); size += chunk.length; }
  const text = { id: `${id}:en`, language: "en", name: e.name, description: `${e.description ?? ""}\n\n${e.instructions.join("\n")}`, instructions: e.instructions, originalHtml: "", aliases: [], license, authors: ["Vital Animations"], originalUrl: sourceUrl, rightsStatus: "publisher_free_pack_grant", transformation: "Description and instruction steps joined for full-text search; original metadata preserved." };
  exercises.push({ id, source: "vital-free", sourceId: e.id, sourceUrl, name: e.name, category: e.category, bodyPart: e.bodyPart, equipment: [e.equipment], primaryMuscles: [e.target], secondaryMuscles: e.secondaryMuscles ?? [], level: e.difficulty, license, authors: ["Vital Animations"], rightsStatus: "publisher_free_pack_grant", reviewStatus: "unreviewed", translations: [text], originalRecord: e, media: [{ id: `${id}:video`, kind: "video", sourceUrl, localPath, localSha256: hash.digest("hex"), localSizeBytes: size, sizeBytes: size, localContentType: "video/mp4", license, authors: ["Vital Animations"], rightsStatus: "publisher_free_pack_grant", transformation: "Original MP4 copied byte-for-byte; no compression or edits." }] });
}
const counts = key => raw.reduce((out, e) => { out[e[key]] = (out[e[key]] ?? 0) + 1; return out; }, {});
const manifest = { schemaVersion: 1, createdAt: new Date().toISOString(), sourceUrl, package: "Vital Free50", sourceMetadataSha256: createHash("sha256").update(rawBytes).digest("hex"), count: exercises.length, localVideos: exercises.length, bytes: exercises.reduce((n, e) => n + e.media[0].sizeBytes, 0), coverage: { bodyPart: counts("bodyPart"), equipment: counts("equipment"), target: counts("target") }, license, runtimePolicy: "Use local media paths only. Source and license URLs are provenance references, not runtime dependencies.", publishing: "Private imported draft. No production changes. No raw file redistribution. Review metadata and technique before publication.", excluded: "Character Samples are not imported: no matching structured metadata in this package." };
await writeFile(join(output, "source-metadata.json"), rawBytes, { flag: "wx" });
await writeFile(join(output, "catalog.json"), JSON.stringify({ manifest, exercises }, null, 2), { flag: "wx" });
await writeFile(join(output, "manifest.json"), JSON.stringify(manifest, null, 2), { flag: "wx" });
await writeFile(join(output, "ATTRIBUTION.json"), JSON.stringify({ license, sourceUrl, publisher: "Vital Animations", ownership: "Upstream assets are licensed, not owned by Club4Me.", records: exercises.map(e => ({ id: e.id, license, media: e.media })) }, null, 2), { flag: "wx" });
writeDatabase(join(output, "catalog.sqlite"), exercises, manifest);
console.log(JSON.stringify({ output, ...manifest }, null, 2));
