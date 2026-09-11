import { expect, test } from "@playwright/test";
import {
  createMockApiState,
  installApiMock,
  setBrowserSession,
} from "./support/mock-api";

test.beforeEach(async ({ page }) => {
  const state = createMockApiState();
  state.user.roles = ["coach"];
  await installApiMock(page, state);
  await setBrowserSession(page, true);
  await page.addInitScript(() => {
    sessionStorage.setItem("gym4me.splash.shown", "1");
    localStorage.setItem("theme", "light");
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("budget counters support typing, clearing, keyboard stepping and bounded buttons", async ({
  page,
}) => {
  await page.goto("/discovery/search?kind=class");
  await page.getByRole("button", { name: "فیلتر نوع نتیجه" }).click();
  const input = page.getByRole("spinbutton", {
    name: "حداقل بودجه (ریال)",
    exact: true,
  });
  const counter = page.locator("[data-counter]").filter({ has: input });
  await expect(input).toHaveValue("");
  await counter.getByRole("button", { name: "افزایش مقدار" }).click();
  await expect(input).toHaveValue("1");
  await counter.getByRole("button", { name: "کاهش مقدار" }).press("Enter");
  await expect(input).toHaveValue("0");
  await expect(counter.getByRole("button", { name: "کاهش مقدار" })).toHaveCount(
    0,
  );
  await expect(input).toBeFocused();
  await input.press("ArrowUp");
  await expect(input).toHaveValue("1");
  await input.fill("1250000");
  await counter.getByRole("button", { name: "افزایش مقدار" }).click();
  await expect(input).toHaveValue("1250001");
  await input.fill("");
  await input.blur();
  await expect(input).toHaveValue("");
  expect(
    await input.evaluate((node: HTMLInputElement) => node.validity.valid),
  ).toBe(true);
});

test("class counters preserve optional ages and limits on narrow screens in both themes", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/coach/classes/new");
  const capacity = page.getByRole("spinbutton", { name: "ظرفیت", exact: true });
  const counter = page.locator("[data-counter]").filter({ has: capacity });
  await capacity.fill("1");
  await counter.getByRole("button", { name: "افزایش مقدار" }).click();
  await expect(capacity).toHaveValue("2");
  const age = page.getByRole("spinbutton", {
    name: "حداقل سن (اختیاری)",
    exact: true,
  });
  await expect(age).toHaveValue("");
  await age.fill("121");
  expect(
    await age.evaluate((node: HTMLInputElement) => !node.validity.valid),
  ).toBe(true);
  await expect(age).toHaveJSProperty("validationMessage", "بیشترین مقدار ۱۲۰ است.");
  await age.fill("۱۲۰");
  const ageCounter = page.locator("[data-counter]").filter({ has: age });
  await expect(
    ageCounter.getByRole("button", { name: "افزایش مقدار" }),
  ).toHaveCount(0);
  await ageCounter.getByRole("button", { name: "کاهش مقدار" }).click();
  await expect(age).toHaveValue("119");
  await age.fill("");
  await age.blur();
  await expect(age).toHaveValue("");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await counter.scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath("counter-light-mobile.png") });
  await page.evaluate(() => {
    document.documentElement.classList.add("dark");
    document.documentElement.setAttribute("data-theme", "dark");
  });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await counter.getByRole("button", { name: "افزایش مقدار" }).click();
  await expect(capacity).toHaveValue("3");
  await page.screenshot({ path: info.outputPath("counter-dark-mobile.png") });
});
