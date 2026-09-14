import { expect, test } from "@playwright/test";
import {
  createMockApiState,
  installApiMock,
  setBrowserSession,
} from "./support/mock-api";

test("articles append pages, virtualize offscreen cards and reset on search", async ({
  page,
}) => {
  await installApiMock(page, createMockApiState());
  await setBrowserSession(page, true);
  const requests: string[] = [];
  await page.route("**/api/v1/discovery/catalog/articles**", (route) => {
    const url = new URL(route.request().url());
    requests.push(url.search);
    const search = url.searchParams.get("q");
    const current = Number(url.searchParams.get("page") || 1);
    const items = Array.from({ length: search ? 1 : 20 }, (_, i) => ({
      id: `${search || "article"}-${(current - 1) * 20 + i}`,
      slug: `${search || "article"}-${(current - 1) * 20 + i}`,
      title: search
        ? "نتیجه ویژه جست‌وجو"
        : `مقاله شماره ${(current - 1) * 20 + i}`,
      excerpt: "تمرین و سلامت",
      authorName: "نویسنده",
      coverImageUrl: null,
      readTimeMinutes: 4,
    }));
    return route.fulfill({
      json: {
        data: {
          items,
          page: current,
          total: search ? 1 : 40,
          totalPages: search ? 1 : 2,
          limit: 20,
        },
      },
    });
  });
  await page.goto("/discovery/articles");
  await expect(
    page.getByRole("link", { name: /مقاله شماره 0/ }).first(),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "نمایش نتایج بیشتر", exact: true })
    .scrollIntoViewIfNeeded();
  await expect
    .poll(() => requests.some((value) => value.includes("page=2")))
    .toBe(true);
  await page.locator(".app-scroll-root").evaluate((el) => {
    el.scrollTop = 0;
  });
  await expect(
    page.getByRole("link", { name: /مقاله شماره 0/ }).first(),
  ).toBeVisible();
  expect(
    await page.locator('a[href^="/discovery/articles/article-"]').count(),
  ).toBeLessThan(40);
  await page.getByRole("searchbox").fill("ویژه");
  await expect(
    page.getByRole("link", { name: /نتیجه ویژه جست‌وجو/ }).first(),
  ).toBeVisible();
  await expect(
    page.locator('a[href^="/discovery/articles/article-"]'),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "فیلتر مقاله‌ها", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("support search and sheet filters operate on support records", async ({
  page,
}) => {
  await installApiMock(page, createMockApiState());
  await setBrowserSession(page, true);
  await page.route("**/api/v1/support/tickets", (route) =>
    route.fulfill({
      json: {
        data: {
          items: [
            {
              id: "ticket-a",
              subject: "پرداخت ناموفق",
              status: "open",
              category: "payment",
              messages: [],
              createdAt: "2026-09-01T10:00:00Z",
              updatedAt: "2026-09-01T10:00:00Z",
            },
            {
              id: "ticket-b",
              subject: "سؤال کلاس",
              status: "closed",
              category: "other",
              messages: [],
              createdAt: "2026-09-01T10:00:00Z",
              updatedAt: "2026-09-01T10:00:00Z",
            },
          ],
        },
      },
    }),
  );
  await page.goto("/athlete/support");
  await expect(page.getByText("پرداخت ناموفق", { exact: true })).toBeVisible();
  await page.getByRole("searchbox").fill("پرداخت");
  await expect(page.getByText("سؤال کلاس", { exact: true })).toHaveCount(0);
  await page.getByRole("searchbox").fill("");
  await page
    .getByRole("button", { name: "فیلتر تیکت‌ها", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("وضعیت", { exact: true })
    .selectOption("closed");
  await page.getByRole("button", { name: "نمایش نتایج", exact: true }).click();
  await expect(page.getByText("سؤال کلاس", { exact: true })).toBeVisible();
  await expect(page.getByText("پرداخت ناموفق", { exact: true })).toHaveCount(0);
});

test("coach carousel renders a moving window of slides", async ({ page }) => {
  await installApiMock(page, createMockApiState());
  await setBrowserSession(page, true);
  const coaches = Array.from({ length: 30 }, (_, index) => ({ id: `coach-${index}`, slug: `coach-${index}`, displayName: `مربی شماره ${index}`, shortBio: "مربی آمادگی جسمانی", imageUrl: null, experienceYears: 5, serviceModes: ["club"], averageRating: 4, reviewsCount: 2 }));
  await page.route("**/api/v1/discovery/coaches/sections", route => route.fulfill({ json: { data: [{ id: "test-coaches", type: "coaches", title: "مربی‌های پیشنهادی", subtitle: "", key: "test", layout: "rail", position: 1, items: coaches, appearance: { showHeader: true, showViewAll: false } }] } }));
  await page.route("**/api/v1/discovery/coaches?**", route => route.fulfill({ json: { data: { items: [], total: 0, page: 1, limit: 20 } } }));
  await page.goto("/discovery/coaches");
  const rail = page.locator(".swiper").first();
  await expect(rail).toBeVisible();
  await expect(rail.locator(".swiper-slide").first()).toBeVisible();
  expect(await rail.locator(".swiper-slide").count()).toBeLessThan(30);
  await rail.evaluate(element => (element as HTMLElement & { swiper: { slideTo: (index: number, speed: number) => void } }).swiper.slideTo(20, 0));
  await expect(rail.getByText("مربی شماره 20", { exact: true })).toBeVisible();
  expect(await rail.locator(".swiper-slide").count()).toBeLessThan(30);
});
