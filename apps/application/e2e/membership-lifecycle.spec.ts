import { test, expect } from "@playwright/test";
import {
  createMockApiState,
  installApiMock,
  setBrowserSession,
} from "./support/mock-api";

test("athlete pauses with Persian digits, resumes, and requests renewal after the previous contract", async ({
  page,
}) => {
  await installApiMock(page, createMockApiState());
  await setBrowserSession(page, true);
  let item = {
    id: "member",
    productId: "product",
    clubId: "66d400000000000000000001",
    title: "عضویت قابل توقف",
    type: "time_membership",
    remainingSessions: null,
    weeklyLimit: 3,
    weeklyUsed: 0,
    sessionTypes: ["court"],
    startsAt: "2026-01-01T00:00:00.000Z",
    endsAt: "2030-01-01T00:00:00.000Z",
    status: "active",
    maxPauseDays: 7,
    remainingPauseDays: 7,
    pauseUntil: null as string | null,
    changes: [] as unknown[],
  };
  await page.route("**/api/v1/benefit-purchases/mine/entitlements", (r) =>
    r.fulfill({ json: { data: { items: [item] } } }),
  );
  await page.route(
    "**/api/v1/benefit-purchases/mine/entitlements/member/pause",
    async (r) => {
      expect(r.request().postDataJSON()).toEqual({ days: 2 });
      item = {
        ...item,
        remainingPauseDays: 5,
        endsAt: "2030-01-03T00:00:00.000Z",
        pauseUntil: "2029-01-03T00:00:00.000Z",
      };
      await r.fulfill({ json: { data: item } });
    },
  );
  await page.route(
    "**/api/v1/benefit-purchases/mine/entitlements/member/resume",
    async (r) => {
      item = {
        ...item,
        remainingPauseDays: 7,
        endsAt: "2030-01-01T00:00:00.000Z",
        pauseUntil: null,
      };
      await r.fulfill({ json: { data: item } });
    },
  );
  await page.route("**/api/v1/public/clubs/*/benefit-products", (r) =>
    r.fulfill({
      json: {
        data: {
          items: [
            {
              id: "product",
              title: "پلن تمدید",
              clubId: item.clubId,
              type: "time_membership",
              price: 150000,
              validityDays: 30,
              weeklyLimit: 3,
              maxPauseDays: 5,
              sessionTypes: ["court"],
              status: "active",
            },
          ],
        },
      },
    }),
  );
  let renewed = false;
  await page.route("**/api/v1/benefit-purchases/product", async (r) => {
    expect(r.request().postDataJSON()).toEqual({
      renewedFromId: "member",
      startMode: "after_expiry",
    });
    renewed = true;
    await r.fulfill({
      json: {
        data: { id: "renew-purchase", amount: 150000, status: "pending" },
      },
    });
  });
  await page.goto("/athlete/memberships");
  await page.getByLabel("مدت توقف (روز)").fill("۲");
  await page.getByRole("button", { name: "ثبت توقف عضویت" }).click();
  await expect(
    page.getByRole("button", { name: "بازگشت از توقف" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "بازگشت از توقف" }).click();
  await expect(
    page.getByRole("button", { name: "ثبت توقف عضویت" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "تمدید یا انتخاب پلن جدید" }).click();
  await expect(
    page.getByRole("combobox", { name: /شروع قرارداد جدید/ }),
  ).toHaveValue("after_expiry");
  await page.getByRole("button", { name: "خرید تمدید" }).click();
  await expect.poll(() => renewed).toBe(true);
  await expect(
    page.getByText("درگاه پرداخت آزمایشی", { exact: true }),
  ).toBeVisible();
});
