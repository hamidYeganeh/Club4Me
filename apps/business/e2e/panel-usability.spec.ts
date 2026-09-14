import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  publicClubFixture,
  setBrowserSession,
} from "../../application/e2e/support/mock-api";
const admin = "http://127.0.0.1:7282",
  business = "http://127.0.0.1:7283";
async function setup(page: Page) {
  await setBrowserSession(page, true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const club = { ...publicClubFixture(), isOwner: true };
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    let data: unknown = { items: [] };
    const user = {
      id: "66d100000000000000000001",
      firstName: "نگار",
      lastName: "احمدی",
      phone: "09121234567",
      roles: ["admin", "owner"],
      status: "active",
      hasPassword: true,
      createdAt: "2026-09-01",
      updatedAt: "2026-09-01",
    };
    if (path.endsWith("/me")) data = user;
    else if (path.endsWith("/clubs")) data = { items: [club] };
    else if (path.endsWith("/users")) data = { items: [user] };
    else if (path.endsWith("/students"))
      data = {
        items: [{ ...user, joinedAt: "2026-09-01", membershipEndsAt: null }],
      };
    else if (path.endsWith("/balance"))
      data = { availableAmount: 1000000, reservedAmount: 0, currency: "IRR" };
    await route.fulfill({ json: { data } });
  });
}
for (const theme of ["light", "dark"])
  for (const width of [375, 1440]) {
    test(`accessible layouts ${theme} ${width}`, async ({ page }, info) => {
      await setup(page);
      await page.addInitScript(
        (theme) => localStorage.setItem("theme", theme),
        theme,
      );
      await page.setViewportSize({ width, height: 812 });
      for (const [base, path] of [
        [admin, "/users"],
        [admin, "/clubs"],
        [admin, "/finance"],
        [admin, "/support"],
        [business, "/students"],
        [business, "/payments"],
        [business, "/calendar"],
      ]) {
        await page.goto(`${base}${path}`);
        await expect(page.locator("main h1")).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          path,
        ).toBe(true);
        await page.addScriptTag({
          content: readFileSync(
            resolve(__dirname, "../../../node_modules/axe-core/axe.js"),
            "utf8",
          ),
        });
        const violations = await page.evaluate(async () => {
          const axe = (
            window as unknown as {
              axe: {
                run: (
                  context: Element,
                  options: unknown,
                ) => Promise<{
                  violations: {
                    id: string;
                    nodes: { target: string[]; failureSummary: string }[];
                  }[];
                }>;
              };
            }
          ).axe;
          return (
            await axe.run(
              document.querySelector(".admin-panel,.business-panel")!,
              {
                runOnly: {
                  type: "tag",
                  values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
                },
              },
            )
          ).violations.map((v) => ({
            id: v.id,
            nodes: v.nodes.map((n) => ({
              target: n.target,
              message: n.failureSummary,
            })),
          }));
        });
        await page.screenshot({
          path: info.outputPath(
            `${base === admin ? "admin" : "business"}-${path.slice(1)}.png`,
          ),
        });
        expect.soft(violations, `${base}${path}`).toEqual([]);
      }
    });
  }
test("admin mobile menu search and keyboard dismissal", async ({ page }) => {
  await setup(page);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`${admin}/users`);
  const trigger = page.getByRole("button", { name: "باز کردن منوی مدیریت" });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("searchbox").fill("ناشناخته");
  await expect(dialog.getByRole("status")).toContainText("پیدا نشد");
  await dialog.getByRole("searchbox").fill("کاربران");
  await expect(
    dialog.getByRole("link", { name: "کاربران", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(
    page.getByRole("button", { name: "مشاهده پرونده" }),
  ).toBeVisible();
  await page.getByText("اقدامات بیشتر", { exact: true }).click();
  await page.getByRole("button", { name: "تعلیق", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("تعلیق");
  await page.getByRole("button", { name: "انصراف", exact: true }).click();
});
test("desktop navigation, skip link and collapsed labels", async ({ page }) => {
  await setup(page);
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto(`${business}/students`);
  await expect(page.locator("main h1")).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "رفتن به محتوای اصلی" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#panel-content")).toBeFocused();
  const nav = page.getByRole("navigation", {
    name: "بخش‌های کسب‌وکار",
    exact: true,
  });
  await nav
    .getByRole("link", { name: "تنظیمات", exact: true })
    .scrollIntoViewIfNeeded();
  await expect(
    nav.getByRole("link", { name: "تنظیمات", exact: true }),
  ).toBeInViewport();
  await page.getByRole("button", { name: "جمع کردن نوار کناری" }).click();
  await nav.getByRole("link", { name: "شاگردها", exact: true }).focus();
  await expect(
    nav.locator(".panel-nav-tooltip").filter({ hasText: "شاگردها" }),
  ).toBeVisible();
});
test("financial sections preserve drafts and human readable user selection", async ({
  page,
}) => {
  await setup(page);
  await page.goto(`${admin}/finance`);
  await expect(
    page.getByRole("heading", { name: "افزایش اعتبار کیف پول" }),
  ).toBeHidden();
  await page
    .getByRole("button", { name: "اعتبار کیف پول", exact: true })
    .click();
  await expect(page.getByLabel("جستجوی کاربر با نام یا موبایل")).toBeVisible();
  await page.getByLabel("علت افزایش اعتبار").fill("اصلاح پرداخت");
  await page.getByRole("button", { name: "کمپین تخفیف", exact: true }).click();
  await page
    .getByRole("button", { name: "اعتبار کیف پول", exact: true })
    .click();
  await expect(page.getByLabel("علت افزایش اعتبار")).toHaveValue(
    "اصلاح پرداخت",
  );
  await page.goto(`${business}/payments`);
  await expect(
    page.getByText("موجودی قابل برداشت", { exact: true }),
  ).toBeHidden();
  await page
    .getByRole("button", { name: "برداشت و تسویه", exact: true })
    .click();
  await expect(
    page.getByText("موجودی قابل برداشت", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "ثبت پرداخت", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "دریافت‌ها و رسیدها", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "انتخاب کنید شاگرد", exact: true }),
  ).toBeVisible();
});
test("mobile calendar default and reception shortcut", async ({ page }) => {
  await setup(page);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`${business}/calendar`);
  await expect(page.locator("main h1")).toBeVisible();
  await expect(page.locator("[role=grid]")).toHaveCount(0);
  const nav = page.getByRole("navigation", { name: "دسترسی سریع" });
  await expect(
    nav.getByRole("link", { name: "پذیرش", exact: true }),
  ).toHaveAttribute("href", "/check-in");
  await expect(
    nav.getByRole("link", { name: "شاگردها", exact: true }),
  ).toBeVisible();
});
