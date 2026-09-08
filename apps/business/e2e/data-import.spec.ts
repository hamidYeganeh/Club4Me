import { test, expect } from "@playwright/test";
import {
  publicClubFixture,
  setBrowserSession,
} from "../../application/e2e/support/mock-api";

for (const partial of [false, true]) {
  test(`import shows committed counts and ${partial ? "row failures" : "completion"} without crashing`, async ({
    page,
  }) => {
    const club = publicClubFixture();
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await setBrowserSession(page, true);
    await page.route("**/api/v1/**", async (route) => {
      const path = new URL(route.request().url()).pathname;
      let data: unknown = { items: [] };
      if (path.endsWith("/business/me") || path.endsWith("/account/me"))
        data = {
          id: club.ownerId,
          phone: "09120000001",
          firstName: "مالک",
          lastName: "آزمایشی",
          roles: ["owner"],
          hasPassword: true,
          status: "active",
        };
      else if (path === "/api/v1/business/clubs") data = { items: [club] };
      else if (path.endsWith("/import")) {
        const body = route.request().postDataJSON();
        expect(body.rows).toHaveLength(2);
        data = {
          dryRun: body.dryRun,
          total: 2,
          valid: 2,
          imported: body.dryRun ? 0 : partial ? 1 : 2,
          errors:
            !body.dryRun && partial
              ? [{ row: 3, message: "شماره شاگرد تکراری است" }]
              : [],
        };
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data }),
      });
    });
    await page.goto("/data");
    await page.locator('input[type="file"]').setInputFiles({
      name: "students.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(
        "firstName,lastName,phone\nسارا,محمدی,09120000001\nمینا,احمدی,09120000002",
      ),
    });
    await page.getByRole("button", { name: "بررسی فایل", exact: true }).click();
    await expect(
      page.getByText("فایل آماده ثبت نهایی است.", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "ثبت نهایی", exact: true }).click();
    await expect(
      page.getByText(partial ? "ثبت‌شده: ۱" : "ثبت‌شده: ۲", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("فایل آماده ثبت نهایی است.", { exact: true }),
    ).toHaveCount(0);
    if (partial)
      await expect(
        page.getByText("ردیف ۳: شماره شاگرد تکراری است", { exact: true }),
      ).toBeVisible();
    else
      await expect(
        page.getByText("ورود داده انجام شد.", { exact: true }),
      ).toBeVisible();
    expect(pageErrors).toEqual([]);
  });
}
