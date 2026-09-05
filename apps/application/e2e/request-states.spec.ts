import { expect, test } from "@playwright/test";

import {
  createMockApiState,
  installApiMock,
  setBrowserSession,
} from "./support/mock-api";

test("empty فقط پس از پاسخ موفق نمایش داده می‌شود", async ({ page }) => {
  const state = createMockApiState("success");
  await installApiMock(page, state);
  await setBrowserSession(page);

  await page.goto("/discovery/search");
  await page.getByLabel("جست‌وجو در دیسکاوری").fill("یوگا");

  await expect(page.getByText("نتیجه‌ای پیدا نشد.")).toBeVisible();
  await expect(page.locator("[data-state]")).toHaveCount(0);
});

test("server error از empty جداست", async ({ page }) => {
  const state = createMockApiState("server-error");
  await installApiMock(page, state);
  await setBrowserSession(page);

  await page.goto("/discovery/search");
  await page.getByLabel("جست‌وجو در دیسکاوری").fill("یوگا");

  await expect(page.locator('[data-state="server-error"]')).toBeVisible();
  await expect(page.getByText("نتیجه‌ای پیدا نشد.")).toHaveCount(0);
});

test("permission denied پیام مجوز مستقل دارد", async ({ page }) => {
  const state = createMockApiState("permission-denied");
  await installApiMock(page, state);
  await setBrowserSession(page);

  await page.goto("/discovery/search");
  await page.getByLabel("جست‌وجو در دیسکاوری").fill("یوگا");

  await expect(
    page.locator('[data-state="permission-denied"]'),
  ).toBeVisible();
});

test("timeout پیام کندی مستقل دارد", async ({ page }) => {
  const state = createMockApiState("timeout");
  await installApiMock(page, state);
  await setBrowserSession(page);

  await page.goto("/discovery/search");
  await page.getByLabel("جست‌وجو در دیسکاوری").fill("یوگا");

  await expect(page.locator('[data-state="timeout"]')).toBeVisible();
});

test("offline از خطای سرور جداست", async ({ page, context }) => {
  const state = createMockApiState();
  await installApiMock(page, state);
  await setBrowserSession(page);

  await page.goto("/discovery/search");
  await context.setOffline(true);
  await page.getByLabel("جست‌وجو در دیسکاوری").fill("یوگا");

  await expect(page.locator('[data-state="offline"]')).toBeVisible();
  await context.setOffline(false);
});
