import { expect, test } from "@playwright/test";
import type { PublicCatalogCoach } from "@api/discovery";
import {
  createMockApiState,
  installApiMock,
  setBrowserSession,
} from "./support/mock-api";
const coach: PublicCatalogCoach = {
  id: "64a000000000000000000001",
  slug: "64a000000000000000000001",
  displayName: "نگار احمدی",
  shortBio: "تمرین قدرتی و اصلاح حرکت؛ همراه تو برای ساختن عادت‌های ماندگار.",
  avatarMediaId: null,
  coverMediaId: null,
  imageUrl: "/profile/avatar.jpg",
  experienceYears: 8,
  serviceModes: ["club", "online"],
  averageRating: 4.8,
  reviewsCount: 24,
  contact: {},
  portfolio: [],
  specialties: [
    {
      title: "تمرین قدرتی",
      description: "برنامه متناسب با سطح آمادگی و هدف هر ورزشکار",
    },
  ],
  trainingStyles: [],
  experienceSummary: "هشت سال تجربهٔ مربیگری فردی و گروهی",
  experience: [],
  faqs: [],
};

test.beforeEach(async ({ page }) => {
  await installApiMock(page, createMockApiState());
  await setBrowserSession(page, true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/v1/discovery/coaches/sections", (route) =>
    route.fulfill({ json: { data: [] } }),
  );
});
test("class filters can be reset from empty results", async ({ page }) => {
  await page.route("**/api/v1/discovery/catalog/search**", (route) =>
    route.fulfill({
      json: {
        data: { classes: [], businessClasses: [], total: 0, totalPages: 0 },
      },
    }),
  );
  await page.goto("/discovery/classes");
  await page
    .getByRole("button", { name: "فیلتر کلاس‌ها", exact: true })
    .click();
  await page.getByLabel("حداکثر شهریه (ریال)").fill("0");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /نمایش.*نت/ })
    .click();
  await expect(page.getByLabel("۱ فیلتر فعال")).toBeVisible();
  await page
    .getByRole("button", { name: "پاک‌کردن جست‌وجو و فیلترها", exact: true })
    .click();
  await expect(page.getByLabel("۱ فیلتر فعال")).toHaveCount(0);
});
test("saved locations recover from empty search and save selection", async ({
  page,
}) => {
  let saved = false;
  await page.route("**/api/v1/me/locations", (route) =>
    route.fulfill({
      json: {
        data: {
          items: [
            {
              id: "home",
              title: "خانه",
              address: "تهران، خیابان سرو",
              isDefault: true,
            },
            {
              id: "work",
              title: "محل کار",
              address: "تهران، میدان ونک",
              isDefault: false,
            },
          ],
        },
      },
    }),
  );
  await page.route("**/api/v1/me/locations/work/default", (route) => {
    saved = true;
    return route.fulfill({ json: { data: { id: "work", isDefault: true } } });
  });
  await page.goto("/athlete/profile/locations");
  await page.getByRole("searchbox").fill("پیدانشدنی");
  await expect(
    page.getByText("لوکیشنی پیدا نشد", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "پاک‌کردن جست‌وجو و فیلترها", exact: true })
    .click();
  await page.getByRole("radio", { name: /محل کار/ }).check();
  await page.getByRole("button", { name: "تأیید لوکیشن انتخاب‌شده" }).click();
  await expect.poll(() => saved).toBe(true);
});
test("coach action bar and section navigation work at mobile and tablet widths", async ({
  page,
}, testInfo) => {
  test.setTimeout(120000);
  await page.route(`**/api/v1/discovery/catalog/coaches/${coach.id}`, (route) =>
    route.fulfill({ json: { data: coach } }),
  );
  await page.route(`**/api/v1/public/coaches/${coach.id}/sessions`, (route) =>
    route.fulfill({ json: { data: { items: [] } } }),
  );
  for (const theme of ["light", "dark"]) {
    await page.addInitScript(
      (value) => localStorage.setItem("theme", value),
      theme,
    );
    for (const width of [375, 820]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/discovery/coaches/${coach.id}`);
      await expect(
        page.getByRole("heading", { name: coach.displayName, exact: true }),
      ).toBeVisible();
      const bar = page.getByRole("complementary", {
        name: "رزرو مربی",
        exact: true,
      });
      await expect(bar).toBeVisible();
      expect(
        await bar.evaluate((el) => el.parentElement === document.body),
      ).toBe(true);
      await page
        .getByRole("navigation", { name: "بخش‌های پروفایل مربی" })
        .getByRole("link", { name: "سانس‌ها", exact: true })
        .click();
      await expect(
        page.getByText("سانس‌های قابل رزرو", { exact: true }),
      ).toBeInViewport();
      const box = await bar.boundingBox();
      expect(Math.abs(box!.y + box!.height - 900)).toBeLessThanOrEqual(1);
      expect(
        await page
          .locator(".coach-detail")
          .evaluate((el) => el.scrollWidth <= el.clientWidth),
      ).toBe(true);
      await page.locator(".app-scroll-root").evaluate((el) => {
        el.scrollTop = 0;
      });
      await page.screenshot({
        path: testInfo.outputPath(`coach-${theme}-${width}.png`),
      });
    }
  }
});
test("city search has a recoverable empty state", async ({ page }) => {
  await page.route("**/api/v1/geography/cities**", (route) =>
    route.fulfill({ json: { data: { items: [], total: 0, totalPages: 0 } } }),
  );
  await page.goto("/discovery/cities");
  await page.getByRole("searchbox").fill("پیدانشدنی");
  await expect(page.getByText("شهری پیدا نشد", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "پاک‌کردن جست‌وجو", exact: true })
    .last()
    .click();
  await expect(page.getByRole("searchbox")).toHaveValue("");
});

test("browse pages show useful results in both themes without horizontal overflow", async ({
  page,
}, testInfo) => {
  test.setTimeout(120000);
  await page.route(/\/api\/v1\/discovery\/coaches\?/, (route) =>
    route.fulfill({
      json: {
        data: {
          items: [{ ...coach, reviewsCount: 0, averageRating: 0 }],
          total: 1,
          totalPages: 1,
        },
      },
    }),
  );
  await page.route("**/api/v1/discovery/catalog/search**", (route) =>
    route.fulfill({
      json: {
        data: {
          classes: [
            {
              id: "strength",
              slug: "strength",
              title: "تمرین قدرتی گروهی",
              description: "تمرین متناسب با سطح آمادگی شما",
              imageUrl: "/profile/cover.jpg",
              capacity: 12,
              enrollmentCount: 12,
              deliveryMode: "club",
              price: { amount: 24000000, currency: "IRR" },
              courseStartAt: "2027-01-10T14:30:00Z",
            },
          ],
          businessClasses: [],
          total: 1,
          totalPages: 1,
        },
      },
    }),
  );
  await page.route("**/api/v1/geography/cities**", (route) =>
    route.fulfill({
      json: {
        data: {
          items: [
            { id: "tehran", slug: "tehran", name: "تهران", clubsCount: 12 },
          ],
          total: 1,
          totalPages: 1,
        },
      },
    }),
  );
  for (const theme of ["light", "dark"]) {
    await page.addInitScript(
      (value) => localStorage.setItem("theme", value),
      theme,
    );
    for (const width of [375, 820]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of ["classes", "coaches", "cities"]) {
        await page.goto(`/discovery/${route}`);
        await expect(page.getByRole("searchbox")).toBeVisible();
        if (route === "classes")
          await expect(
            page.getByText("ظرفیت تکمیل", { exact: true }),
          ).toBeVisible();
        if (route === "coaches")
          await expect(page.getByText(/بدون نظر/)).toBeVisible();
        if (route === "cities")
          await expect(
            page.getByRole("link", { name: /تهران/ }).first(),
          ).toBeVisible();
        expect(
          await page
            .locator("main")
            .evaluate((el) => el.scrollWidth <= el.clientWidth),
        ).toBe(true);
        await expect(
          page.getByRole("status", { name: "Club4Me", exact: true }),
        ).toHaveCount(0);
        await page.evaluate(() => document.fonts.ready);
        await page.screenshot({
          path: testInfo.outputPath(`${route}-${theme}-${width}.png`),
        });
      }
    }
  }
});
