import { expect, test } from "@playwright/test";
import type { CoachBooking, CoachClass, CoachEnrollment } from "@api";
import {
  buildCoachAnalytics,
  retainedPayment,
} from "../modules/coach/sections/CoachAnalyticsSection/coach-analytics";
import {
  createMockApiState,
  installApiMock,
  setBrowserSession,
} from "./support/mock-api";

const now = new Date("2026-09-05T12:00:00Z");
const booking = (changes: Partial<CoachBooking> = {}) =>
  ({
    id: "booking-1",
    bookedAt: now.toISOString(),
    status: "confirmed",
    paymentStatus: "paid",
    priceSnapshot: { amount: 1_000_000, currency: "IRR" },
    refundAmount: null,
    ...changes,
  }) as CoachBooking;
const coachClass = {
  id: "class-1",
  title: "تمرین قدرتی",
  status: "published",
  capacity: 10,
  enrollmentCount: 4,
} as CoachClass;
const enrollment = {
  id: "enrollment-1",
  classId: "class-1",
  registeredAt: now.toISOString(),
  status: "active",
  paymentStatus: "paid",
  priceSnapshot: { amount: 2_000_000, currency: "IRR" },
  refundAmount: null,
} as CoachEnrollment;

test("analytics excludes unpaid amounts, retains partial refunds and separates currencies", () => {
  const result = buildCoachAnalytics(
    [coachClass],
    [
      booking(),
      booking({ paymentStatus: "pending" }),
      booking({
        paymentStatus: "refunded",
        refundAmount: 800_000,
        status: "cancelled_by_athlete",
      }),
      booking({ priceSnapshot: { amount: 20, currency: "USD" } }),
      booking({ bookedAt: "2026-07-01T00:00:00Z" }),
      booking({ bookedAt: "2026-09-06T12:00:00Z" }),
      booking({ bookedAt: "invalid" }),
    ],
    [enrollment],
    30,
    "IRR",
    now,
  );
  expect(result.income).toBe(3_200_000);
  expect(result.reservations).toBe(5);
  expect(result.occupancyPercent).toBe(40);
  expect(result.statuses.map((item) => item.value)).toEqual([0, 4, 0, 1, 0]);
  expect(retainedPayment(booking({ paymentStatus: "refunded" }))).toBe(0);
  expect(retainedPayment(booking({ refundAmount: 2_000_000 }))).toBe(0);
});

test("analytics uses Tehran day boundaries and excludes inactive class capacity", () => {
  const result = buildCoachAnalytics(
    [{ ...coachClass, status: "cancelled" }],
    [
      booking({ bookedAt: "2026-08-29T20:30:00Z" }), // Aug 30 in Tehran: first included day.
      booking({ bookedAt: "2026-08-29T20:29:59Z" }),
    ],
    [],
    7,
    "IRR",
    now,
  );
  expect(result.reservations).toBe(1);
  expect(result.trend[0].bookings).toBe(1);
  expect(result.occupancyPercent).toBe(0);
  expect(result.occupancy).toEqual([]);
});

test("coach dashboard renders charts, supports range changes and fits mobile", async ({
  page,
}) => {
  const state = createMockApiState();
  state.user.roles = ["coach"];
  await installApiMock(page, state);
  await setBrowserSession(page, true);
  const timestamp = new Date().toISOString();
  await page.route("**/api/v1/coach/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const data = path.endsWith("/profile")
      ? { displayName: "مربی آزمایشی", reviewStatus: "approved" }
      : path.endsWith("/classes/class-1/enrollments")
        ? { items: [{ ...enrollment, registeredAt: timestamp }] }
        : path.endsWith("/classes")
          ? { items: [coachClass] }
          : path.endsWith("/bookings")
            ? { items: [booking({ bookedAt: timestamp })] }
            : { items: [] };
    await route.fulfill({ json: { data } });
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/coach");
  const section = page.getByRole("region", { name: "عملکرد شما" });
  await expect(
    section.locator("p").filter({ hasText: /^۳٬۰۰۰٬۰۰۰$/ }),
  ).toBeVisible();
  await expect(section.locator("svg.overflow-visible")).toHaveCount(4);
  await expect
    .poll(() =>
      section
        .locator('g[class^="bar-series-"] rect')
        .evaluateAll(
          (bars) =>
            bars.length > 0 &&
            bars.every((bar) => Number(bar.getAttribute("y")) >= 0),
        ),
    )
    .toBe(true);
  await section.getByLabel("بازه گزارش").selectOption("7");
  await expect(
    section.locator("p").filter({ hasText: /^۳٬۰۰۰٬۰۰۰$/ }),
  ).toBeVisible();
  await section.locator("summary").first().click();
  await expect(section.locator("table").first()).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "/tmp/coach-analytics-mobile.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("coach dashboard shows empty states and retries failed analytics", async ({
  page,
}) => {
  const state = createMockApiState();
  state.user.roles = ["coach"];
  await installApiMock(page, state);
  await setBrowserSession(page, true);
  let fail = true;
  await page.route("**/api/v1/coach/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/bookings") && fail) {
      return route.fulfill({ status: 500, json: { message: "Unavailable" } });
    }
    return route.fulfill({
      json: {
        data: path.endsWith("/profile")
          ? { displayName: "مربی آزمایشی", reviewStatus: "approved" }
          : { items: [] },
      },
    });
  });
  await page.goto("/coach");
  await expect(
    page.getByText("دریافت آمار کامل نشد. دوباره تلاش کنید."),
  ).toBeVisible({ timeout: 20000 });
  fail = false;
  await page.getByRole("button", { name: "تلاش دوباره", exact: true }).click();
  await expect(
    page.getByText("در این بازه درآمدی ثبت نشده است."),
  ).toBeVisible();
  await expect(
    page.getByText("هنوز کلاس فعالی برای نمایش وجود ندارد."),
  ).toBeVisible();
});
