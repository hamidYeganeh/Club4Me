import { expect, test } from "@playwright/test";
import {
  publicClubFixture,
  setBrowserSession,
} from "../../application/e2e/support/mock-api";

test("owner saves optional club payment methods while the gateway stays enabled", async ({
  page,
}) => {
  let club = {
    ...publicClubFixture(),
    faqs: [],
    sportIds: ["66d400000000000000000082"],
    onSitePaymentMethods: [] as Array<"cash" | "pos">,
  };
  let writes = 0;
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await setBrowserSession(page, true);
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    let data: unknown = { items: [] };
    if (path.endsWith("/business/me") || path.endsWith("/account/me"))
      data = {
        id: club.ownerId,
        phone: "09120000001",
        firstName: "مالک",
        roles: ["owner"],
        hasPassword: true,
        status: "active",
      };
    else if (path === `/api/v1/business/clubs/${club.id}`) {
      if (route.request().method() === "PATCH") {
        const body = route.request().postDataJSON();
        expect(body.onSitePaymentMethods).toEqual(writes === 0 ? ["cash"] : []);
        expect(body).not.toHaveProperty("onlinePaymentEnabled");
        club = { ...club, ...body };
        writes++;
      }
      data = club;
    } else if (
      path.endsWith("/business/clubs") ||
      path.endsWith("/business/clubs/accessible")
    )
      data = { items: [club] };
    await route.fulfill({ json: { data } });
  });
  const openSettings = async () => {
    await page.goto(`/clubs/${club.id}`);
    await page.getByRole("tab", { name: /عملیات/ }).click();
    await expect(
      page.getByText("درگاه پرداخت اپلیکیشن · همیشه فعال"),
    ).toBeVisible();
  };
  await openSettings();
  await expect(
    page.getByRole("switch", { name: "پرداخت نقدی" }),
  ).not.toBeChecked();
  await page.getByText("پرداخت نقدی", { exact: true }).click();
  await expect(page.getByRole("switch", { name: "پرداخت نقدی" })).toBeChecked();
  await page.getByRole("tab", { name: /تکمیل/ }).click();
  await page
    .getByRole("button", { name: "ذخیره پیش‌نویس", exact: true })
    .click();
  expect(
    await page
      .locator("form :invalid")
      .evaluateAll((elements) =>
        elements.map((element) => ({
          label: element.getAttribute("aria-label"),
          name: element.getAttribute("name"),
          message: (element as HTMLInputElement).validationMessage,
        })),
      ),
  ).toEqual([]);
  await expect
    .poll(() => ({ writes, errors }))
    .toMatchObject({ writes: 1, errors: [] });
  await openSettings();
  await expect(page.getByRole("switch", { name: "پرداخت نقدی" })).toBeChecked();
  await expect(
    page.getByRole("switch", { name: "کارت‌خوان در محل" }),
  ).not.toBeChecked();
  await page.getByText("پرداخت نقدی", { exact: true }).click();
  await expect(
    page.getByRole("switch", { name: "پرداخت نقدی" }),
  ).not.toBeChecked();
  await page.getByRole("tab", { name: /تکمیل/ }).click();
  await page
    .getByRole("button", { name: "ذخیره پیش‌نویس", exact: true })
    .click();
  await expect.poll(() => writes).toBe(2);
});
