import { expect, test } from "@playwright/test";
import {
  createMockApiState,
  installApiMock,
  setBrowserSession,
  publicClubFixture,
} from "./support/mock-api";

test("club hero preserves booking navigation", async ({ page }, testInfo) => {
  await installApiMock(page, createMockApiState());
  await setBrowserSession(page, true);
  await page.addInitScript(() => localStorage.setItem("theme", "dark"));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/v1/public/clubs/66d400000000000000000001", (route) =>
    route.fulfill({
      json: {
        data: {
          ...publicClubFixture(),
          gallery: [
            { id: "gym", url: "/profile/cover.jpg", mimeType: "image/jpeg" },
          ],
        },
      },
    }),
  );
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/discovery/clubs/energy-plus-demo");
  await expect(page.locator("[data-hero-scrim]")).toBeVisible();
  await expect(
    page.getByRole("status", { name: "Gym4Me", exact: true }),
  ).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: testInfo.outputPath("club-dark-375.png") });
  await page
    .getByRole("button", { name: "همین حالا رزرو کن", exact: true })
    .last()
    .click();
  await expect(page).toHaveURL(/\/slots/);
});
