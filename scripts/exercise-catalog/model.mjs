import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { openSync, closeSync } from "node:fs";

const cc = /^https?:\/\/(?:www\.)?creativecommons\.org\/(?:licenses\/(by|by-sa)\/(3\.0|4\.0)(?:\/|$)|publicdomain\/zero\/1\.0(?:\/|$))/;
export function rights(license, authors, ai = false) {
  if (!license || !cc.test(license.url)) return "license_review";
  if (ai) return "ai_media_review";
  if (!license.url.includes("/zero/") && !authors.length) return "attribution_missing";
  return "license_eligible";
}
const authorsOf = x => [...new Set([x.license_author, ...(x.author_history ?? [])].filter(x => typeof x === "string" && x.trim()).map(x => x.trim()))];
const plain = x => String(x ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const nameKey = s => String(s).normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
export function normalizeWger(raw, licenses, languages) {
  const items = [];
  for (const x of raw) {
    if (!Number.isInteger(x.id) || !x.uuid || !Array.isArray(x.translations)) throw new Error("Unexpected wger exercise shape");
    const id = `wger:${x.uuid}`, sourceUrl = `https://wger.de/api/v2/exerciseinfo/${x.id}/`;
    const exerciseLicense = licenses.get(x.license?.id), authors = authorsOf(x);
    const translations = x.translations.map(t => {
      const license = licenses.get(t.license), authors = authorsOf(t);
      return { id: `wger:translation:${t.id}`, language: languages.get(t.language) ?? `unknown:${t.language}`, name: t.name, description: plain(t.description), originalHtml: t.description ?? "", aliases: t.aliases ?? [], license, authors, attributionTitle: t.license_title || null, authorUrl: t.license_author_url || null, originalUrl: t.license_object_url || sourceUrl, derivativeSourceUrl: t.license_derivative_source_url || null, rightsStatus: rights(license, authors), transformation: "HTML tags removed and whitespace normalized for plain-text description; original retained." };
    });
    const media = [...(x.images ?? []).map(m => ({ ...m, kind: "image", sourceUrl: m.image })), ...(x.videos ?? []).map(m => ({ ...m, kind: "video", sourceUrl: m.video }))].map(m => {
      const license = licenses.get(m.license), authors = authorsOf(m);
      const safe = /^https:\/\/wger\.de\/media\/(exercise-images|exercise-video)\//.test(m.sourceUrl);
      return { id: `wger:${m.kind}:${m.id}`, kind: m.kind, sourceUrl: m.sourceUrl, license, authors, attributionTitle: m.license_title || null, authorUrl: m.license_author_url || null, originalUrl: m.license_object_url || sourceUrl, derivativeSourceUrl: m.license_derivative_source_url || null, rightsStatus: safe ? rights(license, authors, m.is_ai_generated === true) : "url_review", sizeBytes: m.size ?? null, durationSeconds: m.duration == null ? null : Number(m.duration), codec: m.codec ?? null, width: m.width ?? null, height: m.height ?? null, isMain: !!m.is_main, aiGenerated: m.is_ai_generated ?? null, localPath: null };
    });
    items.push({ id, source: "wger", sourceId: String(x.id), sourceUrl, sourceUpdatedAt: x.last_update_global ?? null, name: translations.find(t => t.language === "en")?.name ?? translations[0]?.name ?? `Exercise ${x.id}`, category: x.category?.name ?? "", primaryMuscles: (x.muscles ?? []).map(m => m.name_en || m.name), secondaryMuscles: (x.muscles_secondary ?? []).map(m => m.name_en || m.name), equipment: (x.equipment ?? []).map(e => e.name), level: null, license: exerciseLicense, authors, rightsStatus: rights(exerciseLicense, authors), reviewStatus: "unreviewed", translations, media });
  }
  return items;
}

export function normalizeFree(raw, revision) {
  if (!Array.isArray(raw)) throw new Error("Unexpected free-exercise-db shape");
  const license = { id: "free-exercise-db:unlicense", short_name: "Unlicense (repository declaration)", url: `https://github.com/yuhonas/free-exercise-db/blob/${revision}/LICENSE.md` };
  return raw.map(x => {
    if (typeof x.id !== "string" || typeof x.name !== "string" || !Array.isArray(x.instructions)) throw new Error("Unexpected free-exercise-db record");
    const id = `fedb:${createHash("sha256").update(x.id).digest("hex").slice(0, 24)}`;
    const sourceUrl = `https://github.com/yuhonas/free-exercise-db/blob/${revision}/exercises/${encodeURIComponent(x.id)}.json`;
    return { id, source: "free-exercise-db", sourceId: x.id, sourceUrl, sourceUpdatedAt: null, name: x.name, category: x.category ?? "", primaryMuscles: x.primaryMuscles ?? [], secondaryMuscles: x.secondaryMuscles ?? [], equipment: x.equipment ? [x.equipment] : [], level: x.level ?? null, license, authors: [], rightsStatus: "source_declared_unreviewed", reviewStatus: "unreviewed", translations: [{ id: `${id}:en`, language: "en", name: x.name, description: x.instructions.join("\n"), originalHtml: "", aliases: [], license, authors: [], originalUrl: sourceUrl, derivativeSourceUrl: null, rightsStatus: "source_declared_unreviewed", transformation: "Instruction array joined with newlines." }], media: (x.images ?? []).map((path, i) => ({ id: `${id}:image:${i}`, kind: "image", sourceUrl: `https://raw.githubusercontent.com/yuhonas/free-exercise-db/${revision}/exercises/${path.split("/").map(encodeURIComponent).join("/")}`, license, authors: [], originalUrl: sourceUrl, rightsStatus: "image_provenance_review", sizeBytes: null, localPath: null })) };
  });
}

export function summarize(items) {
  const counts = values => values.reduce((out, x) => { out[x] = (out[x] ?? 0) + 1; return out; }, {});
  const media = items.flatMap(x => x.media), translations = items.flatMap(x => x.translations);
  const names = new Map();
  for (const e of items) { const key = nameKey(e.name); if (!key) continue; names.set(key, [...(names.get(key) ?? []), e.id]); }
  return { exercises: items.length, bySource: counts(items.map(x => x.source)), translations: translations.length, languages: counts(translations.map(x => x.language)), media: counts(media.map(x => x.kind)), mediaRights: counts(media.map(x => x.rightsStatus)), eligibleMedia: counts(media.filter(x => x.rightsStatus === "license_eligible").map(x => x.kind)), knownVideoBytes: media.filter(x => x.kind === "video").reduce((n, x) => n + (x.sizeBytes ?? 0), 0), exerciseRights: counts(items.map(x => x.rightsStatus)), possibleDuplicateNames: [...names].filter(([, ids]) => ids.length > 1).map(([name, ids]) => ({ name, ids })), downloadedMedia: 0 };
}

export function writeDatabase(path, items, manifest) {
  // Exclusive creation prevents accidentally mutating an existing user database.
  closeSync(openSync(path, "wx"));
  const db = new DatabaseSync(path);
  try {
    db.exec(`PRAGMA foreign_keys=ON;
      CREATE TABLE catalog_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE exercises (id TEXT PRIMARY KEY, source TEXT NOT NULL, source_id TEXT NOT NULL, name TEXT NOT NULL, category TEXT, equipment_json TEXT NOT NULL, primary_muscles_json TEXT NOT NULL, secondary_muscles_json TEXT NOT NULL, rights_status TEXT NOT NULL, review_status TEXT NOT NULL, record_json TEXT NOT NULL, UNIQUE(source, source_id));
      CREATE TABLE translations (id TEXT PRIMARY KEY, exercise_id TEXT NOT NULL REFERENCES exercises(id), language TEXT NOT NULL, name TEXT NOT NULL, description TEXT NOT NULL, rights_status TEXT NOT NULL, attribution_json TEXT NOT NULL);
      CREATE TABLE media (id TEXT PRIMARY KEY, exercise_id TEXT NOT NULL REFERENCES exercises(id), kind TEXT NOT NULL CHECK(kind IN ('image','video')), source_url TEXT NOT NULL, local_path TEXT, rights_status TEXT NOT NULL, size_bytes INTEGER, attribution_json TEXT NOT NULL);
      CREATE INDEX translations_language ON translations(language);
      CREATE INDEX media_eligibility ON media(rights_status,kind);
      CREATE VIRTUAL TABLE exercise_search USING fts5(exercise_id UNINDEXED, language UNINDEXED, name, description, tokenize='unicode61');
      CREATE VIEW license_eligible_media AS SELECT * FROM media WHERE rights_status='license_eligible';
      BEGIN;`);
    db.prepare("INSERT INTO catalog_meta VALUES (?,?)").run("manifest", JSON.stringify(manifest));
    const insert = db.prepare("INSERT INTO exercises VALUES (?,?,?,?,?,?,?,?,?,?,?)");
    const text = db.prepare("INSERT INTO translations VALUES (?,?,?,?,?,?,?)");
    const media = db.prepare("INSERT INTO media VALUES (?,?,?,?,?,?,?,?)");
    const search = db.prepare("INSERT INTO exercise_search VALUES (?,?,?,?)");
    for (const e of items) {
      insert.run(e.id, e.source, e.sourceId, e.name, e.category, JSON.stringify(e.equipment), JSON.stringify(e.primaryMuscles), JSON.stringify(e.secondaryMuscles), e.rightsStatus, e.reviewStatus, JSON.stringify(e));
      for (const t of e.translations) { text.run(t.id, e.id, t.language, t.name, t.description, t.rightsStatus, JSON.stringify(t)); search.run(e.id, t.language, t.name, t.description); }
      for (const m of e.media) media.run(m.id, e.id, m.kind, m.sourceUrl, m.localPath, m.rightsStatus, m.sizeBytes, JSON.stringify(m));
    }
    db.exec("COMMIT;");
    if (db.prepare("PRAGMA integrity_check").get().integrity_check !== "ok") throw new Error("SQLite integrity check failed");
    if (db.prepare("PRAGMA foreign_key_check").all().length) throw new Error("SQLite foreign key check failed");
  } finally { db.close(); }
}
