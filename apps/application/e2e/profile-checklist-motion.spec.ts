import { expect, test } from "@playwright/test";
import { createMockApiState, installApiMock, setBrowserSession } from "./support/mock-api";

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test(`profile step markers move without duplicate numbering (${reducedMotion})`, async ({ page }) => {
    const state = createMockApiState();
    state.user.firstName = "کاربر";
    state.user.lastName = "";
    await installApiMock(page, state);
    await setBrowserSession(page, true);
    await page.emulateMedia({ reducedMotion });
    await page.goto("/athlete/profile");
    const checklist = page.getByRole("region", { name: "تکمیل پروفایل" });
    await expect(checklist.getByRole("progressbar")).toBeVisible();
    await checklist.getByRole("button").click();
    await expect(checklist.getByRole("progressbar")).toHaveCount(0);
    const lastName = checklist.getByRole("link", { name: "نام خانوادگی", exact: true });
    await expect(lastName).toBeVisible();
    await expect(lastName).toContainText("۲");
    await expect(lastName.locator('svg path')).toHaveAttribute("d", "m15 18-6-6 6-6");
    await checklist.getByRole("button").click();
    await expect(checklist.getByRole("progressbar")).toBeVisible();
    await expect(checklist.getByRole("link")).toHaveCount(0);
    const membership = page.getByRole("link", { name: "بسته‌ها و عضویت‌های من", exact: true });
    await expect(membership.locator('[data-icon="chevron-left"] svg')).toHaveCount(1);
  });
}
