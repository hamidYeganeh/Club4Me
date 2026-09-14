import { expect, test } from "@playwright/test";
import {
  createMockApiState,
  installApiMock,
  setBrowserSession,
} from "./support/mock-api";

test("welcome has one brand and an accurately named final action", async ({
  page,
}) => {
  await installApiMock(page, createMockApiState());
  await page.addInitScript(() => {
    localStorage.removeItem("gym4me.welcome.seen");
    sessionStorage.setItem("gym4me.splash.shown", "1");
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/welcome");
  await expect(page.getByRole("heading", { name: /کلاب‌فورمی/ })).toHaveCount(
    2,
  );
  await page.getByRole("button", { name: "شروع کنید" }).click();
  await expect(
    page.getByRole("heading", { name: "باشگاه مناسبت را پیدا کن" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "برنامه تمرینت را همراه داشته باش" }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "اسلاید 4 از 4", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "شروع", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "اسلاید بعدی", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "شروع", exact: true }).click();
  await expect(page).not.toHaveURL(/welcome/);
});

test("today includes registered classes and recovers a partial agenda failure", async ({
  page,
}, info) => {
  await installApiMock(page, createMockApiState());
  await setBrowserSession(page, true);
  let failed = true;
  const startsAt = new Date(Date.now() + 1800000).toISOString();
  const endsAt = new Date(Date.now() + 5400000).toISOString();
  await page.route("**/api/v1/athlete/class-agenda", (route) =>
    route.fulfill({
      json: {
        data: {
          items: [
            {
              id: "course-session",
              source: "coach_class",
              title: "دوره ثبت‌نام‌شده",
              startsAt,
              endsAt,
              paymentPending: false,
              href: "/athlete/reservations/course?source=class",
            },
          ],
        },
      },
    }),
  );
  await page.route("**/api/v1/athlete/club-classes/agenda", (route) =>
    failed
      ? route.fulfill({
          status: 503,
          json: { error: { code: "UNAVAILABLE", message: "unavailable" } },
        })
      : route.fulfill({ json: { data: { items: [] } } }),
  );
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/athlete");
  await expect(
    page.getByRole("region", { name: "فعالیت پیش رو" }),
  ).toContainText("دوره ثبت‌نام‌شده");
  await expect(
    page.getByRole("alert").filter({ hasText: "بخشی از برنامه" }),
  ).toBeVisible();
  failed = false;
  await page
    .getByRole("button", { name: "تلاش دوباره", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("alert").filter({ hasText: "بخشی از برنامه" }),
  ).toHaveCount(0);
  const action = page.getByRole("region", { name: "فعالیت پیش رو" });
  await expect(action.getByRole("link")).toHaveAttribute(
    "href",
    "/athlete/reservations/course?source=class",
  );
  for (const theme of ["light", "dark"]) {
    await page.evaluate((value) => {
      document.documentElement.classList.toggle("dark", value === "dark");
      document.documentElement.setAttribute("data-theme", value);
    }, theme);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath(`agenda-${theme}.png`),
      fullPage: true,
    });
  }
});

test("coach budget reaches the server and displays package and per-session prices", async ({
  page,
}) => {
  await installApiMock(page, createMockApiState());
  await setBrowserSession(page, true);
  let matchedBudget = false;
  await page.route("**/api/v1/discovery/catalog/search**", (route) => {
    const query = new URL(route.request().url()).searchParams;
    matchedBudget =
      query.get("kind") === "coach" &&
      query.get("minPrice") === "100" &&
      query.get("maxPrice") === "200";
    return route.fulfill({
      json: {
        data: {
          clubs: [],
          classes: [],
          coaches: [
            {
              id: "coach-budget",
              slug: "coach-budget",
              displayName: "مربی بسته اقتصادی",
              shortBio: "تمرین",
              imageUrl: null,
              averageRating: 4,
              reviewsCount: 2,
              catalogPrice: {
                amount: 150,
                currency: "IRR",
                unit: "package",
                sessionCount: 5,
              },
            },
          ],
          total: 1,
          page: 1,
          totalPages: 1,
        },
      },
    });
  });
  await page.goto(
    "/discovery/search?q=مربی&kind=coach&minPrice=100&maxPrice=200&nearby=false",
  );
  await expect(
    page.getByText("مربی بسته اقتصادی", { exact: true }),
  ).toBeVisible();
  await expect.poll(() => matchedBudget).toBe(true);
  await expect(page.getByText(/۱۵۰ ریال برای بسته/)).toBeVisible();
  await expect(page.getByText(/هر جلسه حدود ۳۰ ریال/)).toBeVisible();
});
