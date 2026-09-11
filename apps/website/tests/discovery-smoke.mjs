/* Run after npm run build --workspace=website. Uses isolated, synthetic API fixtures. */
import { chromium } from "playwright";
import http from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";
import assert from "node:assert/strict";
import path from "node:path";
const root = path.resolve(import.meta.dirname, "../../..");
const apiPort = 17082;
const webPort = 17081;
const base = `http://127.0.0.1:${webPort}`;
const club = {
  id: "club-1",
  slug: "test-club",
  name: "باشگاه آزمایشی",
  shortDescription: "توضیحات باشگاه برای آزمون",
  imageUrl: null,
  averageRating: 4.5,
  reviewsCount: 2,
  sportIds: [],
  tags: ["سالن تمرین"],
  address: "نشانی آزمایشی",
  location: { type: "Point", coordinates: [51.4, 35.7] },
  weeklyHours: [
    {
      dayOfWeek: 6,
      periods: [{ opensAt: "08:00", closesAt: "22:00" }],
      isClosed: false,
    },
  ],
  amenityIds: [],
  equipmentIds: [],
  socialMedia: [],
};
const coach = {
  id: "coach-1",
  slug: "test-coach",
  displayName: "مربی آزمایشی",
  shortBio: "معرفی مربی برای آزمون",
  imageUrl: null,
  averageRating: 0,
  reviewsCount: 0,
  experienceYears: 5,
  specialties: [{ title: "تمرین قدرتی", description: "توضیح تخصص" }],
  experience: [],
  trainingStyles: [],
  faqs: [{ question: "روش تمرین چیست؟", answer: "برنامه متناسب با ورزشکار" }],
};
const training = {
  id: "class-1",
  slug: "test-class",
  title: "کلاس آزمایشی",
  description: "شرح کلاس آزمایشی",
  imageUrl: null,
  deliveryMode: "in_person",
  clubId: "club-1",
  coachIds: ["coach-1"],
  capacity: 12,
  enrollmentCount: 3,
  courseStartAt: "2026-10-01T08:00:00Z",
  courseEndAt: "2026-11-01T08:00:00Z",
  registrationStartAt: null,
  registrationEndAt: null,
  price: { amount: 500000, currency: "IRT" },
  venue: { address: "سالن آزمایشی" },
  prerequisites: ["لباس ورزشی"],
  faqs: [],
};
const article = {
  id: "article-1",
  slug: "test-article",
  title: "مقاله آزمایشی",
  excerpt: "مقدمه مقاله آزمون",
  coverImageUrl: null,
  authorName: "نویسنده آزمون",
  publishedAt: "2026-09-01T08:00:00Z",
  bodyHtml:
    '<h2>متن مقاله</h2><p>محتوای کامل مقاله</p><script>window.UNSAFE=1</script><a href="javascript:alert(1)" onclick="alert(1)">پیوند</a><img src="x" onerror="window.UNSAFE=1">',
};
const fixtures = {
  clubs: club,
  coaches: coach,
  classes: training,
  articles: article,
};
function payload(url) {
  if (url.searchParams.get("q") === "offline")
    return { status: 503, body: { error: "unavailable" } };
  const parts = url.pathname.split("/").filter(Boolean);
  const kind = parts[parts.indexOf("catalog") + 1];
  const slug = parts[parts.indexOf("catalog") + 2];
  const item = fixtures[kind];
  if (!item) return { status: 200, body: { data: [] } };
  if (slug)
    return slug === item.id || slug === item.slug
      ? { status: 200, body: { data: item } }
      : { status: 404, body: { error: "not found" } };
  const page = Number(url.searchParams.get("page") || 1);
  const empty = url.searchParams.get("q") === "no-results";
  const items = empty
    ? []
    : [
        page > 1
          ? { ...item, id: item.id + "-2", slug: item.slug + "-2" }
          : item,
      ];
  return {
    status: 200,
    body: {
      data: {
        items,
        page,
        limit: Number(url.searchParams.get("limit") || 12),
        total: empty ? 0 : 13,
        totalPages: empty ? 0 : 2,
      },
    },
  };
}
(async () => {
  const api = http.createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json");
    const data = payload(new URL(req.url, "http://localhost"));
    res.statusCode = data.status;
    res.end(JSON.stringify(data.body));
  });
  api.listen(apiPort, "127.0.0.1");
  await once(api, "listening");
  const server = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "start",
      "apps/website",
      "--port",
      String(webPort),
    ],
    {
      cwd: root,
      env: {
        ...process.env,
        CATALOG_API_URL: `http://127.0.0.1:${apiPort}/api/v1`,
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let output = "";
  server.stdout.on("data", (x) => (output += x));
  server.stderr.on("data", (x) => (output += x));
  let browser;
  try {
    for (let i = 0; i < 60; i++) {
      try {
        const response = await fetch(base + "/robots.txt");
        if (response.ok) break;
      } catch {}
      await new Promise((r) => setTimeout(r, 250));
    }
    browser = await chromium.launch({ channel: "chrome", headless: true });
    const page = await browser.newPage({ reducedMotion: "reduce" });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.route("**/discovery/catalog/**", async (route) => {
      if (route.request().url().startsWith(base)) return route.continue();
      const result = payload(new URL(route.request().url()));
      await route.fulfill({
        status: result.status,
        contentType: "application/json",
        body: JSON.stringify(result.body),
      });
    });
    for (const [kind, item] of Object.entries(fixtures)) {
      const list = await fetch(`${base}/discovery/${kind}`, {
        headers: { "user-agent": "Googlebot" },
      });
      assert.equal(list.status, 200);
      const html = await list.text();
      assert.ok(html.includes(item.slug), "SSR detail link");
      assert.ok(html.includes('rel="canonical"'), "canonical");
      const response = await page.goto(
        `${base}/discovery/${kind}/${item.slug}`,
      );
      assert.equal(response.status(), 200);
      assert.equal(await page.locator("h1").count(), 1);
      assert.ok(await page.locator("h1").textContent());
      assert.ok(
        (
          await page.locator("link[rel=canonical]").getAttribute("href")
        ).endsWith(`/${item.slug}`),
      );
      for (const schema of await page
        .locator('script[type="application/ld+json"]')
        .allTextContents())
        JSON.parse(schema);
      if (kind === "articles") {
        assert.equal(
          await page
            .locator('article script:not([type="application/ld+json"])')
            .count(),
          0,
        );
        assert.equal(
          await page
            .locator(
              'article [onclick],article [onerror],article a[href^="javascript:"]',
            )
            .count(),
          0,
        );
        assert.equal(await page.evaluate(() => window.UNSAFE), undefined);
        assert.ok(
          await page.getByText("محتوای کامل مقاله", { exact: true }).count(),
        );
      }
      for (const width of [390, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
          `${kind} overflow ${width}`,
        );
      }
      const alias = await fetch(`${base}/discovery/${kind}/${item.id}`, {
        redirect: "manual",
        headers: { "user-agent": "Googlebot" },
      });
      assert.equal(alias.status, 308, "ID redirects to canonical slug");
    }
    await page.goto(base + "/discovery/clubs?page=2");
    assert.ok(
      (await page.locator("link[rel=canonical]").getAttribute("href")).endsWith(
        "?page=2",
      ),
    );
    await page.goto(base + "/discovery/clubs?q=no-results");
    assert.ok(
      (
        await page.locator("meta[name=robots]").getAttribute("content")
      ).includes("noindex"),
    );
    assert.ok(
      await page.getByText("نتیجه‌ای پیدا نشد.", { exact: false }).count(),
    );
    for (const url of [
      "/discovery/clubs/missing",
      "/discovery/unknown",
      "/discovery/clubs?page=900",
    ]) {
      const res = await fetch(base + url, {
        headers: { "user-agent": "Googlebot" },
      });
      assert.equal(res.status, 404, url);
    }
    const outage = await fetch(base + "/discovery/clubs?q=offline", {
      headers: { "user-agent": "Googlebot" },
    });
    assert.equal(
      outage.status,
      500,
      "API outages must not become 404 or successful empty pages",
    );
    const sitemap = await (await fetch(base + "/sitemap.xml")).text();
    for (const kind of Object.keys(fixtures))
      assert.ok(sitemap.includes(`/discovery/${kind}/${fixtures[kind].slug}`));
    assert.ok(
      (await (await fetch(base + "/robots.txt")).text()).includes(
        "sitemap.xml",
      ),
    );
    const og = await fetch(base + "/opengraph-image");
    assert.equal(og.status, 200);
    assert.ok(og.headers.get("content-type").includes("image/png"));
    await page.goto(base);
    await page.locator("#features").waitFor();
    for (const id of [
      "features",
      "coaches",
      "about",
      "sports",
      "progress",
      "clubs",
      "classes",
      "testimonials",
      "booking",
      "articles",
      "download",
      "faq",
    ])
      assert.equal(await page.locator("#" + id).count(), 1, `restored ${id}`);
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.locator("#features").scrollIntoViewIfNeeded();
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        `landing overflow ${width}`,
      );
      await page.screenshot({ path: `/tmp/restored-landing-${width}.png` });
    }
    await page.goto(base + "/discovery/clubs/test-club");
    await page.screenshot({ path: "/tmp/website-club-desktop.png" });
    await page.setViewportSize({ width: 390, height: 900 });
    await page.screenshot({ path: "/tmp/website-club-mobile.png" });
    assert.deepEqual(errors, []);
    console.log(
      "PASS: restored sections; SSR lists/details; canonical redirects; 404; search; pagination; sitemap; robots; OG; sanitized articles; mobile/desktop overflow.",
    );
  } catch (error) {
    console.error(output.slice(-4000));
    throw error;
  } finally {
    await browser?.close();
    server.kill("SIGTERM");
    api.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
