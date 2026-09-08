import { expect, test } from "@playwright/test";
import {
  createMockApiState,
  installApiMock,
  setBrowserSession,
} from "./support/mock-api";
import { feed } from "./support/discovery-feed";

test("all sections stay visible when data arrives after scrolling with motion enabled", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await installApiMock(page, createMockApiState());
  await setBrowserSession(page, true);
  await page.addInitScript(() =>
    localStorage.setItem("discovery-section-layouts-v1", "[]"),
  );
  let release!: () => void;
  const ready = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/v1/discovery/sections", async (route) => {
    await ready;
    await route.fulfill({ json: { data: feed } });
  });
  await page.goto("/discovery", { waitUntil: "domcontentloaded" });
  await expect(page.locator("[data-discovery-section]")).toHaveCount(
    feed.length,
  );
  await page.locator(".app-scroll-root").evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  release();
  await expect(page.locator("[data-skeleton-card]")).toHaveCount(0);
  await expect(page.locator("[data-discovery-section]")).toHaveCount(
    feed.length,
  );
  for (const section of feed) {
    const element = page
      .locator(`[data-discovery-section="${section.id}"] section`)
      .first();
    await element.scrollIntoViewIfNeeded();
    await expect(element).toBeVisible();
    await expect(element).toHaveCSS("opacity", "1");
    await expect(element).toHaveCSS("visibility", "visible");
    await expect(element).toHaveCSS("filter", "none");
  }
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("[data-skeleton-card]")).toHaveCount(0);
  await expect(page.locator("[data-discovery-section]")).toHaveCount(
    feed.length,
  );
  await expect(
    page.locator("[data-discovery-section] section").first(),
  ).toHaveCSS("opacity", "1");
});

test("city request failures offer retry and preserve cities whose province is unavailable", async ({
  page,
}) => {
  await installApiMock(page, createMockApiState());
  await setBrowserSession(page, true);
  let fail = true;
  await page.route("**/api/v1/geography/provinces*", (route) =>
    route.fulfill({ json: { data: { items: [], total: 0 } } }),
  );
  await page.route("**/api/v1/geography/cities*", (route) =>
    fail
      ? route.fulfill({
          status: 503,
          json: {
            error: { code: "SERVICE_UNAVAILABLE", message: "Unavailable" },
          },
        })
      : route.fulfill({
          json: {
            data: {
              items: [
                {
                  id: "city",
                  slug: "tehran",
                  name: "تهران",
                  provinceId: "missing",
                  clubsCount: 3,
                },
              ],
              total: 1,
            },
          },
        }),
  );
  await page.goto("/discovery/cities");
  await expect(page.locator('[role="alert"][data-state]')).toBeVisible();
  await expect(page.getByText("شهری پیدا نشد")).toHaveCount(0);
  fail = false;
  await page.getByRole("button", { name: "تلاش دوباره", exact: true }).click();
  await expect(page.getByRole("link", { name: /تهران/ })).toBeVisible();
});

test("sports search and pagination reach results beyond the first page", async ({
  page,
}, testInfo) => {
  await installApiMock(page, createMockApiState());
  await setBrowserSession(page, true);
  await page.route("**/api/v1/sports/sports*", (route) => {
    const params = new URL(route.request().url()).searchParams;
    const filtered = params.get("search") === "شنا";
    const second = params.get("page") === "2";
    return route.fulfill({
      json: {
        data: {
          items: [
            {
              id: filtered ? "swim" : second ? "tennis" : "fitness",
              slug: filtered ? "swim" : second ? "tennis" : "fitness",
              name: filtered ? "شنا" : second ? "تنیس" : "بدنسازی",
            },
          ],
          total: filtered ? 1 : 31,
        },
      },
    });
  });
  await page.goto("/discovery/sports");
  await expect(
    page.getByRole("heading", { name: "بدنسازی", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("status", { name: "Gym4Me", exact: true }),
  ).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: testInfo.outputPath("sports.png") });
  await page.getByRole("button", { name: "بعدی", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "تنیس", exact: true }),
  ).toBeVisible();
  await page.getByRole("searchbox").fill("شنا");
  await expect(
    page.getByRole("heading", { name: "شنا", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "صفحه‌بندی نتایج" }),
  ).toHaveCount(0);
  await expect(page.getByRole("link", { name: /شنا/ })).toHaveAttribute(
    "href",
    "/discovery/sports/swim",
  );
});

test("coach details render while sessions are still loading", async ({
  page,
}, testInfo) => {
  await installApiMock(page, createMockApiState());
  await setBrowserSession(page, true);
  const fixture = feed.find((section) => section.type === "coaches")!.items[0];
  await page.route("**/api/v1/discovery/catalog/coaches/sample", (route) =>
    route.fulfill({
      json: {
        data: {
          ...fixture,
          slug: "sample",
          contact: {},
          portfolio: [],
          specialties: [],
          serviceModes: ["online"],
          trainingStyles: [],
          experience: [],
          experienceSummary: "",
          faqs: [],
        },
      },
    }),
  );
  let release!: () => void;
  const ready = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(
    "**/api/v1/public/coaches/sample/sessions",
    async (route) => {
      await ready;
      await route.fulfill({ json: { data: { items: [] } } });
    },
  );
  await page.goto("/discovery/coaches/sample");
  await expect(
    page.getByRole("heading", { name: "مربی نمونه", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "مشاهده گالری", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("status", { name: "Gym4Me", exact: true }),
  ).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: testInfo.outputPath("coach-detail.png") });
  release();
  await expect(
    page.getByText("فعلاً سانس آزادی ثبت نشده است.", { exact: true }),
  ).toBeVisible();
});

test("class search reaches both sources and a failed source can retry independently", async ({
  page,
}, testInfo) => {
  await installApiMock(page, createMockApiState());
  await setBrowserSession(page, true);
  const fixture = feed.find((section) => section.type === "classes")!.items[0];
  let fail = true;
  const terms: string[] = [];
  await page.route("**/api/v1/discovery/catalog/classes?*", (route) => {
    const q = new URL(route.request().url()).searchParams.get("q") ?? "";
    terms.push(`catalog:${q}`);
    return route.fulfill({
      json: {
        data: { items: [{ ...fixture, title: q || "تمرین قدرتی" }], total: 1 },
      },
    });
  });
  await page.route("**/api/v1/discovery/business-classes*", (route) => {
    const q = new URL(route.request().url()).searchParams.get("q") ?? "";
    terms.push(`business:${q}`);
    return fail
      ? route.fulfill({
          status: 503,
          json: {
            error: { code: "SERVICE_UNAVAILABLE", message: "Unavailable" },
          },
        })
      : route.fulfill({ json: { data: { items: [], total: 0 } } });
  });
  await page.goto("/discovery/classes");
  await expect(
    page.getByRole("link", { name: "تمرین قدرتی", exact: true }),
  ).toBeVisible();
  await expect(page.locator('[role="alert"][data-state]')).toBeVisible();
  fail = false;
  await page.getByRole("button", { name: "تلاش دوباره", exact: true }).click();
  await expect(page.locator('[role="alert"][data-state]')).toHaveCount(0);
  await page.getByRole("searchbox").fill("یوگا");
  await expect(
    page.getByRole("link", { name: "یوگا", exact: true }),
  ).toBeVisible();
  await expect
    .poll(
      () => terms.includes("business:یوگا") && terms.includes("catalog:یوگا"),
    )
    .toBe(true);
  await expect(
    page.getByRole("status", { name: "Gym4Me", exact: true }),
  ).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: testInfo.outputPath("classes.png") });
});

test("sport details retain their sport filter across search and pagination", async ({
  page,
}) => {
  await installApiMock(page, createMockApiState());
  await setBrowserSession(page, true);
  const fixture = feed.find((section) => section.type === "clubs")!.items[0];
  const requests: URLSearchParams[] = [];
  await page.route("**/api/v1/sports/sports*", (route) =>
    route.fulfill({
      json: {
        data: {
          items: [{ id: "sport-id", slug: "fitness", name: "بدنسازی" }],
          total: 1,
        },
      },
    }),
  );
  await page.route("**/api/v1/discovery/catalog/clubs?*", (route) => {
    const params = new URL(route.request().url()).searchParams;
    requests.push(params);
    return route.fulfill({ json: { data: { items: [fixture], total: 21 } } });
  });
  await page.goto("/discovery/sports/fitness");
  await expect(
    page.getByRole("link", { name: "باشگاه آفتاب", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "بعدی", exact: true }).click();
  await expect
    .poll(() => requests.some((params) => params.get("page") === "2"))
    .toBe(true);
  await page.getByRole("searchbox").fill("آفتاب");
  await expect
    .poll(() =>
      requests.some(
        (params) => params.get("q") === "آفتاب" && params.get("page") === "1",
      ),
    )
    .toBe(true);
  expect(requests.every((params) => params.get("sportId") === "sport-id")).toBe(
    true,
  );
});

test("class information stays visible while enrollment status loads and booking waits", async ({
  page,
}) => {
  await installApiMock(page, createMockApiState());
  await setBrowserSession(page, true);
  const fixture = feed.find((section) => section.type === "classes")!.items[0];
  await page.route("**/api/v1/discovery/catalog/classes/sample", (route) =>
    route.fulfill({
      json: {
        data: {
          ...fixture,
          slug: "sample",
          status: "published",
          courseStartAt: "2027-01-01T10:00:00Z",
          courseEndAt: "2027-03-01T10:00:00Z",
        },
      },
    }),
  );
  let release!: () => void;
  const ready = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/v1/athlete/enrollments", async (route) => {
    await ready;
    await route.fulfill({ json: { data: { items: [] } } });
  });
  await page.goto("/discovery/classes/sample");
  await expect(
    page.getByRole("heading", { name: "تمرین قدرتی", exact: true }),
  ).toBeVisible();
  const booking = page.getByRole("button", { name: /ثبت‌نام در کلاس/ });
  await expect(booking).toBeDisabled();
  release();
  await expect(booking).toBeEnabled();
});
