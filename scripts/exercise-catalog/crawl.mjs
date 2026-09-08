#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { createHash } from "node:crypto";
import { normalizeWger, normalizeFree, summarize, writeDatabase } from "./model.mjs";

const output = resolve(process.argv[2] ?? `data/exercise-catalog/runs/${new Date().toISOString().replaceAll(":", "-")}`);
const sources = [], hashes = [];
const allowed = url => {
  const u = new URL(url);
  return u.protocol === "https:" && !u.username && !u.password && !u.port && (
    (u.hostname === "wger.de" && /^\/api\/v2\/(license|language|exerciseinfo)\//.test(u.pathname)) ||
    (u.hostname === "api.github.com" && /^\/repos\/yuhonas\/free-exercise-db\/commits\/main$/.test(u.pathname)) ||
    (u.hostname === "raw.githubusercontent.com" && /^\/yuhonas\/free-exercise-db\/[a-f0-9]{40}\/(LICENSE.md|dist\/exercises.json)$/.test(u.pathname))
  );
};
async function fetchText(url) {
  if (!allowed(url)) throw new Error(`Source URL outside allowlist: ${url}`);
  for (let attempt = 0; attempt < 3; attempt++) {
    await new Promise(r => setTimeout(r, 400));
    const response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(30000), headers: { "User-Agent": "Club4Me-exercise-catalog/1.0 (public API; no media downloads)", Accept: "application/json,text/plain" } });
    if (response.status === 429 || response.status === 503) {
      const seconds = Number(response.headers.get("retry-after") ?? "2");
      await response.body?.cancel();
      if (attempt === 2 || !Number.isFinite(seconds) || seconds > 30) throw new Error(`Server asks to retry later: ${response.status}`);
      await new Promise(r => setTimeout(r, Math.max(1, seconds) * 1000)); continue;
    }
    if (!response.ok) throw new Error(`${response.status} from ${url}`);
    const chunks = []; let size = 0;
    for await (const bytes of response.body) { size += bytes.length; if (size > 20 * 1024 * 1024) throw new Error("Response exceeds 20 MiB safety budget"); chunks.push(bytes); }
    const buffer = Buffer.concat(chunks);
    hashes.push({ url, bytes: size, sha256: createHash("sha256").update(buffer).digest("hex"), retrievedAt: new Date().toISOString() });
    return buffer.toString("utf8");
  }
  throw new Error("Retry limit reached");
}
async function pages(endpoint) {
  let url = `https://wger.de/api/v2/${endpoint}/?limit=100`, seen = new Set(), items = [];
  while (url) {
    if (seen.has(url) || seen.size >= 50 || new URL(url).pathname !== `/api/v2/${endpoint}/`) throw new Error("Unexpected pagination");
    seen.add(url); const data = JSON.parse(await fetchText(url));
    if (!Array.isArray(data.results)) throw new Error(`Missing results for ${endpoint}`);
    items.push(...data.results); console.log(`${endpoint}: ${items.length}/${data.count}`);
    url = data.next;
  }
  return items;
}

// Every run gets a new directory. Existing databases are never overwritten.
await mkdir(output, { recursive: false }).catch(async error => {
  if (error.code !== "ENOENT") throw error;
  await mkdir(resolve(output, ".."), { recursive: true }); await mkdir(output);
});
try {
  const licenses = new Map((await pages("license")).map(x => [x.id, x]));
  const languages = new Map((await pages("language")).map(x => [x.id, x.short_name]));
  const wger = normalizeWger(await pages("exerciseinfo"), licenses, languages);
  sources.push({ name: "wger", url: "https://wger.de/api/v2/exerciseinfo/", licensePolicy: "Per-entry Creative Commons; missing attribution, unsupported licenses and AI images excluded from eligible media." });
  const commit = JSON.parse(await fetchText("https://api.github.com/repos/yuhonas/free-exercise-db/commits/main"));
  if (!/^[a-f0-9]{40}$/.test(commit.sha)) throw new Error("Invalid repository revision");
  const licenseText = await fetchText(`https://raw.githubusercontent.com/yuhonas/free-exercise-db/${commit.sha}/LICENSE.md`);
  if (!licenseText.includes("public domain")) throw new Error("Repository license changed; review required");
  const free = normalizeFree(JSON.parse(await fetchText(`https://raw.githubusercontent.com/yuhonas/free-exercise-db/${commit.sha}/dist/exercises.json`)), commit.sha);
  sources.push({ name: "free-exercise-db", revision: commit.sha, url: "https://github.com/yuhonas/free-exercise-db", licensePolicy: "Repository declares Unlicense. Per-image provenance unverified; all images quarantined from publishing and downloading." });
  const items = [...wger, ...free];
  if (new Set(items.map(x => x.id)).size !== items.length) throw new Error("Duplicate source identities");
  const manifest = { schemaVersion: 1, createdAt: new Date().toISOString(), sources, requests: hashes, summary: summarize(items), ownership: "Independent database structure; upstream content retains its original licenses. Not a proprietary ownership claim.", publishing: "Unreviewed catalog. No records automatically added to the app; no media downloaded; no production DB modified." };
  await writeFile(join(output, "catalog.json"), JSON.stringify({ manifest, exercises: items }, null, 2), { flag: "wx" });
  await writeFile(join(output, "manifest.json"), JSON.stringify(manifest, null, 2), { flag: "wx" });
  await writeFile(join(output, "FREE-EXERCISE-DB-LICENSE.txt"), licenseText, { flag: "wx" });
  await writeFile(join(output, "ATTRIBUTION.json"), JSON.stringify(items.map(e => ({ id: e.id, sourceUrl: e.sourceUrl, license: e.license, authors: e.authors, translations: e.translations.map(t => ({ id: t.id, license: t.license, authors: t.authors, attributionTitle: t.attributionTitle, authorUrl: t.authorUrl, originalUrl: t.originalUrl, derivativeSourceUrl: t.derivativeSourceUrl, transformation: t.transformation })), media: e.media })), null, 2), { flag: "wx" });
  writeDatabase(join(output, "catalog.sqlite"), items, manifest);
  console.log(JSON.stringify({ output, ...manifest.summary, possibleDuplicateNames: manifest.summary.possibleDuplicateNames.length }, null, 2));
} catch (error) {
  await writeFile(join(output, "FAILED.txt"), `${new Date().toISOString()}\n${error.message}\nDo not publish this incomplete run.\n`, { flag: "wx" });
  throw error;
}
