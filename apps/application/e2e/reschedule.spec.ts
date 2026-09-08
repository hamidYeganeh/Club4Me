import { test, expect } from "@playwright/test";
import {
  createMockApiState,
  installApiMock,
  setBrowserSession,
  reservationFixture,
  sessionFixture,
} from "./support/mock-api";

test("rescheduling previews the difference, preserves the old booking on failure and opens the replacement on success", async ({
  page,
}) => {
  const state = createMockApiState();
  const startsAt = new Date(Date.now() + 3 * 86400000).toISOString();
  const endsAt = new Date(Date.now() + 3 * 86400000 + 3600000).toISOString();
  state.reservation = reservationFixture(startsAt, endsAt, "reserved", "paid");
  const old = state.reservation;
  await installApiMock(page, state);
  await setBrowserSession(page, true);
  const target = {
    ...sessionFixture(startsAt, endsAt),
    id: "66d200000000000000000099",
    title: "سانس جایگزین",
    basePrice: 600000,
  };
  await page.route("**/api/v1/public/clubs/*/reservable-sessions", (r) =>
    r.fulfill({ json: { data: { items: [target] } } }),
  );
  await page.route(`**/api/v1/reservations/${old.id}/reschedule/quote`, (r) =>
    r.fulfill({
      json: {
        data: {
          sessionId: target.id,
          sessionTitle: target.title,
          startsAt,
          endsAt,
          newAmount: 600000,
          refundAmount: 500000,
          gatewayRefund: 500000,
          walletRefund: 0,
          difference: 100000,
          refundPercent: 100,
          currency: "IRR",
          restoresEntitlement: false,
        },
      },
    }),
  );
  const next = {
    ...old,
    id: "66d300000000000000000099",
    sessionId: target.id,
    sessionTitle: target.title,
    totalPrice: 600000,
  };
  let completed = false;
  await page.route("**/api/v1/reservations", (r) =>
    r.request().method() === "GET"
      ? r.fulfill({
          json: {
            data: {
              items: completed
                ? [{ ...old, status: "cancelled" }, next]
                : [old],
            },
          },
        })
      : r.fallback(),
  );
  await page.route(`**/api/v1/reservations/${old.id}/reschedule`, async (r) => {
    const body = r.request().postDataJSON();
    expect(body).toMatchObject({
      sessionId: target.id,
      options: [],
      expectedTotalPrice: 600000,
      expectedRefundAmount: 500000,
      expectedRefundPercent: 100,
    });
    if (body.mockResult === "failed")
      return r.fulfill({
        status: 409,
        json: {
          error: {
            code: "RESCHEDULE_PAYMENT_FAILED",
            message: "پرداخت آزمایشی ناموفق بود؛ رزرو قبلی حفظ شد.",
          },
        },
      });
    completed = true;
    await r.fulfill({ json: { data: next } });
  });
  await page.goto(`/athlete/reservations/${old.id}`);
  await page.getByRole("button", { name: "تغییر زمان", exact: true }).click();
  await page
    .getByRole("combobox", { name: "زمان جدید", exact: true })
    .selectOption(target.id);
  await expect(
    page.getByText("اختلاف هزینه نهایی", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "شبیه‌سازی پرداخت ناموفق" }).click();
  await expect(
    page
      .getByRole("region", { name: "تغییر زمان رزرو", exact: true })
      .getByRole("alert"),
  ).toContainText("رزرو قبلی حفظ شد");
  await expect(page).toHaveURL(new RegExp(`${old.id}$`));
  await page
    .getByRole("button", { name: "تأیید تغییر زمان و پرداخت آزمایشی" })
    .click();
  await expect(page).toHaveURL(new RegExp(`${next.id}$`));
  await expect(
    page.getByRole("heading", { name: target.title, exact: true }),
  ).toBeVisible();
});
