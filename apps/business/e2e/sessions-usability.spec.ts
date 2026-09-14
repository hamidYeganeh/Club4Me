import { test, expect, type Page } from "@playwright/test";
import {
  publicClubFixture,
  setBrowserSession,
} from "../../application/e2e/support/mock-api";

async function setup(page: Page, policyAvailable = true) {
  const club = {
    ...publicClubFixture(),
    cancellationRules: policyAvailable
      ? [
          {
            id: "rule-1",
            title: "لغو تا یک روز قبل",
            isActive: true,
            tiers: [{ hoursBefore: 24, refundPercent: 100 }],
          },
        ]
      : [],
  };
  const court = {
    id: "court-1",
    name: "سالن اصلی",
    capacity: 12,
    minimumReservationMinutes: 60,
    maximumReservationMinutes: 180,
    status: "active",
    isReservable: true,
    sportIds: [],
    galleryMediaIds: [],
  };
  const writes: Record<string, unknown>[] = [];
  const sessions = [
    {
      id: "session-1",
      clubId: club.id,
      courtId: court.id,
      title: "فوتبال عصرگاهی",
      startsAt: "2027-02-01T13:30:00Z",
      endsAt: "2027-02-01T15:00:00Z",
      capacity: 12,
      reservedCount: 3,
      basePrice: 500000,
      currency: "IRR",
      pricingUnit: "per_participant",
      options: [],
      cancellationPolicy: club.cancellationRules[0],
      status: "active",
    },
  ];
  await setBrowserSession(page, true);
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    let data: unknown = { items: [] };
    if (path.endsWith("/me"))
      data = {
        id: club.ownerId,
        phone: "09120000001",
        roles: ["owner"],
        status: "active",
        hasPassword: true,
      };
    else if (path === `/api/v1/business/clubs/${club.id}`) data = club;
    else if (path.endsWith("/courts")) data = { items: [court] };
    else if (path === `/api/v1/business/clubs/${club.id}/sessions`) {
      if (route.request().method() === "POST") {
        const body = route.request().postDataJSON();
        writes.push(body);
        const row = {
          ...sessions[0]!,
          ...body,
          id: `created-${writes.length}`,
          reservedCount: 0,
        };
        sessions.push(row);
        data = row;
      } else data = { items: sessions };
    } else if (path.endsWith("/cancel")) {
      writes.push({ action: "cancel" });
      sessions[0]!.status = "cancelled";
      data = sessions[0];
    }
    await route.fulfill({ json: { data } });
  });
  await page.goto(`/clubs/${club.id}/reservations`);
  await expect(
    page.getByRole("heading", { name: "مدیریت سانس‌ها", exact: true }),
  ).toBeVisible();
  return { writes, club };
}
for (const width of [375, 1440])
  test(`session list and quick creation at ${width}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    const { writes } = await setup(page);
    await page.screenshot({
      path: testInfo.outputPath("sessions-list.png"),
      fullPage: true,
    });
    await expect(
      page.getByRole("form", { name: "ساخت زمین", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByText("فوتبال عصرگاهی", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "ساخت سانس", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByLabel("مربی (اختیاری)")).not.toBeVisible();
    await dialog
      .getByRole("textbox", { name: "عنوان سانس", exact: true })
      .fill("تمرین صبحگاهی");
    await dialog
      .getByRole("textbox", { name: "تاریخ و ساعت شروع", exact: true })
      .fill("1406/01/10 09:00");
    await dialog.getByRole("button", { name: "۹۰ دقیقه", exact: true }).click();
    await expect(
      dialog.getByRole("textbox", { name: "تاریخ و ساعت پایان", exact: true }),
    ).toHaveValue(/10:30/);
    await page.screenshot({
      path: testInfo.outputPath("session-create.png"),
      fullPage: true,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await dialog.getByRole("button", { name: "ثبت سانس", exact: true }).click();
    await expect(dialog).not.toBeVisible();
    await expect.poll(() => writes.length).toBe(1);
    expect(writes[0]).toMatchObject({
      title: "تمرین صبحگاهی",
      capacity: 1,
      basePrice: 0,
      cancellationPolicy: { id: "rule-1" },
    });
    expect(
      new Date(writes[0]!.endsAt as string).getTime() -
        new Date(writes[0]!.startsAt as string).getTime(),
    ).toBe(90 * 60000);
    await expect(
      page.getByText("تمرین صبحگاهی", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("textbox", { name: "جستجوی سانس", exact: true })
      .fill("فوتبال");
    await page.getByRole("button", { name: "ساخت مشابه", exact: true }).click();
    await expect(
      dialog.getByRole("textbox", { name: "عنوان سانس", exact: true }),
    ).toHaveValue("فوتبال عصرگاهی");
    await expect(
      dialog.getByRole("textbox", { name: "تاریخ و ساعت شروع", exact: true }),
    ).toHaveValue("");
    await dialog.getByRole("button", { name: "انصراف", exact: true }).click();
    expect(writes.length).toBe(1);
    await page
      .getByRole("button", { name: "زمین‌ها و فضاها", exact: true })
      .click();
    await page
      .getByRole("button", { name: "افزودن زمین", exact: true })
      .click();
    await expect(page.getByLabel("نام زمین", { exact: true })).toBeVisible();
    await expect(page.getByLabel("کد زمین", { exact: true })).not.toBeVisible();
  });
test("missing cancellation policy blocks publication and explains the remedy", async ({
  page,
}) => {
  const { club } = await setup(page, false);
  await page.getByRole("button", { name: "ساخت سانس", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "ثبت سانس", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("link", { name: "قانون لغو باشگاه", exact: true }),
  ).toHaveAttribute("href", `/clubs/${club.id}`);
});
test("cancellation requires explicit confirmation", async ({ page }) => {
  const { writes } = await setup(page);
  await page.getByRole("button", { name: "لغو سانس", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "انصراف", exact: true })
    .click();
  expect(writes.length).toBe(0);
  await page.getByRole("button", { name: "لغو سانس", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "تأیید و ادامه", exact: true })
    .click();
  await expect.poll(() => writes.length).toBe(1);
});

test("a scheduling conflict preserves the draft for correction", async ({
  page,
}) => {
  const { club } = await setup(page);
  await page.route(
    `**/api/v1/business/clubs/${club.id}/sessions`,
    async (route) => {
      if (route.request().method() === "POST")
        await route.fulfill({
          status: 409,
          json: {
            error: { code: "COURT_SESSION_OVERLAP", message: "Conflict" },
          },
        });
      else await route.fallback();
    },
  );
  await page.getByRole("button", { name: "ساخت سانس", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("textbox", { name: "عنوان سانس", exact: true })
    .fill("سانس جدید");
  await dialog
    .getByRole("textbox", { name: "تاریخ و ساعت شروع", exact: true })
    .fill("1406/01/10 09:00");
  await dialog.getByRole("button", { name: "ثبت سانس", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("سانس دیگری دارد");
  await expect(
    dialog.getByRole("textbox", { name: "عنوان سانس", exact: true }),
  ).toHaveValue("سانس جدید");
});
