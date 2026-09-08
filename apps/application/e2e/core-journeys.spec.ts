import { expect, test } from "@playwright/test";

import {
  createMockApiState,
  installApiMock,
  setBrowserSession,
} from "./support/mock-api";

test("ورود با رمز عبور کاربر را وارد اپ می‌کند", async ({ page }) => {
  const state = createMockApiState();
  await installApiMock(page, state);
  await setBrowserSession(page);

  await page.goto("/auth/login");
  await page.getByPlaceholder("0912 0000 000").fill("09120000001");
  await page.getByPlaceholder("رمز عبور را وارد کنید").fill("Demo@1405");
  await page.getByRole("button", { name: "ورود", exact: true }).click();

  await expect(page).toHaveURL(/\/athlete$/);
  await expect
    .poll(() =>
      page.evaluate(() => window.localStorage.getItem("gym4me.accessToken")),
    )
    .toBe("e2e-access-token");
});

test("کشف تا رزرو، پرداخت، اعلان، لغو و refund", async ({ page }) => {
  const state = createMockApiState();
  await installApiMock(page, state);
  await setBrowserSession(page, true);

  await page.goto("/discovery/clubs?sort=newest");
  await page
    .getByRole("link", { name: /باشگاه انرژی پلاس/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/discovery\/clubs\/energy-plus-demo$/);

  await page
    .getByRole("button", { name: "همین حالا رزرو کن", exact: true })
    .last()
    .click();
  await expect(page).toHaveURL(/\/discovery\/clubs\/energy-plus-demo\/slots$/);

  await page
    .getByRole("radiogroup", { name: "ساعت رزرو را انتخاب کنید" })
    .locator('[data-slot="radio-content"]')
    .first()
    .click();
  await expect(page.getByRole("radio").first()).toBeChecked();
  await page.getByRole("button", { name: "رزرو کنید", exact: true }).click();
  await expect(page.getByRole("heading", { name: "مرور رزرو" })).toBeVisible();
  await expect(
    page.getByText("سانس تست باشگاه", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "ثبت رزرو و ادامه پرداخت" }).click();
  await expect(page.getByText("درگاه پرداخت آزمایشی")).toBeVisible();
  await page.getByRole("button", { name: "پرداخت موفق" }).click();
  await expect(
    page.getByRole("heading", { name: "رزرو شما با موفقیت انجام شد" }),
  ).toBeVisible();
  expect(state.reservation?.paymentStatus).toBe("paid");
  await page.getByRole("button", { name: "مشاهده رزروهای من" }).click();
  await expect(page).toHaveURL(/\/athlete\/reservations$/);

  await page.goto("/athlete/notifications");
  await expect(page.getByText("رزرو شما قطعی شد")).toBeVisible();

  await page.goto("/athlete/reservations");
  const reservation = page.getByRole("button", {
    name: /^فعال[\s\S]*سانس تست باشگاه/,
  });
  await expect(reservation).toBeVisible();
  await expect(
    page.getByRole("status", { name: "Gym4Me", exact: true }),
  ).toHaveCount(0);

  await page.getByRole("button", { name: "لغو سانس تست باشگاه", exact: true }).click();
  await expect(page.getByRole("heading", { name: "لغو رزرو" })).toBeVisible();
  await page.getByLabel("تغییر برنامه").check();
  await page.getByRole("button", { name: "تأیید لغو رزرو" }).click();

  await expect(page.getByText("بازپرداخت‌شده")).toBeVisible();
  expect(state.reservation?.paymentStatus).toBe("refunded");
});

test("حذف حساب نشست را پاک و کاربر را به ورود هدایت می‌کند", async ({
  page,
}) => {
  const state = createMockApiState();
  await installApiMock(page, state);
  await setBrowserSession(page, true);

  await page.goto("/athlete/settings");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "حذف دائمی حساب" }).click();

  await expect(page).toHaveURL(/\/auth$/);
  await expect
    .poll(() =>
      page.evaluate(() => window.localStorage.getItem("gym4me.accessToken")),
    )
    .toBeNull();
  expect(state.accountDeleted).toBe(true);
});

test("ویرایش پروفایل در bottom sheet و بدون route فیلد انجام می‌شود", async ({
  page,
}) => {
  const state = createMockApiState();
  await installApiMock(page, state);
  await setBrowserSession(page, true);

  await page.goto("/athlete/profile/edit");
  await page.getByRole("button", { name: "ویرایش جنسیت" }).click();
  await expect(
    page.getByRole("heading", { name: "ویرایش جنسیت" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "سایر" }).click();
  await page.getByPlaceholder("توضیح کوتاهی بنویسید…").fill("ترجیح شخصی");
  await page.getByRole("button", { name: "اعمال" }).click();

  await expect(page).toHaveURL(/\/athlete\/profile\/edit$/);
  await expect(page.getByText("سایر", { exact: true })).toBeVisible();
  expect(state.user.gender).toBe("other");
  expect(state.user.genderDescription).toBe("ترجیح شخصی");

  await page.getByRole("button", { name: "ویرایش سطح فعالیت" }).click();
  await page.getByRole("button", { name: /بسیار فعال/ }).click();
  await page.getByRole("button", { name: "اعمال" }).click();
  expect(state.user.activityLevel).toBe("very-active");
});
