import { test, expect } from "@playwright/test";
import {
  createMockApiState,
  installApiMock,
  setBrowserSession,
} from "./support/mock-api";

test("coach package checkout activates credit and persists after reload on mobile", async ({
  page,
}, info) => {
  await installApiMock(page, createMockApiState());
  await setBrowserSession(page, true);
  await page.setViewportSize({ width: 375, height: 900 });
  const offering = {
    id: "66d200000000000000000077",
    title: "بسته چهار جلسه",
    description: "تمرین اختصاصی",
    pricingType: "package",
    sessionCount: 4,
    price: { amount: 400000, currency: "IRR" },
  };
  let order: Record<string, unknown> | null = null;
  let purchases = 0;
  const money = {
    id: "66d200000000000000000079",
    referenceType: "coach_package_purchase",
    amount: 400000,
    grossAmount: 400000,
    discountAmount: 0,
    walletAmount: 0,
    status: "pending",
    expiresAt: new Date(Date.now() + 900000).toISOString(),
  };
  await page.route("**/api/v1/public/coaches/demo-coach/services", (r) =>
    r.fulfill({ json: { data: { items: [offering] } } }),
  );
  await page.route("**/api/v1/athlete/packages", (r) =>
    r.fulfill({ json: { data: { items: order ? [order] : [] } } }),
  );
  await page.route("**/api/v1/athlete/services/*/purchases", async (r) => {
    expect(r.request().postDataJSON().idempotencyKey).toBeTruthy();
    purchases++;
    order = {
      id: "66d200000000000000000078",
      coachId: "66d200000000000000000080",
      offeringId: offering.id,
      title: offering.title,
      pricingType: "package",
      remainingSessions: 4,
      status: "pending",
      priceSnapshot: offering.price,
      paymentExpiresAt: money.expiresAt,
      expiresAt: null,
    };
    await r.fulfill({ json: { data: order } });
  });
  await page.route("**/api/v1/payments/quote", (r) =>
    r.fulfill({ json: { data: money } }),
  );
  await page.route("**/api/v1/payments/intents", async (r) => {
    expect(r.request().postDataJSON().referenceType).toBe(
      "coach_package_purchase",
    );
    await r.fulfill({ json: { data: money } });
  });
  await page.route("**/api/v1/payments/intents/*/mock/decision", async (r) => {
    const status = r.request().postDataJSON().status;
    if (order) order.status = status === "paid" ? "active" : "failed";
    await r.fulfill({ json: { data: { ...money, status } } });
  });
  await page.goto("/athlete/packages/demo-coach");
  await expect(
    page.getByRole("button", { name: "ادامه خرید بسته چهار جلسه" }),
  ).toBeVisible();
  await expect(page.locator('[role="status"][aria-label]')).toHaveCount(0);
  await page.screenshot({
    path: info.outputPath("coach-packages-mobile.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "ادامه خرید بسته چهار جلسه" }).click();
  await expect(
    page.getByText("درگاه پرداخت آزمایشی", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "پرداخت موفق", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "انتخاب سانس مربی" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("۴ جلسه باقی‌مانده", { exact: true }),
  ).toBeVisible();
  expect(purchases).toBe(1);
  await page.getByRole("button", { name: "ادامه خرید بسته چهار جلسه" }).click();
  await page
    .getByRole("button", { name: "پرداخت ناموفق", exact: true })
    .click();
  await expect(page.getByText("پرداخت ناموفق", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "انتخاب سانس مربی" }),
  ).toHaveCount(0);
  await page.reload();
  await expect(page.getByText("پرداخت ناموفق", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
