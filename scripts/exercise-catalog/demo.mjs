#!/usr/bin/env node
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync, createReadStream } from "node:fs";
import { resolve, join, extname } from "node:path";
import { createHash } from "node:crypto";

const run = resolve(process.argv[2]);
const directories = process.argv.slice(3).map(resolvePath => resolve(resolvePath));
const snapshot = JSON.parse(readFileSync(join(run, "catalog.json"), "utf8"));
const paths = new Map();
const names = { "Bench Press": "پرس سینه هالتر", "Dips": "دیپ", "Benchpress Dumbbells": "پرس سینه دمبل", "Seated Hip Adduction": "داخل ران دستگاه", "Barbell Lunges Standing": "لانج با هالتر", "Biceps Curls With Barbell": "جلو بازو هالتر", "Biceps Curls With Dumbbell": "جلو بازو دمبل", "Biceps Curl With Cable": "جلو بازو سیم‌کش", "Bent-over Lateral Raises": "نشر خم دمبل", "Dumbbell Lunges Standing": "لانج با دمبل" };
const items = snapshot.exercises.filter(e => e.rightsStatus === "license_eligible").flatMap(e => {
  const text = e.translations.find(t => t.language === "en" && t.rightsStatus === "license_eligible");
  if (!text) return [];
  const media = e.media.filter(m => m.rightsStatus === "license_eligible").flatMap(m => {
    const filename = createHash("sha256").update(m.id).digest("hex").slice(0, 24) + extname(new URL(m.sourceUrl).pathname).toLowerCase();
    const path = directories.map(d => join(d, "media", filename)).find(existsSync);
    if (!path) return [];
    paths.set(`/media/${filename}`, path);
    return [{ ...m, url: `/media/${filename}` }];
  });
  if (!media.length) return [];
  const video = media.find(m => m.kind === "video" && m.url.endsWith(".mp4"));
  return [{ id: e.id, name: names[text.name] ?? text.name, originalName: text.name, category: e.category, equipment: e.equipment.join(" · "), description: text.description, textAttribution: text, images: media.filter(m => m.kind === "image"), video, score: video ? 2 : names[text.name] ? 1 : 0 }];
}).sort((a, b) => b.score - a.score).slice(0, 12);
const mime = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".gif": "image/gif", ".webp": "image/webp", ".mp4": "video/mp4", ".mov": "video/quicktime" };
const html = readFileSync(new URL("./demo.html", import.meta.url));
const font = resolve("packages/theme/fonts/IRANSansXV.woff2");
createServer((req, res) => {
  const path = new URL(req.url, "http://127.0.0.1").pathname;
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self'; media-src 'self'; connect-src 'self'; font-src 'self'; object-src 'none'");
  if (path === "/") { res.setHeader("Content-Type", "text/html; charset=utf-8"); return res.end(html); }
  if (path === "/catalog") { res.setHeader("Content-Type", "application/json; charset=utf-8"); return res.end(JSON.stringify(items)); }
  const file = path === "/font.woff2" ? font : paths.get(path);
  if (!file) { res.statusCode = 404; return res.end(); }
  const size = statSync(file).size;
  res.setHeader("Content-Type", path === "/font.woff2" ? "font/woff2" : mime[extname(file)] ?? "application/octet-stream");
  res.setHeader("Accept-Ranges", "bytes");
  let start = 0, end = size - 1;
  if (req.headers.range) {
    const match = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range);
    if (!match || Number(match[1]) >= size || (match[2] && Number(match[2]) < Number(match[1]))) { res.writeHead(416, { "Content-Range": `bytes */${size}` }); return res.end(); }
    start = Number(match[1]); end = match[2] ? Math.min(Number(match[2]), size - 1) : end;
    res.statusCode = 206; res.setHeader("Content-Range", `bytes ${start}-${end}/${size}`);
  }
  res.setHeader("Content-Length", end - start + 1);
  if (req.method === "HEAD") return res.end();
  const stream = createReadStream(file, { start, end }); stream.on("error", () => res.destroy()); res.on("close", () => stream.destroy()); stream.pipe(res);
}).listen(7093, "127.0.0.1", () => console.log(`Demo http://127.0.0.1:7093 — ${items.length} exercises, ${items.filter(e => e.video).length} MP4 videos; all files local`));
