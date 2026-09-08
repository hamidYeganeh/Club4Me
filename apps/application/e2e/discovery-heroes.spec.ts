import { expect, test } from "@playwright/test";
import {
  createMockApiState,
  installApiMock,
  setBrowserSession,
} from "./support/mock-api";

for (const theme of ["light", "dark"] as const) {
  test(`discovery image heroes ${theme}`, async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    await installApiMock(page, createMockApiState());
    await setBrowserSession(page, true);
    await page.addInitScript(
      (value) => localStorage.setItem("theme", value),
      theme,
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    const article = {
      id: "64a000000000000000000003",
      slug: "training",
      title: "ریکاوری؛ بخش مهم برنامه تمرین",
      excerpt: "بعد از یک تمرین خوب، به بدن فرصت بازسازی بده.",
      coverImageUrl: "/profile/cover.jpg",
      authorName: "تحریریه جیم‌فورمی",
      readTimeMinutes: 4,
      bodyHtml:
        "<h2>با آرامش ادامه بده</h2><p>خواب کافی و استراحت بخشی از برنامه تمرین هستند.</p>",
    };
    await page.route("**/api/v1/discovery/catalog/articles/training", (route) =>
      route.fulfill({ json: { data: article } }),
    );
    await page.route("**/api/v1/discovery/catalog/articles*", (route) =>
      route.fulfill({
        json: {
          data: route.request().url().includes("/training")
            ? article
            : { items: [article], total: 1, page: 1, totalPages: 1 },
        },
      }),
    );
    await page.route("**/api/v1/discovery/coaches/sections", (route) =>
      route.fulfill({ json: { data: [] } }),
    );
    await page.route("**/api/v1/discovery/coaches?*", (route) =>
      route.fulfill({
        json: {
          data: {
            items: [
              {
                id: "coach",
                slug: "coach",
                displayName: "نگار احمدی",
                shortBio: "تمرین قدرتی و اصلاح حرکت",
                imageUrl: "/profile/avatar.jpg",
                averageRating: 4.8,
                experienceYears: 8,
              },
            ],
            total: 1,
            page: 1,
            totalPages: 1,
          },
        },
      }),
    );
    await page.route("**/api/v1/discovery/catalog/search?*", (route) =>
      route.fulfill({
        json: {
          data: {
            classes: [
              {
                id: "strength",
                slug: "strength",
                title: "قدرت و آمادگی جسمانی",
                description: "تمرین گروهی برای قوی‌تر شدن",
                imageUrl: "/profile/cover.jpg",
                deliveryMode: "club",
                capacity: 16,
                enrollmentCount: 12,
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
    for (const width of [375, 820]) {
      await page.setViewportSize({ width, height: 900 });
      for (const [name, path, title] of [
        ["browse-coaches", "/discovery/coaches", "همراه مسیر ورزشی تو"],
        ["browse-classes", "/discovery/classes", "وقت یک تمرین تازه است."],
        [
          "browse-articles",
          "/discovery/articles",
          "دانش کاربردی برای مسیر ورزشی تو",
        ],
        ["article", "/discovery/articles/training", article.title],
      ]) {
        await page.goto(path!);
        await expect(
          page.getByRole("heading", { name: title!, exact: true }),
        ).toBeVisible();
        await expect(
          page.getByRole("status", { name: "Gym4Me", exact: true }),
        ).toHaveCount(0);
        await page.evaluate(() => document.fonts.ready);
        await page.evaluate(() => {
          document
            .querySelectorAll(".app-scroll-root, main")
            .forEach((el) => el.scrollTo(0, 0));
        });
        await expect(page.locator("[data-hero-scrim]")).toHaveCount(1);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        const layers = await page
          .locator("[data-hero-scrim] > div:first-child > div")
          .evaluateAll((elements) =>
            elements.map((el) => ({
              blur: getComputedStyle(el).backdropFilter,
              mask: getComputedStyle(el).maskImage,
            })),
          );
        expect(layers.map((layer) => layer.blur)).toEqual([
          "blur(2px)",
          "blur(4px)",
          "blur(8px)",
          "blur(16px)",
        ]);
        expect(
          layers.every((layer) => layer.mask.includes("linear-gradient")),
        ).toBe(true);
        await page.screenshot({
          path: testInfo.outputPath(`${name}-${theme}-${width}.png`),
        });
      }
    }
    await page.goto("/discovery/articles");
    await page
      .getByRole("link", { name: new RegExp(article.title) })
      .first()
      .click();
    await expect(
      page.getByRole("heading", { name: article.title, exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "بازگشت به مقالات" }).click();
    await expect(page).toHaveURL(/\/discovery\/articles$/);
  });
}
