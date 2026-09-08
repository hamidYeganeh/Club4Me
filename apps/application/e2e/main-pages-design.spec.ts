import { expect, test } from "@playwright/test";
import {
  createMockApiState,
  reservationFixture,
  installApiMock,
  setBrowserSession,
} from "./support/mock-api";
for (const theme of ["light", "dark"] as const) {
  test(`main pages ${theme}: shared design and actions`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(180_000);
    const state = createMockApiState();
    state.user.roles = ["athlete", "coach"];
    state.reservation = reservationFixture(
      state.startsAt,
      state.endsAt,
      "reserved",
      "paid",
    );
    await installApiMock(page, state);
    await setBrowserSession(page, true);
    await page.addInitScript(
      (value) => localStorage.setItem("theme", value),
      theme,
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.route("**/api/v1/benefits/wallet", (route) =>
      route.fulfill({
        json: {
          data: {
            availableAmount: 1200000,
            reservedAmount: 0,
            transactions: [],
          },
        },
      }),
    );
    await page.route("**/api/v1/benefits/referral-code", (route) =>
      route.fulfill({ json: { data: { code: "GYM-DEMO" } } }),
    );
    await page.route("**/api/v1/coach/**", (route) =>
      route.fulfill({
        json: {
          data: new URL(route.request().url()).pathname.endsWith("/profile")
            ? { displayName: "نگار احمدی", reviewStatus: "approved" }
            : { items: [] },
        },
      }),
    );
    for (const width of [375, 820]) {
      await page.setViewportSize({ width, height: 900 });
      for (const [name, path, title] of [
        ["home", "/athlete", "هر روز، یک قدم جلوتر"],
        ["coach-home", "/coach", "همراه پیشرفت شاگردهایت"],
        ["settings", "/athlete/settings", "جیم‌فورمی، به سلیقهٔ تو"],
        ["reservations", "/athlete/reservations", "برنامه تمرینت، یک‌جا"],
        ["notifications", "/athlete/notifications", "از برنامه‌ات باخبر بمان"],
        ["memberships", "/athlete/memberships", "مسیر تمرینت ادامه دارد"],
        ["benefits", "/athlete/benefits", "با هم ورزش کنیم"],
        ["support", "/athlete/support", "کنارت هستیم"],
        ["classes", "/athlete/classes", "برای جلسهٔ بعد آماده شو"],
      ]) {
        await page.goto(path!);
        await expect(
          page.getByRole("heading", { name: title!, exact: true }),
        ).toBeVisible();
        await expect(
          page.getByRole("status", { name: "Gym4Me", exact: true }),
        ).toHaveCount(0);
        await expect(page.locator("header")).toHaveCount(1);
        await expect(page.locator("[data-hero-scrim]")).toHaveCount(1);
        await page.evaluate(() => document.fonts.ready);
        await page.evaluate(() => {
          document
            .querySelectorAll(".app-scroll-root, main")
            .forEach((el) => el.scrollTo(0, 0));
        });
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
    await page.goto("/athlete/support");
    await page
      .getByRole("link", { name: "ثبت تیکت جدید", exact: true })
      .click();
    await expect(page.locator("form")).toBeVisible();
    await page.goto("/athlete/memberships");
    await page.getByRole("button", { name: "سوابق", exact: true }).click();
    await expect(
      page.getByText("سابقه‌ای وجود ندارد.", { exact: true }),
    ).toBeVisible();
  });
}
