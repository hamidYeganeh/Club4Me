import { test, expect } from "@playwright/test";
import {
  publicClubFixture,
  setBrowserSession,
} from "../../application/e2e/support/mock-api";

test("reception finds an athlete, displays purchased credit and records then corrects group arrival", async ({
  page,
}) => {
  const club = publicClubFixture();
  const writes: Record<string, unknown>[] = [];
  let count = 0;
  const changes: Record<string, unknown>[] = [];
  await setBrowserSession(page, true);
  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url()),
      path = url.pathname;
    let data: unknown = { items: [] };
    if (path.endsWith("/business/me") || path.endsWith("/account/me"))
      data = {
        id: club.ownerId,
        roles: ["owner"],
        status: "active",
        hasPassword: true,
      };
    else if (path === "/api/v1/business/clubs") data = { items: [club] };
    else if (path.endsWith("/check-in")) {
      const body = route.request().postDataJSON();
      writes.push(body);
      changes.push({
        actorId: club.ownerId,
        at: new Date().toISOString(),
        before: count,
        after: body.participantCount,
        reason: body.reason,
      });
      count = body.participantCount;
      data = { checkedInParticipants: count };
    } else if (path.endsWith("/reception")) {
      expect(url.searchParams.get("phone")).toBe("09121234567");
      data = {
        found: true,
        accountMismatch: false,
        person: {
          studentId: "student",
          name: "سارا احمدی",
          phone: "+989121234567",
        },
        memberships: [
          {
            id: "contract",
            title: "بسته خریداری‌شده",
            type: "session_pack",
            remainingSessions: 3,
            weeklyRemaining: null,
            status: "active",
            startsAt: "2026-09-01T00:00:00Z",
            endsAt: "2026-10-01T00:00:00Z",
            pauseUntil: null,
          },
        ],
        reservations: [
          {
            id: "reservation",
            title: "زمین گروهی",
            startsAt: new Date(Date.now() + 600000).toISOString(),
            endsAt: new Date(Date.now() + 4200000).toISOString(),
            status: "reserved",
            paymentStatus: "not_required",
            participantCount: 2,
            checkedInParticipants: count,
            checkedInAt: count ? new Date().toISOString() : null,
            checkInOpensAt: new Date(Date.now() - 1200000).toISOString(),
            changes,
          },
        ],
        enrollments: [],
        unallocatedReceiptCount: 0,
      };
    }
    await route.fulfill({ json: { data } });
  });
  await page.goto("/check-in");
  await page.getByLabel("موبایل ورزشکار").fill("۰۹۱۲۱۲۳۴۵۶۷");
  await page
    .getByRole("button", { name: "جست‌وجوی پذیرش", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "سارا احمدی", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("مانده بسته: ۳ جلسه", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "ثبت ورود", exact: true }).click();
  await expect(
    page.getByText("ورود ثبت‌شده: ۲ از ۲ نفر", { exact: true }),
  ).toBeVisible();
  expect(writes[0]).toMatchObject({
    participantCount: 2,
    expectedParticipantCount: 0,
  });
  await page.getByLabel("تعداد حاضر").fill("۰");
  await page.getByLabel("دلیل اصلاح").fill("ورود اشتباه ثبت شده بود");
  await page.getByRole("button", { name: "ثبت ورود", exact: true }).click();
  await expect(
    page.getByText("ورود ثبت‌شده: ۰ از ۲ نفر", { exact: true }),
  ).toBeVisible();
  expect(writes[1]).toMatchObject({
    participantCount: 0,
    expectedParticipantCount: 2,
    reason: "ورود اشتباه ثبت شده بود",
  });
  await expect(
    page.getByText("مانده بسته: ۳ جلسه", { exact: true }),
  ).toBeVisible();
  await page.getByText("سابقه ورود", { exact: true }).click();
  await expect(page.getByText(/ورود اشتباه ثبت شده بود/).last()).toBeVisible();
});
