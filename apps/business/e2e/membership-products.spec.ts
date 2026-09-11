import { test, expect } from "@playwright/test";
import {
  publicClubFixture,
  setBrowserSession,
} from "../../application/e2e/support/mock-api";

test("owner creates a membership with an explicit pause policy and sees the persisted contract", async ({
  page,
}) => {
  const club = publicClubFixture();
  const secondClub = {
    ...club,
    id: "66d400000000000000000099",
    name: "باشگاه دوم",
  };
  let saved: Record<string, unknown> | null = null;
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await setBrowserSession(page, true);
  await page.route("**/api/v1/**", async (r) => {
    const path = new URL(r.request().url()).pathname;
    let data: unknown = { items: [] };
    if (path.endsWith("/business/me") || path.endsWith("/account/me"))
      data = {
        id: club.ownerId,
        phone: "09120000001",
        roles: ["owner"],
        hasPassword: true,
        status: "active",
      };
    else if (path === "/api/v1/business/clubs")
      data = { items: [club, secondClub] };
    else if (path.endsWith("/benefit-products")) {
      if (r.request().method() === "POST") {
        const body = r.request().postDataJSON();
        expect(body).toMatchObject({
          title: "عضویت انعطاف‌پذیر",
          validityDays: 30,
          maxPauseDays: 7,
          price: 100000,
          sessionCount: 5,
          type: "session_pack",
          accessClubIds: [secondClub.id],
        });
        saved = { ...body, id: "product", clubId: club.id, status: "active" };
        data = saved;
      } else data = { items: saved ? [saved] : [] };
    }
    await r.fulfill({ json: { data } });
  });
  await page.goto("/memberships");
  await page.getByRole("button", { name: "محصول جدید", exact: true }).click();
  await page.getByLabel("عنوان", { exact: true }).fill("عضویت انعطاف‌پذیر");
  await page.getByLabel("قیمت (ریال)", { exact: true }).fill("100000");
  await page.getByLabel("تعداد جلسه", { exact: true }).fill("5");
  await page
    .getByLabel("سقف توقف در طول قرارداد (روز؛ صفر یعنی بدون توقف)", {
      exact: true,
    })
    .fill("7");
  await page
    .getByRole("group", { name: "باشگاه‌های مجاز برای مصرف این بسته" })
    .getByText("باشگاه دوم", { exact: true })
    .click();
  await page.getByRole("button", { name: "ذخیره", exact: true }).click();
  await expect.poll(() => saved?.maxPauseDays).toBe(7);
  await expect(
    page.getByText("محصول عضویت ساخته شد", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("rowheader", { name: "عضویت انعطاف‌پذیر", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("تا ۷ روز توقف", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("owner invites by mobile and persistently revokes a team member", async ({
  page,
}) => {
  const club = publicClubFixture();
  let member: {
    id: string;
    userId: string;
    phone: string;
    role: string;
    status: string;
  } | null = null;
  await setBrowserSession(page, true);
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    let data: unknown = { items: [] };
    if (path.endsWith("/business/me") || path.endsWith("/account/me"))
      data = {
        id: club.ownerId,
        roles: ["owner"],
        status: "active",
        hasPassword: true,
      };
    else if (path === "/api/v1/business/clubs") data = { items: [club] };
    else if (path.endsWith("/memberships")) {
      if (route.request().method() === "POST") {
        expect(route.request().postDataJSON()).toMatchObject({
          phone: "۰۹۱۲۱۲۳۴۵۶۷",
          role: "receptionist",
          permissions: [],
        });
        member = {
          id: "member",
          userId: "staff",
          phone: "09121234567",
          role: "receptionist",
          status: "invited",
        };
        data = member;
      } else data = { items: member ? [member] : [] };
    } else if (path.endsWith("/member/revoke")) {
      if (!member) throw new Error("Expected an invited member before revoke");
      member = { ...member, status: "suspended" };
      data = member;
    }
    await route.fulfill({ json: { data } });
  });
  await page.goto("/memberships");
  await page.getByLabel("موبایل عضو تیم").fill("۰۹۱۲۱۲۳۴۵۶۷");
  await page.locator('select[name="role"]').selectOption("receptionist");
  await page.getByRole("button", { name: "ارسال دعوت", exact: true }).click();
  await expect(page.getByText("منتظر پذیرش", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "لغو دسترسی", exact: true }).click();
  await expect(page.getByText("لغو شده", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("لغو شده", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "لغو دسترسی", exact: true }),
  ).toHaveCount(0);
});
