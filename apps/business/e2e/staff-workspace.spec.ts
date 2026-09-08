import { test, expect } from "@playwright/test";
import {
  publicClubFixture,
  setBrowserSession,
} from "../../application/e2e/support/mock-api";

test("finance sees permitted workspace, records a Persian dated receipt and persists it", async ({
  page,
}) => {
  const club = {
    ...publicClubFixture(),
    isOwner: false,
    permissions: [
      "club.read",
      "students.read",
      "payments.read",
      "payments.write",
      "memberships.read",
    ],
  };
  let saved: Record<string, unknown> | null = null;
  const forbiddenReads: string[] = [];
  await setBrowserSession(page, true);
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    let data: unknown = { items: [] };
    if (path.endsWith("/business/me") || path.endsWith("/account/me"))
      data = {
        id: "staff",
        phone: "09120000000",
        roles: ["athlete"],
        hasPassword: true,
        status: "active",
      };
    else if (path === "/api/v1/business/clubs") data = { items: [club] };
    else if (path.endsWith("/students"))
      data = {
        items: [
          {
            id: "student",
            firstName: "سارا",
            lastName: "احمدی",
            phone: "09121234567",
            status: "active",
          },
        ],
      };
    else if (path.endsWith("/payments")) {
      if (route.request().method() === "POST") {
        saved = { id: "receipt", ...route.request().postDataJSON() };
        data = saved;
      } else data = { items: saved ? [saved] : [] };
    } else if (
      path.includes("/classes") ||
      path.includes("/memberships") ||
      path.includes("/payout")
    )
      forbiddenReads.push(path);
    await route.fulfill({ json: { data } });
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "محیط کار پرسنل" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "کلاس و حضور", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "ثبت شاگرد", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "پرداخت‌ها", exact: true }).click();
  await page
    .getByRole("combobox", { name: "شاگرد", exact: true })
    .selectOption("student");
  await page.getByLabel("عنوان رسید").fill("شهریه آزمایشی");
  await page.getByLabel("مبلغ (ریال)").fill("۲۰۰۰۰۰");
  await page.getByLabel("تاریخ پرداخت").fill("۱۴۰۵/۰۶/۲۱");
  await page.getByRole("button", { name: "ثبت رسید دستی" }).click();
  await expect.poll(() => saved?.amount).toBe(200000);
  expect(saved).toMatchObject({
    studentId: "student",
    currency: "IRR",
    paidAt: "2026-09-12T08:30:00.000Z",
  });
  await expect(
    page.getByText("رسید پرداخت دستی ثبت شد", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "پرداخت‌ها", exact: true }).click();
  await expect(page.getByText(/شهریه آزمایشی ·/)).toBeVisible();
  expect(forbiddenReads).toEqual([]);
});

test("coach records and corrects attendance for an enrolled class without financial access", async ({
  page,
}) => {
  const club = {
    ...publicClubFixture(),
    isOwner: false,
    permissions: [
      "club.read",
      "classes.read",
      "enrollments.read",
      "attendance.read",
      "attendance.write",
    ],
  };
  let records: Array<{ status: string }> = [];
  const paths: string[] = [];
  await setBrowserSession(page, true);
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    paths.push(path);
    let data: unknown = { items: [] };
    if (path.endsWith("/business/me") || path.endsWith("/account/me"))
      data = {
        id: "staff",
        roles: ["coach"],
        hasPassword: true,
        status: "active",
      };
    else if (path === "/api/v1/business/clubs") data = { items: [club] };
    else if (path.endsWith("/classes"))
      data = { items: [{ id: "class", title: "کلاس قدرتی" }] };
    else if (path.endsWith("/sessions"))
      data = {
        items: [
          {
            id: "session",
            startsAt: "2026-09-12T15:00:00Z",
            status: "scheduled",
          },
        ],
      };
    else if (path.endsWith("/enrollments"))
      data = {
        items: [
          {
            id: "enrollment",
            studentId: "student",
            studentName: "سارا احمدی",
            status: "active",
          },
        ],
      };
    else if (path.endsWith("/attendance")) {
      if (route.request().method() === "PUT")
        records = route.request().postDataJSON().items;
      data = { items: records };
    }
    await route.fulfill({ json: { data } });
  });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "پرداخت‌ها", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("combobox", { name: "جلسه", exact: true })
    .selectOption("session");
  await expect(page.getByText("سارا احمدی", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "حاضر", exact: true }).click();
  await expect.poll(() => records[0]?.status).toBe("present");
  await page.getByRole("button", { name: "غایب", exact: true }).click();
  await expect.poll(() => records[0]?.status).toBe("absent");
  expect(
    paths.some(
      (path) => path.includes("/payments") || path.endsWith("/students"),
    ),
  ).toBe(false);
});
