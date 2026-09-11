import { expect, test } from "@playwright/test";
import {
  createMockApiState,
  installApiMock,
  setBrowserSession,
} from "./support/mock-api";

test.beforeEach(async ({ page }) => {
  await installApiMock(page, createMockApiState());
  await setBrowserSession(page, true);
});

test("coach class entry without an ID offers a way to select a class", async ({
  page,
}) => {
  await page.goto("/coach/club-classes");
  await expect(
    page.getByRole("heading", { name: "کلاس باشگاه", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "مشاهده کلاس‌های من", exact: true }),
  ).toHaveAttribute("href", "/coach");
});

test("athlete primary navigation names its search destination", async ({
  page,
}) => {
  await page.goto("/athlete");
  await expect(
    page
      .getByRole("navigation", { name: "منوی اصلی" })
      .getByRole("link", { name: "جست‌وجو", exact: true }),
  ).toHaveAttribute("href", "/discovery/search");
});

test("optional analytics prompt does not cover the class enrollment flow", async ({
  page,
}) => {
  await page.goto("/discovery/classes/demo");
  await expect(page.locator("main")).toBeVisible();
  await expect(
    page.getByRole("complementary", { name: "رضایت تحلیل محصول" }),
  ).toHaveCount(0);
});

test("privacy settings expose a retry after a server outage", async ({
  page,
}) => {
  let unavailable = true;
  await page.route("**/api/v1/account/privacy", (route) =>
    unavailable
      ? route.fulfill({
          status: 503,
          json: {
            error: { code: "SERVICE_UNAVAILABLE", message: "Unavailable" },
          },
        })
      : route.fulfill({
          json: {
            data: {
              policyVersion: "2026-09-08",
              items: [],
              purposes: [
                {
                  id: "analytics",
                  required: false,
                  label: "تحلیل بهبود محصول",
                },
              ],
            },
          },
        }),
  );
  await page.goto("/athlete/settings");
  await expect(
    page.getByRole("heading", { name: "تنظیمات", exact: true }),
  ).toBeVisible();
  await expect(page.locator('[data-state="server-error"]')).toBeVisible();
  unavailable = false;
  await page.getByRole("button", { name: "تلاش دوباره", exact: true }).click();
  await expect(
    page.getByRole("switch", { name: "تحلیل بهبود محصول", exact: true }),
  ).toBeVisible();
  await expect(page.locator('[data-state="server-error"]')).toHaveCount(0);
});
