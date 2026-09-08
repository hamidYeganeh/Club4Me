import { expect, test } from "@playwright/test";
import type { Favorite } from "@api";
import type { PublicCatalogCoach } from "@api/discovery";
import {
  createMockApiState,
  installApiMock,
  setBrowserSession,
} from "./support/mock-api";

const coach: PublicCatalogCoach = {
  id: "64a000000000000000000001",
  slug: "64a000000000000000000001",
  displayName: "نگار احمدی",
  shortBio: "تمرین قدرتی و اصلاح حرکت؛ همراه تو برای ساختن عادت‌های ماندگار.",
  avatarMediaId: null,
  coverMediaId: null,
  imageUrl: "/profile/avatar.jpg",
  experienceYears: 8,
  serviceModes: ["club", "online"],
  averageRating: 4.8,
  reviewsCount: 24,
  contact: {},
  portfolio: [],
  specialties: [
    {
      title: "تمرین قدرتی",
      description: "برنامه متناسب با سطح آمادگی و هدف هر ورزشکار",
    },
  ],
  trainingStyles: [],
  experienceSummary: "هشت سال تجربهٔ مربیگری فردی و گروهی",
  experience: [],
  faqs: [],
};

for (const theme of ["light", "dark"] as const) {
  test(`account pages ${theme}: coach, saves and profile interactions`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    const state = createMockApiState();
    state.user.firstName = "مهسا";
    state.user.lastName = "رضایی";
    state.user.gender = "female";
    state.user.activityLevel = "normal";
    await installApiMock(page, state);
    await setBrowserSession(page, true);
    await page.addInitScript(
      (value) => localStorage.setItem("theme", value),
      theme,
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    let saves: Favorite[] = [
      {
        id: "saved-coach",
        entityType: "coach",
        entityId: coach.id,
        createdAt: "2026-09-01T00:00:00Z",
      },
      {
        id: "saved-club",
        entityType: "club",
        entityId: "energy-plus-demo",
        createdAt: "2026-09-01T00:00:00Z",
      },
    ];
    await page.route("**/api/v1/saves", (route) =>
      route.fulfill({ json: { data: { items: saves } } }),
    );
    await page.route(
      "**/api/v1/saves/coach/64a000000000000000000001",
      (route) => {
        saves = saves.filter((item) => item.entityType !== "coach");
        return route.fulfill({ json: { data: { success: true } } });
      },
    );
    await page.route(
      "**/api/v1/discovery/catalog/coaches/64a000000000000000000001",
      (route) => route.fulfill({ json: { data: coach } }),
    );
    await page.route(
      "**/api/v1/public/coaches/64a000000000000000000001/sessions",
      (route) =>
        route.fulfill({
          json: {
            data: {
              items: [
                {
                  id: "demo-session",
                  coachId: coach.id,
                  title: "ارزیابی و تمرین اختصاصی",
                  offeringTitle: "تمرین خصوصی",
                  source: "coach",
                  startAt: "2027-01-10T14:30:00Z",
                  endAt: "2027-01-10T15:30:00Z",
                  timezone: "Asia/Tehran",
                  deliveryMode: "club",
                  venue: { address: "تهران، سعادت‌آباد" },
                  capacity: 1,
                  bookedCount: 0,
                  remainingCapacity: 1,
                  price: { amount: 3500000, currency: "IRR" },
                  status: "published",
                },
              ],
            },
          },
        }),
    );

    for (const width of [375, 820]) {
      await page.setViewportSize({ width, height: 900 });
      for (const [name, path, heading] of [
        [
          "coach",
          "/discovery/coaches/64a000000000000000000001",
          coach.displayName,
        ],
        ["favorites", "/athlete/favorites", "انتخاب‌های خوب را نگه دار."],
        ["profile", "/athlete/profile", "مهسا رضایی"],
      ]) {
        await page.goto(path!);
        await expect(
          page.getByRole("heading", { name: heading!, exact: true }).first(),
        ).toBeVisible({ timeout: 20_000 });
        await expect(
          page.getByRole("status", { name: "Gym4Me", exact: true }),
        ).toHaveCount(0);
        await page.evaluate(() => document.fonts.ready);
        if (name === "favorites")
          await expect(
            page.getByRole("link", { name: coach.displayName, exact: true }),
          ).toBeVisible();
        if (name === "profile")
          await expect(
            page.getByRole("progressbar", { name: "میزان تکمیل پروفایل" }),
          ).toHaveAttribute("aria-valuenow", "4");
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        await page.evaluate(() => {
          document
            .querySelectorAll(".app-scroll-root, main")
            .forEach((element) => element.scrollTo(0, 0));
          window.scrollTo(0, 0);
          return new Promise<void>((resolve) =>
            requestAnimationFrame(() => resolve()),
          );
        });
        if (name === "profile")
          await expect(
            page.getByRole("heading", { name: heading!, exact: true }).first(),
          ).toBeInViewport();
        await page.screenshot({
          path: testInfo.outputPath(`${name}-${theme}-${width}.png`),
        });
      }
    }
    await page
      .getByRole("link", { name: /ذخیره‌شده‌ها، انتخاب‌های ذخیره‌شده/ })
      .click();
    await expect(page).toHaveURL(/\/athlete\/favorites$/);
    await page.getByRole("button", { name: /مربی‌ها/ }).click();
    await expect(
      page.getByRole("link", { name: "باشگاه انرژی پلاس", exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: "حذف از ذخیره‌شده‌ها", exact: true })
      .click();
    await expect(
      page.getByText("هنوز موردی در مربی‌ها ذخیره نکرده‌ای", { exact: true }),
    ).toBeVisible();
    await page.goto("/discovery/coaches/64a000000000000000000001");
    await page.getByRole("link", { name: "انتخاب سانس", exact: true }).click();
    await expect(
      page.getByText("ارزیابی و تمرین اختصاصی", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "ادامه", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "مرور رزرو", exact: true }),
    ).toBeVisible();
    await page.goto("/athlete/profile");
    await page.getByRole("link", { name: "تکمیل", exact: true }).click();
    await expect(page).toHaveURL(/\/athlete\/profile\/edit$/);
  });
}
