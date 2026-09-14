import { test, expect } from "@playwright/test";
import {
  publicClubFixture,
  setBrowserSession,
} from "../../application/e2e/support/mock-api";

test("private business reviews paginate and preserve the response after failure", async ({
  page,
}, info) => {
  const club = {
    ...publicClubFixture(),
    visibility: "private",
    reviewStatus: "suspended",
    isOwner: true,
  };
  let unavailable = true;
  let responseFails = true;
  let responseBody = "";
  const pages: number[] = [];
  await setBrowserSession(page, true);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    let data: unknown = { items: [] };
    if (path.endsWith("/business/me") || path.endsWith("/account/me"))
      data = {
        id: club.ownerId,
        roles: ["owner"],
        hasPassword: true,
        status: "active",
      };
    else if (path === "/api/v1/business/clubs") data = { items: [club] };
    else if (path.endsWith("/response")) {
      if (responseFails)
        return route.fulfill({
          status: 503,
          json: {
            error: { code: "UNAVAILABLE", message: "ثبت پاسخ انجام نشد" },
          },
        });
      responseBody = route.request().postDataJSON().body;
      data = {};
    } else if (path.endsWith("/reviews")) {
      expect(path).toContain("/business/clubs/");
      if (unavailable)
        return route.fulfill({
          status: 503,
          json: { error: { code: "UNAVAILABLE", message: "خطای موقت" } },
        });
      const current = Number(url.searchParams.get("page"));
      pages.push(current);
      data = {
        items: [
          {
            id: `review-${current}`,
            title: `نظر صفحه ${current}`,
            body: "تجربه تمرین در باشگاه",
            rating: 4,
            ownerResponse: responseBody ? { body: responseBody } : null,
          },
        ],
        page: current,
        total: 105,
        totalPages: 6,
        count: 105,
        average: 4,
        limit: 20,
      };
    }
    await route.fulfill({ json: { data } });
  });
  await page.goto("/reviews");
  await expect(
    page.getByRole("alert").filter({ hasText: "دریافت نظرها" }),
  ).toBeVisible();
  await expect(page.getByText("هنوز نظری ثبت نشده است.")).toHaveCount(0);
  unavailable = false;
  await page.getByRole("button", { name: "تلاش دوباره", exact: true }).click();
  await expect(page.getByText("نظر صفحه 1", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "صفحه بعد", exact: true }).click();
  await expect(page.getByText("نظر صفحه 2", { exact: true })).toBeVisible();
  expect(pages).toContain(2);
  await page.getByRole("button", { name: "ثبت پاسخ", exact: true }).click();
  const dialog = page.getByRole("dialog");
  const draft = dialog.getByRole("textbox", { name: "پاسخ باشگاه" });
  await draft.fill("از بازخورد دقیق شما ممنونیم");
  await dialog.getByRole("button", { name: "ثبت", exact: true }).click();
  await expect(dialog.getByRole("alert")).toBeVisible();
  await expect(draft).toHaveValue("از بازخورد دقیق شما ممنونیم");
  for (const theme of ["light", "dark"]) {
    await page.evaluate((value) => {
      document.documentElement.classList.toggle("dark", value === "dark");
      document.documentElement.setAttribute("data-theme", value);
    }, theme);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath(`response-${theme}.png`),
      fullPage: true,
    });
  }
  responseFails = false;
  await dialog.getByRole("button", { name: "ثبت", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(responseBody).toBe("از بازخورد دقیق شما ممنونیم");
  await expect(page.getByText("پاسخ داده شده", { exact: true })).toBeVisible();
});

test("class transfer confirms terms, keeps failed selection, and explicitly refunds online enrollment", async ({
  page,
}) => {
  const club = publicClubFixture();
  const source = {
    id: "source",
    clubId: club.id,
    title: "کلاس مبدأ",
    model: "group",
    pricingModel: "package",
    price: 1000000,
    currency: "IRR",
    capacity: 10,
    enrollmentCount: 2,
    status: "active",
  };
  const target = {
    ...source,
    id: "target",
    title: "کلاس مقصد",
    price: 1500000,
  };
  let manualStatus = "active",
    onlineStatus = "active",
    failTransfer = true,
    transfers = 0,
    refunds = 0;
  await setBrowserSession(page, true);
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    let data: unknown = { items: [] };
    if (path.endsWith("/business/me") || path.endsWith("/account/me"))
      data = {
        id: club.ownerId,
        roles: ["owner"],
        hasPassword: true,
        status: "active",
      };
    else if (path === "/api/v1/business/clubs") data = { items: [club] };
    else if (path.endsWith("/enrollments/manual/transfer")) {
      transfers++;
      expect(route.request().postDataJSON()).toMatchObject({
        targetClassId: "target",
      });
      if (failTransfer)
        return route.fulfill({
          status: 409,
          json: {
            error: {
              code: "TRANSFER_CAPACITY_REQUIRED",
              message: "ظرفیت کافی نیست",
            },
          },
        });
      manualStatus = "cancelled";
    } else if (
      path.endsWith("/enrollments/online") &&
      route.request().method() === "PATCH"
    ) {
      expect(route.request().postDataJSON()).toMatchObject({
        status: "cancelled",
      });
      refunds++;
      onlineStatus = "cancelled";
    } else if (path.endsWith("/enrollments"))
      data = {
        items: [
          {
            id: "manual",
            studentId: "manual-student",
            classId: "source",
            status: manualStatus,
            agreedPrice: 1000000,
            paymentStatus: "partial",
            remainingSessions: 5,
          },
          {
            id: "online",
            studentId: "online-student",
            classId: "source",
            status: onlineStatus,
            agreedPrice: 1000000,
            paymentStatus: "paid",
            remainingSessions: 5,
            transferRequiresRefund: true,
          },
        ],
      };
    else if (path.endsWith("/students"))
      data = {
        items: [
          { id: "manual-student", firstName: "شاگرد", lastName: "دستی" },
          { id: "online-student", firstName: "شاگرد", lastName: "آنلاین" },
        ],
      };
    else if (path.endsWith("/operations/classes/source")) data = source;
    else if (path.endsWith("/operations/classes"))
      data = { items: [source, target] };
    await route.fulfill({ json: { data } });
  });
  await page.goto(`/clubs/${club.id}/classes/source`);
  const selection = page.getByRole("button", { name: /انتقال شاگرد/ });
  const selectTarget = async () => {
    await selection.click();
    await page.getByRole("option", { name: /کلاس مقصد/ }).last().click();
  };
  await selectTarget();
  expect(transfers).toBe(0);
  await page.getByRole("button", { name: "انصراف", exact: true }).click();
  await expect(selection).toContainText("انتخاب کلاس مقصد");
  await selectTarget();
  await page.getByRole("button", { name: "تأیید انتقال", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "ظرفیت" }),
  ).toBeVisible();
  await expect(selection).not.toContainText("انتخاب کلاس مقصد");
  await expect(selection).toContainText("کلاس مقصد");
  failTransfer = false;
  await page.getByRole("button", { name: "تأیید انتقال", exact: true }).click();
  await expect(selection).toHaveCount(0);
  expect(transfers).toBe(2);
  await page
    .getByRole("button", { name: "لغو و بازپرداخت ثبت‌نام", exact: true })
    .click();
  expect(refunds).toBe(0);
  await expect(
    page.getByText(/جای شما در کلاس مقصد رزرو نمی‌شود/),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "تأیید لغو و بازپرداخت", exact: true })
    .click();
  await expect.poll(() => refunds).toBe(1);
  await expect(
    page.getByRole("button", { name: "لغو و بازپرداخت ثبت‌نام", exact: true }),
  ).toHaveCount(0);
});
