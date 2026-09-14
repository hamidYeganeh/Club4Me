import { test, expect, type Page } from "@playwright/test";
import {
  publicClubFixture,
  setBrowserSession,
} from "../../application/e2e/support/mock-api";
async function setup(page: Page) {
  const club = publicClubFixture();
  const writes: Record<string, unknown>[] = [];
  await setBrowserSession(page, true);
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    let data: unknown = { items: [] };
    if (path.endsWith("/me"))
      data = {
        id: club.ownerId,
        roles: ["owner"],
        status: "active",
        phone: "09120000001",
        hasPassword: true,
      };
    else if (path === "/api/v1/business/clubs") data = { items: [club] };
    else if (path === `/api/v1/business/clubs/${club.id}`) data = club;
    else if (
      new URL(route.request().url()).searchParams.get("action") === "options"
    )
      data = {
        items: [
          { id: "catalog-option", name: "گزینه آزمایشی", isActive: true },
        ],
      };
    else if (path.endsWith("/media/upload"))
      data = {
        id: "uploaded-image",
        url: "https://example.com/image.png",
        status: "ready",
        mimeType: "image/png",
      };
    else if (
      (path.endsWith("/classes") || path.endsWith("/coaches")) &&
      route.request().method() === "POST"
    ) {
      writes.push(route.request().postDataJSON());
      data = { id: "created-class" };
    }
    await route.fulfill({ json: { data } });
  });
  await page.goto("/classes/new");
  await expect(
    page.getByRole("heading", { name: "ساخت کلاس جدید" }),
  ).toBeVisible();
  return writes;
}
for (const width of [375, 1440])
  test(`class relations and upload at ${width}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 900 });
    const writes = await setup(page);
    await expect(page.getByText("شناسه کاور", { exact: true })).toHaveCount(0);
    await page.getByLabel("نام کلاس", { exact: true }).fill("کلاس آزمایشی");
    await page.getByLabel("نام کلاس", { exact: true }).focus();
    expect(
      await page
        .getByLabel("نام کلاس", { exact: true })
        .evaluate((el) => getComputedStyle(el).outlineStyle),
    ).toBe("none");
    await page.screenshot({
      path: info.outputPath("class-basics.png"),
      fullPage: true,
    });
    await page
      .getByText("تصاویر و جزئیات تکمیلی (اختیاری)", { exact: true })
      .click();
    await page
      .getByRole("combobox", { name: "امکانات کلاس", exact: true })
      .fill("گزینه");
    await page.getByRole("option", { name: "گزینه آزمایشی" }).click();
    await page.keyboard.press("Escape");
    await page
      .getByRole("combobox", { name: "تجهیزات لازم", exact: true })
      .fill("گزینه");
    await page.getByRole("option", { name: "گزینه آزمایشی" }).click();
    await page.keyboard.press("Escape");
    await page
      .locator("input[type=file]")
      .first()
      .setInputFiles({
        name: "cover.png",
        mimeType: "image/png",
        buffer: Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
          "base64",
        ),
      });
    await expect(
      page.getByRole("button", { name: "حذف کاور کلاس 1" }),
    ).toBeVisible();
    await page.screenshot({
      path: info.outputPath("class-details.png"),
      fullPage: true,
    });
    await page.getByLabel("شروع دوره", { exact: true }).fill("۱۴۰۵/۰۷/۰۱");
    await page.getByLabel("پایان دوره", { exact: true }).fill("۱۴۰۵/۰۸/۰۱");
    await page.getByRole("button", { name: "ساخت کلاس", exact: true }).click();
    await expect.poll(() => writes.length).toBe(1);
    expect(writes[0]).toMatchObject({
      title: "کلاس آزمایشی",
      coverMediaId: "uploaded-image",
      amenityIds: ["catalog-option"],
      requiredEquipmentIds: ["catalog-option"],
    });
  });

test("coach specialties and employment come from catalog choices", async ({
  page,
}) => {
  const writes = await setup(page);
  await page.goto("/coaches");
  await page.getByRole("button", { name: "افزودن مربی" }).click();
  await page.getByLabel("نام", { exact: true }).fill("مربی");
  await page.getByLabel("نام خانوادگی", { exact: true }).fill("آزمایشی");
  await page.getByLabel("شماره تماس", { exact: true }).fill("09121234567");
  await page
    .getByRole("combobox", { name: "تخصص‌ها", exact: true })
    .fill("گزینه");
  await page.getByRole("option", { name: "گزینه آزمایشی" }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: /نوع همکاری/ }).click();
  await page.getByRole("option", { name: "گزینه آزمایشی" }).click();
  await page.getByRole("button", { name: "ثبت مربی", exact: true }).click();
  await expect.poll(() => writes.length).toBe(1);
  expect(writes[0]).toMatchObject({
    specialties: ["گزینه آزمایشی"],
    employmentType: "گزینه آزمایشی",
  });
  await expect(
    page.getByRole("button", { name: "ثبت مربی", exact: true }),
  ).toHaveCount(0);
});
