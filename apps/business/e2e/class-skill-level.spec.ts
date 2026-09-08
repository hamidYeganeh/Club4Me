import { test, expect } from "@playwright/test";
import {
  publicClubFixture,
  setBrowserSession,
} from "../../application/e2e/support/mock-api";

test("owner creates a class with the shared skill-level resource", async ({
  page,
}) => {
  const club = publicClubFixture();
  const skillLevelId = "66d400000000000000000099";
  let created: Record<string, unknown> | null = null;
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
    else if (path.includes("skill_levels"))
      data = {
        items: [
          {
            id: skillLevelId,
            code: "INTERMEDIATE",
            name: "متوسط",
            isActive: true,
          },
        ],
      };
    else if (
      path.endsWith(`/business/clubs/${club.id}/operations/classes`) &&
      route.request().method() === "POST"
    ) {
      created = route.request().postDataJSON();
      data = { id: "class-created", clubId: club.id, ...created };
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data }),
    });
  });

  await page.goto("/classes/new");
  await page.getByLabel("نام کلاس", { exact: true }).fill("کلاس سطح‌دار");
  await page
    .getByRole("combobox", { name: "سطح", exact: true })
    .selectOption(skillLevelId);
  await page.getByRole("textbox", { name: /مبلغ \(ریال\)/ }).fill("100000");
  await page
    .getByRole("textbox", { name: "شروع دوره", exact: true })
    .fill("۱۴۰۵/۰۶/۲۰");
  await page
    .getByRole("textbox", { name: "پایان دوره", exact: true })
    .fill("۱۴۰۵/۰۷/۲۰");
  await page.getByRole("button", { name: "ساخت کلاس", exact: true }).click();
  await expect.poll(() => created).not.toBeNull();
  expect(created).toMatchObject({
    skillLevelId,
    level: "متوسط",
    price: 100000,
    currency: "IRR",
  });
});
