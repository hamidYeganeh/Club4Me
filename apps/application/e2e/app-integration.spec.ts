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

test("account outage preserves the session and retry restores the screen", async ({
  page,
}) => {
  let unavailable = true;
  await page.route("**/api/v1/account/me", async (route) => {
    if (!unavailable) return route.fallback();
    return route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        error: { code: "SERVICE_UNAVAILABLE", message: "Unavailable" },
      }),
    });
  });
  await page.goto("/athlete/settings");
  await expect(page.locator('[data-state="server-error"]')).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("gym4me.accessToken")),
  ).toBe("e2e-access-token");
  unavailable = false;
  await page.getByRole("button", { name: "تلاش دوباره" }).click();
  await expect(
    page.getByRole("heading", { name: "تنظیمات", exact: true }),
  ).toBeVisible();
});

test("coach discovery navigation returns to coach screens", async ({
  page,
}) => {
  await page.goto("/coach/profile");
  await page.locator('nav a[href="/discovery"]').click();
  await expect(page).toHaveURL(/\/discovery$/);
  await expect(page.locator('nav a[href="/coach/profile"]')).toBeVisible();
  await page.locator('nav a[href="/coach/profile"]').click();
  await expect(page).toHaveURL(/\/coach\/profile$/);
});

test("wallet failure has retry and a working settings return", async ({
  page,
}) => {
  await page.route("**/api/v1/benefits/wallet", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        error: { code: "SERVICE_UNAVAILABLE", message: "Unavailable" },
      }),
    }),
  );
  await page.goto("/athlete/benefits");
  await expect(page.locator('[data-state="server-error"]')).toBeVisible();
  await expect(page.getByText("اعتبار قابل استفاده")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "فیلتر", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "بازگشت", exact: true }).click();
  await expect(page).toHaveURL(/\/athlete\/settings$/);
});

test("support errors are distinct from an empty inbox", async ({ page }) => {
  await page.route("**/api/v1/support/tickets", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        error: { code: "SERVICE_UNAVAILABLE", message: "Unavailable" },
      }),
    }),
  );
  await page.goto("/athlete/support");
  await expect(page.locator('[data-state="server-error"]')).toBeVisible();
  await expect(page.getByText("هنوز درخواستی ثبت نکرده‌اید")).toHaveCount(0);
});

test("mobile screens share headers, fit the viewport and connect favorites to discovery", async ({
  page,
}, testInfo) => {
  await page.route("**/api/v1/benefits/wallet", (route) =>
    route.fulfill({
      json: {
        data: { availableAmount: 250000, reservedAmount: 0, transactions: [] },
      },
    }),
  );
  await page.route("**/api/v1/benefits/referral-code", (route) =>
    route.fulfill({ json: { data: { code: "GYM12345" } } }),
  );
  for (const [name, path, title] of [
    ["settings", "/athlete/settings", "تنظیمات"],
    ["support", "/athlete/support", "پشتیبانی"],
    ["wallet", "/athlete/benefits", "کیف پول و دعوت دوستان"],
    ["favorites", "/athlete/favorites", "ذخیره‌شده‌ها"],
  ]) {
    await page.goto(path!);
    await expect(
      page.getByRole("heading", { name: title!, exact: true }),
    ).toBeVisible();
    await expect(page.locator("main header")).toHaveCSS(
      "border-bottom-right-radius",
      "32px",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await expect(
      page.getByRole("status", { name: "Gym4Me", exact: true }),
    ).toHaveCount(0);
    await page.screenshot({
      path: testInfo.outputPath(`${name}.png`),
      fullPage: true,
    });
  }
  await page.getByRole("link", { name: "کشف باشگاه‌ها و کلاس‌ها" }).click();
  await expect(page).toHaveURL(/\/discovery$/);
  await page.screenshot({
    path: testInfo.outputPath("discovery.png"),
    fullPage: true,
  });
  await page.goto("/discovery/clubs/energy-plus-demo");
  await expect(
    page.getByRole("button", { name: "همین حالا رزرو کن", exact: true }).last(),
  ).toBeVisible();
  await expect(
    page.getByRole("status", { name: "Gym4Me", exact: true }),
  ).toHaveCount(0);
  await page.screenshot({
    path: testInfo.outputPath("club-details.png"),
    fullPage: true,
  });
});

test("notifications without a destination can be read without a dead link", async ({
  page,
}) => {
  let readAt: string | null = null;
  await page.route("**/api/v1/notifications", (route) =>
    route.fulfill({
      json: {
        data: {
          items: [
            {
              id: "notice-1",
              type: "booking_reminder",
              title: "یادآوری تمرین",
              body: "زمان تمرین نزدیک است",
              href: null,
              readAt,
              createdAt: new Date().toISOString(),
            },
          ],
        },
      },
    }),
  );
  await page.route("**/api/v1/notifications/notice-1/read", (route) => {
    readAt = new Date().toISOString();
    return route.fulfill({ json: { data: { success: true } } });
  });
  await page.goto("/athlete/notifications");
  await page.getByRole("button", { name: /یادآوری تمرین/ }).click();
  await expect(page.getByText("اعلان جدیدی نداری")).toBeVisible();
  await expect(page).toHaveURL(/\/athlete\/notifications$/);
  await page.getByRole("button", { name: "خوانده‌شده", exact: true }).click();
  await expect(page.getByText("یادآوری تمرین", { exact: true })).toBeVisible();
});

test("notification switches are visible and save preferences", async ({
  page,
}) => {
  let bookingUpdates = true;
  await page.route("**/api/v1/notifications/preferences", async (route) => {
    if (route.request().method() === "PATCH")
      bookingUpdates = route.request().postDataJSON().bookingUpdates;
    return route.fulfill({
      json: {
        data: {
          bookingUpdates,
          reminders: true,
          discovery: true,
          marketing: false,
        },
      },
    });
  });
  await page.goto("/athlete/settings");
  const toggle = page.getByRole("switch", {
    name: "تغییرات رزرو",
    exact: true,
  });
  const control = page
    .locator('[data-slot="switch"]')
    .filter({ has: toggle })
    .locator('[data-slot="switch-control"]');
  await expect(control).toBeVisible();
  await expect(toggle).toBeChecked();
  await control.click();
  await expect(toggle).not.toBeChecked();
  expect(bookingUpdates).toBe(false);
});
