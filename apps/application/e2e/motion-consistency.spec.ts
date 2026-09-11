import { expect, test } from "@playwright/test";
import {
  createMockApiState,
  installApiMock,
  setBrowserSession,
} from "./support/mock-api";

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test(`saved filters retain their selection and styling with ${reducedMotion} motion`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion });
    await installApiMock(page, createMockApiState());
    await setBrowserSession(page, true);
    await page.goto("/athlete/favorites");
    const filters = page.getByRole("group", { name: "نوع ذخیره‌شده‌ها" });
    await expect(filters).toBeVisible();
    const clubs = filters.getByRole("button", { name: /^باشگاه‌ها/ });
    await clubs.click();
    await expect(clubs).toHaveAttribute("aria-pressed", "true");
    await expect(filters.locator('[aria-pressed="true"]')).toHaveCount(1);
    await expect(clubs.locator('[aria-hidden="true"]')).toBeVisible();
    await expect(filters.getByRole("button", { name: /^همه/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    if (reducedMotion === "reduce") {
      const duration = await clubs.evaluate(
        (node) => getComputedStyle(node).transitionDuration,
      );
      expect(parseFloat(duration)).toBeLessThanOrEqual(0.001);
    }
    await filters.getByRole("button", { name: /^همه/ }).focus();
    await page.keyboard.press("Enter");
    await expect(filters.getByRole("button", { name: /^همه/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
}

test("bottom navigation keeps route semantics with the shared indicator", async ({
  page,
}) => {
  await installApiMock(page, createMockApiState());
  await setBrowserSession(page, true);
  await page.goto("/athlete");
  const navigation = page.getByRole("navigation");
  await expect(navigation.locator('a[href="/athlete"]')).toHaveAttribute(
    "aria-current",
    "page",
  );
  await navigation.locator('a[href="/discovery"]').click();
  await expect(page).toHaveURL(/\/discovery$/);
  await expect(navigation.locator('a[href="/discovery"]')).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(navigation.locator('[aria-current="page"]')).toHaveCount(1);
  await page.goBack();
  await expect(page).toHaveURL(/\/athlete$/);
  await expect(navigation.locator('a[href="/athlete"]')).toHaveAttribute(
    "aria-current",
    "page",
  );
});
