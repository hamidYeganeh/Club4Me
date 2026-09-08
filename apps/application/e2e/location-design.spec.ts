import { expect, test } from "@playwright/test";
import {
  createMockApiState,
  installApiMock,
  setBrowserSession,
} from "./support/mock-api";
for (const theme of ["light", "dark"] as const) {
  test(`location discovery ${theme}`, async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    await installApiMock(page, createMockApiState());
    await setBrowserSession(page, true);
    await page.addInitScript(
      (value) => localStorage.setItem("theme", value),
      theme,
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const [resource, item] of [
      [
        "provinces",
        {
          id: "province",
          slug: "tehran",
          name: "تهران",
          imageUrl: "/profile/cover.jpg",
        },
      ],
      [
        "cities",
        {
          id: "city",
          slug: "tehran",
          name: "تهران",
          imageUrl: "/profile/cover.jpg",
          clubsCount: 1,
        },
      ],
      [
        "districts",
        {
          id: "district",
          slug: "saadat",
          name: "سعادت‌آباد",
          imageUrl: "/profile/cover.jpg",
        },
      ],
    ] as const)
      await page.route(`**/api/v1/geography/${resource}*`, (route) =>
        route.fulfill({
          json: { data: { items: [item], total: 1, page: 1, totalPages: 1 } },
        }),
      );
    for (const width of [375, 820]) {
      await page.setViewportSize({ width, height: 900 });
      for (const [name, path, title] of [
        ["province", "/discovery/province/tehran", "ورزش در تهران"],
        ["city", "/discovery/city/tehran", "باشگاه‌های تهران"],
        [
          "clubs",
          "/discovery/clubs?cityId=city",
          "جای تمرین بعدی‌ات را پیدا کن",
        ],
      ]) {
        await page.goto(path!);
        await expect(
          page.getByRole("heading", { name: title!, exact: true }),
        ).toBeVisible();
        await expect(
          page.getByRole("status", { name: "Gym4Me", exact: true }),
        ).toHaveCount(0);
        await expect(page.locator("header")).toHaveCount(1);
        await expect(
          page
            .locator("header")
            .getByRole("button", { name: "بازگشت", exact: true }),
        ).toBeVisible();
        await expect(page.locator("[data-hero-scrim]")).toHaveCount(1);
        await page.evaluate(() => document.fonts.ready);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        await page.screenshot({
          path: testInfo.outputPath(`${name}-${theme}-${width}.png`),
        });
      }
    }
    await page.goto("/discovery/city/tehran");
    await page
      .getByRole("link", { name: "مشاهده همه باشگاه‌های تهران" })
      .click();
    await expect(page).toHaveURL(/cityId=city/);
    await page.goto("/discovery/province/tehran");
    await page.locator('a[href="/discovery/city/tehran"]').first().click();
    await expect(
      page.getByRole("heading", { name: "باشگاه‌های تهران", exact: true }),
    ).toBeVisible();
  });
}
