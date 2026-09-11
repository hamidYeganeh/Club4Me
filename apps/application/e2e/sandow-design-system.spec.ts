import { expect, test } from "@playwright/test";
import {
  createMockApiState,
  installApiMock,
  setBrowserSession,
} from "./support/mock-api";

for (const theme of ["light", "dark"] as const) {
  for (const width of [375, 820]) {
    test(`${theme} ${width}: dashboard and settings remain usable`, async ({
      page,
    }, testInfo) => {
      await installApiMock(page, createMockApiState());
      await setBrowserSession(page, true);
      await page.addInitScript(
        (value) => localStorage.setItem("theme", value),
        theme,
      );
      await page.emulateMedia({ reducedMotion: "reduce" });

      let remindersEnabled = true;
      await page.route("**/api/v1/notifications/preferences", async (route) => {
        if (route.request().method() === "PATCH")
          remindersEnabled = route.request().postDataJSON().reminders;
        await route.fulfill({
          json: {
            data: {
              bookingUpdates: true,
              reminders: remindersEnabled,
              discovery: true,
              marketing: false,
            },
          },
        });
      });
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/athlete");
      await expect(
        page.getByRole("status", { name: "Gym4Me", exact: true }),
      ).toHaveCount(0);
      await page.evaluate(() => document.fonts.ready);
      await expect(
        page.getByRole("heading", { name: "شروع سریع", exact: true }),
      ).toBeVisible();
      await expect(page.locator(".app-metric-energy")).toBeVisible();
      await expect(page.locator("html")).toHaveClass(new RegExp(theme));
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      const cards = await page
        .locator('[class*="app-metric-"]')
        .evaluateAll((elements) =>
          elements.map((element) => {
            const style = getComputedStyle(element);
            const rgb = (color: string) =>
              color
                .match(/[\d.]+/g)!
                .slice(0, 3)
                .map(Number);
            const luminance = (color: string) =>
              rgb(color)
                .map((value) => {
                  const c = value / 255;
                  return c <= 0.04045
                    ? c / 12.92
                    : ((c + 0.055) / 1.055) ** 2.4;
                })
                .reduce(
                  (sum, value, index) =>
                    sum + value * [0.2126, 0.7152, 0.0722][index]!,
                  0,
                );
            const values = [
              luminance(style.color),
              luminance(style.backgroundColor),
            ].sort((a, b) => a - b);
            return {
              title: element.querySelector("h3")?.textContent,
              height: element.clientHeight,
              scrollHeight: element.scrollHeight,
              children: Array.from(element.children).map((child) => ({
                height: child.getBoundingClientRect().height,
                scrollHeight: child.scrollHeight,
              })),
              contrast: (values[1]! + 0.05) / (values[0]! + 0.05),
              clipped: element.scrollHeight > element.clientHeight,
            };
          }),
        );
      expect(cards).toHaveLength(4);
      for (const card of cards) {
        expect(card.contrast).toBeGreaterThanOrEqual(4.5);
        expect(card.clipped, JSON.stringify(card)).toBe(false);
      }
      await page.screenshot({
        path: testInfo.outputPath(`athlete-${theme}-${width}.png`),
        fullPage: true,
      });
      await page
        .getByRole("link", { name: /ورزش مناسب خودت را پیدا کن/ })
        .click();
      await expect(page).toHaveURL((url) => url.pathname === "/discovery/search");

      await page.goto("/athlete/settings");
      await expect(
        page.getByRole("status", { name: "Gym4Me", exact: true }),
      ).toHaveCount(0);
      const reminders = page.getByRole("switch", {
        name: "یادآوری کلاس",
        exact: true,
      });
      const nextValue = !remindersEnabled;
      await expect(reminders).toBeChecked({ checked: remindersEnabled });
      const updated = page.waitForRequest(
        (request) =>
          request.url().includes("/notifications/preferences") &&
          request.method() === "PATCH",
      );
      await page
        .locator('[data-slot="switch"]')
        .filter({ has: reminders })
        .locator('[data-slot="switch-control"]')
        .click();
      expect((await updated).postDataJSON()).toMatchObject({
        reminders: nextValue,
      });
      await expect(reminders).toBeChecked({ checked: nextValue });
      await page.reload();
      await expect(reminders).toBeChecked({ checked: nextValue });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: testInfo.outputPath(`settings-${theme}-${width}.png`),
        fullPage: true,
      });
    });
  }
}

test("notification cards wrap long Persian content and preserve read and navigation actions", async ({
  page,
}, testInfo) => {
  const state = createMockApiState();
  state.notifications.push({
    id: "sandow-notification",
    type: "booking_confirmed",
    title: "رزرو کلاس تمرین گروهی شما با موفقیت تأیید شد",
    body: "برای مشاهده اطلاعات کامل باشگاه، زمان شروع جلسه و جزئیات رزرو، این اعلان را باز کنید.",
    href: "/athlete/reservations",
    readAt: null,
    createdAt: new Date().toISOString(),
  });
  await installApiMock(page, state);
  await page.route(
    "**/api/v1/notifications/sandow-notification/read",
    async (route) => {
      state.notifications[0]!.readAt = new Date().toISOString();
      await route.fulfill({ json: { data: { success: true } } });
    },
  );
  await setBrowserSession(page, true);
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/athlete/notifications");
  const notification = page.locator(".app-notification");
  await expect(notification).toBeVisible();
  expect(
    await notification.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("notification-320.png"),
    fullPage: true,
  });
  await notification.click();
  await expect(page).toHaveURL(/\/athlete\/reservations$/);
  expect(state.notifications[0]!.readAt).not.toBeNull();
});
