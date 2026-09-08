import { expect, test } from "@playwright/test";

import {
  publicClubFixture,
  setBrowserSession,
} from "../../application/e2e/support/mock-api";

test("business calendar combines class and reservable sessions", async ({
  page,
}) => {
  await setBrowserSession(page, true);
  const club = { ...publicClubFixture(), isOwner: true };
  const start = new Date();
  start.setHours(18, 0, 0, 0);
  const end = new Date(start);
  end.setHours(19, 0, 0, 0);

  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    let data: unknown = { items: [] };
    if (path.endsWith("/business/me")) {
      data = {
        id: club.ownerId,
        userId: club.ownerId,
        phone: "09120000000",
        role: "owner",
        roles: ["owner"],
        hasPassword: true,
        status: "active",
      };
    } else if (path === "/api/v1/business/clubs") {
      data = { items: [club] };
    } else if (path.endsWith("/operations/classes/calendar-sessions")) {
      data = {
        items: [
          {
            id: "class-session",
            classId: "66d500000000000000000001",
            clubId: club.id,
            classTitle: "تمرین قدرتی",
            startsAt: start.toISOString(),
            endsAt: end.toISOString(),
            capacity: 16,
            status: "scheduled",
            createdAt: start.toISOString(),
            updatedAt: start.toISOString(),
          },
        ],
      };
    } else if (path.endsWith(`/${club.id}/sessions`)) {
      data = {
        items: [
          {
            id: "reservable-session",
            clubId: club.id,
            title: "سانس آزاد زمین",
            startsAt: start.toISOString(),
            endsAt: end.toISOString(),
            capacity: 8,
            reservedCount: 5,
            basePrice: 3_000_000,
            currency: "IRR",
            pricingUnit: "per_court",
            options: [],
            cancellationPolicy: {},
            status: "active",
          },
        ],
      };
    } else if (path.endsWith(`/${club.id}/reservations`)) {
      data = { items: [{ id: "reservation", status: "reserved" }] };
    }
    await route.fulfill({ json: { data } });
  });

  await page.goto("/calendar");

  await expect(
    page.getByRole("heading", { name: "تقویم باشگاه" }),
  ).toBeVisible();
  await expect(
    page.getByText("تمرین قدرتی", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("سانس آزاد زمین", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText("۱ رزرو فعال", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "کلاس‌ها", exact: true }).click();
  await expect(
    page.getByText("تمرین قدرتی", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText("سانس آزاد زمین", { exact: true })).toHaveCount(
    0,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
