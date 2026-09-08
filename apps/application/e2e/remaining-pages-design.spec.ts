import { expect, test } from "@playwright/test";
import { emptyCoachProfessionalProfile } from "@api";
import {
  createMockApiState,
  installApiMock,
  setBrowserSession,
} from "./support/mock-api";

for (const theme of ["light", "dark"] as const) {
  test(`remaining pages ${theme}: responsive headers, heroes and navigation`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(180_000);
    const state = createMockApiState();
    state.user.roles = ["athlete", "coach"];
    await installApiMock(page, state);
    await setBrowserSession(page, true);
    await page.addInitScript(
      (value) => localStorage.setItem("theme", value),
      theme,
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("**/api/v1/me/locations", (route) =>
      route.fulfill({ json: { data: { items: [] } } }),
    );
    await page.route("**/api/v1/geography/**", (route) =>
      route.fulfill({ json: { data: { items: [] } } }),
    );
    await page.route("**/api/v1/coach/**", (route) => {
      const path = new URL(route.request().url()).pathname;
      const data = path.endsWith("/availability")
        ? { rules: [], exceptions: [] }
        : path.endsWith("/profile")
          ? {
              id: "66d400000000000000000021",
              userId: state.user.id,
              displayName: "نگار احمدی",
              shortBio: "مربی تمرین قدرتی",
              bio: "آموزش اصولی با تمرکز بر اجرای صحیح حرکات",
              experienceYears: 8,
              galleryMediaIds: [],
              specialties: [],
              trainingStyles: [],
              experience: [],
              faqs: [],
              languages: ["فارسی"],
              serviceModes: ["club", "online"],
              contact: {},
              reviewStatus: "approved",
              visibility: "public",
              professionalProfile: emptyCoachProfessionalProfile(),
            }
          : { items: [] };
      return route.fulfill({ json: { data } });
    });
    for (const width of [375, 820]) {
      await page.setViewportSize({ width, height: 900 });
      for (const [name, path] of [
        ["profile-edit", "/athlete/profile/edit"],
        ["profile-image", "/athlete/profile/image"],
        ["locations", "/athlete/profile/locations"],
        ["location-new", "/athlete/profile/locations/new"],
        ["availability", "/coach/availability"],
        ["class-form", "/coach/classes/new"],
        ["service-form", "/coach/services/new"],
        ["professional", "/coach/profile/professional"],
        ["sports", "/discovery/sports"],
        ["search", "/discovery/search"],
      ]) {
        await page.goto(path!);
        await expect(
          page.getByRole("status", { name: "Gym4Me", exact: true }),
        ).toHaveCount(0);
        await expect(page.locator("header")).toHaveCount(1);
        await expect(page.locator("header")).toBeVisible();
        if (name !== "search")
          await expect(page.locator("[data-hero-scrim]")).toHaveCount(1);
        await page.evaluate(async () => {
          await document.fonts.ready;
          await Promise.all(
            Array.from(document.images).map((img) =>
              img.decode().catch(() => {}),
            ),
          );
          document
            .querySelectorAll(".app-scroll-root, main")
            .forEach((el) => el.scrollTo(0, 0));
          window.scrollTo(0, 0);
          await new Promise(requestAnimationFrame);
        });
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `${name} ${width}`,
        ).toBe(true);
        await expect(page.locator('[role="status"].bg-accent')).toHaveCount(0);
        await page.screenshot({
          path: testInfo.outputPath(`${name}-${theme}-${width}.png`),
        });
      }
    }
    await page.goto("/athlete/profile/locations");
    await page.getByRole("link", { name: /لوکیشن جدید/ }).click();
    await expect(page).toHaveURL(/\/locations\/new$/);
    expect(errors).toEqual([]);
  });
}

test("business class detail uses the photo hero and keeps enrollment available", async ({
  page,
}, testInfo) => {
  await installApiMock(page, createMockApiState());
  await setBrowserSession(page, true);
  await page.route(
    "**/api/v1/discovery/business-classes/66d400000000000000000041",
    (route) =>
      route.fulfill({
        json: {
          data: {
            id: "66d400000000000000000041",
            title: "تمرین گروهی قدرتی",
            description: "تمرین اصولی در کنار مربی، متناسب با سطح آمادگی شما.",
            sport: "بدنسازی",
            level: "مقدماتی",
            model: "group",
            pricingModel: "course",
            price: 1200000,
            currency: "IRR",
            capacity: 12,
            enrollmentCount: 8,
            remainingCapacity: 4,
            startDate: "2027-01-10",
            endDate: "2027-02-10",
            status: "active",
            enrollmentMode: "automatic",
            club: { id: "66d400000000000000000001", name: "باشگاه انرژی" },
            coach: { id: "66d400000000000000000021", name: "نگار احمدی" },
            branch: null,
            sessions: [],
            faqs: [],
          },
        },
      }),
  );
  await page.route("**/api/v1/athlete/club-classes", (route) =>
    route.fulfill({ json: { data: { items: [] } } }),
  );
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/discovery/business-classes/66d400000000000000000041");
  await expect(
    page.getByRole("heading", { name: "تمرین گروهی قدرتی", exact: true }),
  ).toBeVisible();
  await expect(page.locator("header")).toHaveCount(1);
  await expect(page.locator("[data-hero-scrim]")).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "ثبت‌نام", exact: true }),
  ).toBeEnabled();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(page.locator('[role="status"].bg-accent')).toHaveCount(0);
  await page.screenshot({
    path: testInfo.outputPath("business-class-375.png"),
  });
});
