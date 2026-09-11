import { expect, test } from "@playwright/test";
import { createMockApiState, installApiMock } from "./support/mock-api";
const userId = "66d100000000000000000001";
const token = `e30.${Buffer.from(JSON.stringify({ sub: userId })).toString("base64url")}.mock`;
test.beforeEach(async ({ page }) => {
  const state = createMockApiState(); state.user.roles = ["athlete", "coach"];
  await installApiMock(page, state);
  await page.addInitScript((token) => {
    localStorage.setItem("gym4me.accessToken", token); localStorage.setItem("gym4me.refreshToken", "test-refresh");
    localStorage.setItem("gym4me.welcome.seen", "1"); sessionStorage.setItem("gym4me.splash.shown", "1");
  }, token);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/v1/coach/profile", (r) => r.fulfill({ json: { data: { id: userId, displayName: "مربی آزمایشی", reviewStatus: "approved" } } }));
});
test("role survives reload without crossing accounts", async ({ page }) => {
  await page.goto("/coach"); await expect(page.getByRole("heading", { name: "میز کار امروز" })).toBeVisible();
  await page.getByRole("navigation", { name: "منوی اصلی" }).getByRole("link", { name: "کشف", exact: true }).click();
  await page.reload();
  const home = page.getByRole("navigation", { name: "منوی اصلی" }).getByRole("link", { name: "خانه", exact: true });
  await expect(home).toHaveAttribute("href", "/coach");
  await page.evaluate(() => {
    localStorage.setItem("gym4me.accessToken", `e30.${btoa(JSON.stringify({ sub: "another-account" }))}.mock`);
    window.dispatchEvent(new StorageEvent("storage"));
  });
  await expect(home).toHaveAttribute("href", "/athlete");
});
test("next session has a detail destination and fits both themes", async ({ page }, info) => {
  await page.route("**/api/v1/athlete/bookings", (r) => r.fulfill({ json: { data: { items: [{ id: "booking-next", sessionTitle: "تمرین قدرت با مربی", sessionStartsAt: new Date(Date.now() + 3600000).toISOString(), sessionEndsAt: new Date(Date.now() + 7200000).toISOString(), status: "confirmed", paymentStatus: "paid", priceSnapshot: { amount: 1200000, currency: "IRR" } }] } } }));
  await page.setViewportSize({ width: 375, height: 900 }); await page.goto("/athlete");
  const action = page.getByRole("region", { name: "فعالیت پیش رو" });
  await expect(action.getByRole("heading", { name: "تمرین قدرت با مربی" })).toBeVisible();
  await expect(action.getByRole("link")).toHaveAttribute("href", "/athlete/reservations/booking-next?source=coach");
  await expect(page.getByRole("group", { name: "انتخاب روز" }).getByRole("button")).toHaveCount(7);
  await page.getByRole("button", { name: "فعلاً نه", exact: true }).click();
  for (const theme of ["light", "dark"]) {
    await page.evaluate((theme) => { document.documentElement.classList.toggle("dark", theme === "dark"); document.documentElement.setAttribute("data-theme", theme); }, theme);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath(`today-${theme}-375.png`), fullPage: true });
  }
});
test("coach outage has retry instead of an empty profile", async ({ page }) => {
  let failed = true;
  await page.route("**/api/v1/coach/profile", (r) => failed ? r.fulfill({ status: 503, json: { error: { code: "UNAVAILABLE", message: "Unavailable" } } }) : r.fulfill({ json: { data: { id: userId, displayName: "مربی آزمایشی", reviewStatus: "approved" } } }));
  await page.goto("/coach"); await expect(page.getByRole("heading", { name: "دریافت میز کار انجام نشد" })).toBeVisible();
  failed = false; await page.getByRole("button", { name: "تلاش دوباره", exact: true }).click();
  await expect(page.getByRole("heading", { name: "میز کار امروز" })).toBeVisible();
});
test("social login accepts Persian phone digits and allows correction", async ({ page }) => {
  await page.route("**/api/v1/account/auth/social/exchange", (r) => r.fulfill({ json: { data: { linked: false, linkToken: "test-link", returnTo: "/athlete", profile: { provider: "test" } } } }));
  await page.goto("/auth/social/callback?ticket=test");
  await page.getByRole("textbox", { name: "شماره موبایل" }).fill("۰۹۱۲۳۴۵۶۷۸۹");
  const sent = page.waitForRequest((r) => r.url().endsWith("/social/link/otp"));
  await page.getByRole("button", { name: "ارسال کد", exact: true }).click(); expect((await sent).postDataJSON().phone).toBe("09123456789");
  await expect(page.getByRole("button", { name: /ارسال مجدد تا/ })).toBeDisabled();
  await page.getByRole("button", { name: "اصلاح شماره" }).click(); await expect(page.getByRole("textbox", { name: "شماره موبایل" })).toBeEnabled();
  await page.goto("/auth/social/callback"); await expect(page.getByRole("alert")).toContainText("منقضی یا نامعتبر");
  await expect(page.getByRole("link", { name: "بازگشت به ورود" })).toHaveAttribute("href", "/auth");
});
