import { expect, test } from "@playwright/test";
import {
  createMockApiState,
  installApiMock,
  setBrowserSession,
  publicClubFixture,
} from "./support/mock-api";

test.beforeEach(async ({ page }) => {
  await installApiMock(page, createMockApiState());
  await setBrowserSession(page, true);
  await page.addInitScript(() =>
    sessionStorage.setItem("gym4me.splash.shown", "1"),
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("role header and safe-area clearance; profile checklist opens the matching field", async ({
  page,
}) => {
  await page.goto("/athlete");
  const header = page.locator("header").first();
  await expect(header.getByRole("link", { name: "پروفایل من" })).toBeVisible();
  await expect(header.getByRole("link", { name: "جیم‌فورمی" })).toBeVisible();
  await expect(header.getByRole("link", { name: "اعلان‌ها" })).toBeVisible();
  await expect(header.getByText("خانه", { exact: true })).toHaveCount(0);
  await page.evaluate(() => {
    document.documentElement.style.setProperty("--app-safe-top", "44px");
    document.documentElement.style.setProperty("--app-safe-bottom", "34px");
  });
  await expect(header).toHaveCSS("height", "116px");
  const padding = await page
    .locator("main")
    .evaluate((node) => parseFloat(getComputedStyle(node).paddingBottom));
  expect(padding).toBeGreaterThanOrEqual(198);
  const avatar = await header
    .getByRole("link", { name: "پروفایل من" })
    .boundingBox();
  const bell = await header
    .getByRole("link", { name: "اعلان‌ها" })
    .boundingBox();
  expect(avatar!.x).toBeGreaterThan(bell!.x);
  await header.getByRole("link", { name: "پروفایل من" }).click();
  await expect(page).toHaveURL(/\/athlete\/profile$/);
  await expect(page.locator("nav[aria-label]")).toHaveCount(0);
  const checklist = page.getByRole("region", { name: "تکمیل پروفایل" });
  const trigger = checklist.getByRole("button");
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(
    checklist.getByRole("link", { name: /نام خانوادگی/ }),
  ).toHaveCount(0);
  await checklist.getByRole("link", { name: /تاریخ تولد/ }).click();
  await expect(page).toHaveURL(/field=birthdate/);
  const birthdateDialog = page.getByRole("dialog");
  await expect(birthdateDialog).toBeVisible();
  await expect(
    birthdateDialog.getByRole("listbox", { name: "روز" }),
  ).toBeVisible();
  await expect(
    birthdateDialog.getByRole("listbox", { name: "ماه" }),
  ).toBeVisible();
  await expect(
    birthdateDialog.getByRole("listbox", { name: "سال" }),
  ).toBeVisible();
  await expect(
    birthdateDialog.getByText("تاریخ تولدت را مطابق کارت ملی وارد کن."),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("sports append pages and reset when category changes", async ({
  page,
}) => {
  const seen: string[] = [];
  await page.route("**/api/v1/sports/**", (route) => {
    const url = new URL(route.request().url());
    const category = url.pathname.endsWith("sport_categories");
    const pageNumber = Number(url.searchParams.get("page") || "1");
    const filtered = url.searchParams.get("parentId");
    const featured = url.searchParams.get("limit") === "8";
    seen.push(`${filtered ?? "all"}:${pageNumber}`);
    const items = category
      ? [{ id: "team", name: "گروهی" }]
      : Array.from({ length: pageNumber === 1 ? 30 : 2 }, (_, index) => ({
          id: `${featured ? "featured" : filtered || "sport"}-${pageNumber}-${index}`,
          name: `${featured ? "پیشنهاد" : filtered ? "گروهی" : "ورزش"} ${pageNumber}-${index}`,
          slug: `sport-${pageNumber}-${index}`,
          icon: "soccer",
        }));
    return route.fulfill({
      json: {
        data: {
          items,
          page: pageNumber,
          limit: 30,
          total: category ? 1 : 32,
          totalPages: category ? 1 : 2,
        },
      },
    });
  });
  await page.goto("/discovery/sports");
  await expect(
    page.getByRole("heading", { name: "دسته‌بندی ورزش‌ها" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "نمایش بیشتر", exact: true })
    .scrollIntoViewIfNeeded();
  await expect(
    page.getByRole("heading", { name: "ورزش 2-0", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "ورزش 1-0", exact: true }),
  ).toHaveCount(1);
  await page.getByRole("button", { name: "گروهی", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "گروهی 1-0", exact: true }),
  ).toBeVisible();
  expect(seen).toContain("team:1");
  await expect(
    page.getByRole("heading", { name: "ورزش 2-0", exact: true }),
  ).toHaveCount(0);
});

test("club disclosure, audience hours, stats and gallery grid", async ({
  page,
}) => {
  await page.route("**/api/v1/public/clubs/66d400000000000000000001", (route) =>
    route.fulfill({
      json: {
        data: {
          ...publicClubFixture(),
          description: "توضیحات کامل باشگاه برای آزمون",
          weeklyHours: [
            {
              dayOfWeek: 6,
              isClosed: false,
              periods: [
                { opensAt: "08:00", closesAt: "12:00", audience: "women" },
                { opensAt: "14:00", closesAt: "22:00", audience: "men" },
              ],
            },
          ],
          gallery: [
            {
              mediaId: "gym",
              url: "/profile/cover.jpg",
              mimeType: "image/jpeg",
            },
          ],
        },
      },
    }),
  );
  await page.goto("/discovery/clubs/energy-plus-demo");
  const disclosure = page
    .locator("details")
    .filter({ hasText: "توضیحات کامل باشگاه برای آزمون" });
  await expect(disclosure.locator("p")).not.toBeVisible();
  await disclosure.locator("summary").click();
  await expect(disclosure.locator("p")).toBeVisible();
  await expect(
    page.getByRole("img", { name: "بانوان", exact: true }),
  ).toBeAttached();
  await expect(
    page.getByRole("img", { name: "آقایان", exact: true }),
  ).toBeAttached();
  await page.getByRole("button", { name: /روزهای کاری/ }).click();
  await expect(page.getByRole("region", { name: "روزهای کاری" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "باشگاه‌های مشابه" }),
  ).toBeAttached();
  await page.goto("/discovery/clubs/energy-plus-demo/gallery");
  await page.getByRole("button", { name: "نمایش شبکه‌ای" }).click();
  const grid = page.locator("div.grid.grid-cols-2");
  await expect(grid).toHaveCSS("padding-left", "12px");
});

test("sport detail uses the sport filter for clubs, coaches and classes", async ({
  page,
}) => {
  const sportId = "66d400000000000000000010";
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.route("**/api/v1/sports/sports**", (route) =>
    route.fulfill({
      json: {
        data: {
          items: [
            { id: sportId, slug: "football", name: "فوتبال", icon: "soccer" },
          ],
          page: 1,
          total: 1,
          limit: 30,
          totalPages: 1,
        },
      },
    }),
  );
  await page.goto("/discovery/sports/football");
  await expect(
    page.getByRole("heading", { name: "کلاس‌های فوتبال" }),
  ).toBeVisible();
  for (const resource of ["clubs", "coaches", "classes"]) {
    await expect
      .poll(() =>
        requests.some(
          (url) =>
            url.includes(`/catalog/${resource}?`) &&
            url.includes(`sportId=${sportId}`),
        ),
      )
      .toBe(true);
  }
});
