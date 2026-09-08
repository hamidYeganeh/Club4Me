import { expect, test, type Page } from "@playwright/test";
import {
  createMockApiState,
  installApiMock,
  setBrowserSession,
} from "./support/mock-api";

async function ready(page: Page) {
  await expect(page.locator("[data-auth-intro]")).toBeVisible();
  await expect(page.locator("header:visible")).toHaveCount(1);
  await expect(page.locator("[data-hero-scrim]:visible")).toHaveCount(1);
  await expect(page.locator('[role="status"].bg-accent')).toHaveCount(0);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      Array.from(document.images).map((image) =>
        image.decode().catch(() => {}),
      ),
    );
    document
      .querySelectorAll("main, .app-scroll-root")
      .forEach((el) => el.scrollTo(0, 0));
    await new Promise(requestAnimationFrame);
  });
  const bounds = await page
    .locator("form [data-active]")
    .evaluateAll((elements) =>
      elements.map((el) => {
        const r = el.getBoundingClientRect();
        const f = el.closest("form")!.getBoundingClientRect();
        return { left: r.left, right: r.right, start: f.left, end: f.right };
      }),
    );
  for (const bound of bounds) {
    expect(bound.left).toBeGreaterThanOrEqual(bound.start);
    expect(bound.right).toBeLessThanOrEqual(bound.end);
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}
for (const theme of ["light", "dark"] as const) {
  test(`auth pages ${theme}: forms, role requests and responsive design`, async ({
    page,
  }, info) => {
    test.setTimeout(180_000);
    const state = createMockApiState();
    await installApiMock(page, state);
    await setBrowserSession(page);
    await page.addInitScript(
      (value) => localStorage.setItem("theme", value),
      theme,
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    for (const width of [375, 820]) {
      await page.setViewportSize({ width, height: 900 });
      for (const [name, path] of [
        ["login", "/auth/login"],
        ["otp", "/auth/otp"],
        ["otp-confirm", "/auth/otp/confirm?phone=09120000001"],
        ["forgot", "/auth/forgot-password"],
        ["forgot-confirm", "/auth/forgot-password/confirm?phone=09120000001"],
      ]) {
        await page.goto(path!);
        await ready(page);
        await expect(page.locator("form")).toBeVisible();
        await page.screenshot({
          path: info.outputPath(`${name}-${theme}-${width}.png`),
        });
        if (name!.includes("confirm")) {
          await page.locator('input[name="code"]').pressSequentially("12");
          await expect(page.locator('form [data-filled="true"]')).toHaveCount(
            2,
          );
        }
      }
    }
    await setBrowserSession(page, true);
    await page.route("**/api/v1/account/role-requests**", (route) =>
      route.fulfill({ json: { data: { items: [] } } }),
    );
    for (const width of [375, 820]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/auth/roles?manage=1");
      await ready(page);
      await page.screenshot({
        path: info.outputPath(`roles-${theme}-${width}.png`),
      });
      await page.getByRole("button", { name: /مربی/ }).click();
      await expect(page).toHaveURL(/\/auth\/roles\/coach$/);
      await ready(page);
      await expect(page.locator('form input[name="specialty"]')).toBeVisible();
      await page.screenshot({
        path: info.outputPath(`coach-request-${theme}-${width}.png`),
      });
      await page.locator("header:visible button").click();
      await page.getByRole("button", { name: /مالک|باشگاه.?دار|صاحب/ }).click();
      await ready(page);
      await page.screenshot({
        path: info.outputPath(`owner-request-${theme}-${width}.png`),
      });
    }
    expect(errors).toEqual([]);
  });
  test(`set password ${theme}: protected form and keyboard layout`, async ({
    page,
  }, info) => {
    const state = createMockApiState();
    state.user.hasPassword = false;
    state.user.roles = ["coach"];
    await installApiMock(page, state);
    await setBrowserSession(page, true);
    await page.addInitScript(
      (value) => localStorage.setItem("theme", value),
      theme,
    );
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto("/auth/set-password");
    await ready(page);
    await page.screenshot({
      path: info.outputPath(`set-password-${theme}-375.png`),
    });
    await page.locator('input[type="password"]').first().fill("Demo@1405");
    await page.evaluate(() => {
      Object.defineProperty(window.visualViewport!, "height", {
        configurable: true,
        get: () => document.documentElement.clientHeight - 320,
      });
      window.visualViewport!.dispatchEvent(new Event("resize"));
    });
    await expect(page.locator("html")).toHaveAttribute(
      "data-keyboard-open",
      "",
    );
    await expect(page.locator("[data-hero-scrim]:visible")).toHaveCount(0);
    await expect(page.locator('input[type="password"]').first()).toHaveValue(
      "Demo@1405",
    );
    await expect(page.locator("form")).toBeVisible();
  });
}
