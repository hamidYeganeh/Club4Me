import { test, expect } from "@playwright/test";
import {
  createMockApiState,
  installApiMock,
  setBrowserSession,
} from "./support/mock-api";

test.use({ timezoneId: "America/Los_Angeles" });
test("coach enters Persian and Arabic dates, invalid input cannot submit, service time stays Tehran", async ({
  page,
}) => {
  const state = createMockApiState();
  state.user.roles = ["coach"];
  await installApiMock(page, state);
  await setBrowserSession(page, true);
  const writes: Array<{ startAt?: string; endAt?: string }> = [];
  await page.route("**/api/v1/coach/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/services"))
      return route.fulfill({
        json: {
          data: {
            items: [
              {
                id: "offering",
                title: "تمرین آنلاین",
                status: "published",
                pricingType: "per_session",
                durationMinutes: 60,
                sportId: "sport",
                deliveryModes: ["online"],
                price: { amount: 100000, currency: "IRR" },
              },
            ],
          },
        },
      });
    if (path.endsWith("/sessions") && route.request().method() === "POST") {
      writes.push(route.request().postDataJSON());
      return route.fulfill({
        json: { data: { id: "session", ...writes.at(-1) } },
      });
    }
    return route.fulfill({ json: { data: { items: [] } } });
  });
  await page.goto("/coach/reservations");
  await page.getByRole("button", { name: "جلسات", exact: true }).click();
  await page.getByLabel("خدمت مربوط به سانس").selectOption("offering");
  await page
    .getByPlaceholder("لینک جلسه آنلاین (پس از رزرو نمایش داده می‌شود)")
    .fill("https://meet.example.com/test");
  const date = page.getByLabel("تاریخ و ساعت شروع سانس");
  await date.fill("۱۴۰۵/۰۷/۳۱ ۱۸:۳۰");
  await expect(date).toHaveAttribute("aria-invalid", "true");
  await page.getByRole("button", { name: "ساخت سانس", exact: true }).click();
  expect(writes).toHaveLength(0);
  await date.fill("١٤٠٥/٠٦/٢١ ١٨:٣٠");
  await page.getByRole("button", { name: "ساخت سانس", exact: true }).click();
  await expect.poll(() => writes.length).toBe(1);
  expect(writes[0]).toMatchObject({
    startAt: "2026-09-12T15:00:00.000Z",
    endAt: "2026-09-12T16:00:00.000Z",
  });
});
