import { expect, test } from "@playwright/test";
import { emptyCoachProfessionalProfile } from "@api";
import { createMockApiState, installApiMock } from "./support/mock-api";
for (const theme of ["light", "dark"] as const) {
 test(`consistent pages ${theme}: forms, workspace and onboarding`, async ({ page }, testInfo) => {
 test.setTimeout(180_000);
    const state = createMockApiState();
    state.user.roles = ["athlete", "coach"];
    await installApiMock(page, state);
    await page.addInitScript(() => {
      const welcome = location.pathname.startsWith("/welcome");
      if (welcome) {
        localStorage.removeItem("gym4me.welcome.seen");
        localStorage.removeItem("gym4me.accessToken");
        localStorage.removeItem("gym4me.refreshToken");
      } else {
        localStorage.setItem("gym4me.welcome.seen", "1");
        localStorage.setItem("gym4me.accessToken", "e2e-access-token");
        localStorage.setItem("gym4me.refreshToken", "e2e-refresh-token");
      }
    });
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
        ["welcome", "/welcome"], ["introduce", "/welcome/introduce"], ["auth", "/auth"],
        ["class", "/coach/classes/new"], ["service", "/coach/services/new"],
        ["professional", "/coach/profile/professional"], ["workspace", "/coach/reservations"], ["not-found", "/missing-design-page"],
      ]) {
        await page.goto(path!);
        await expect(page.getByRole("status", { name: "Gym4Me", exact: true })).toHaveCount(0);
        await expect(page.locator("header").first()).toBeVisible();
        await expect(page).toHaveURL(new RegExp(`${path}$`));
        if (["class", "service", "professional"].includes(name!)) {
          await expect(page.getByRole("navigation", { name: "بخش‌های فرم" })).toBeVisible();
          await expect(page.locator(".form-section-heading")).toHaveCount(3);
          expect((await page.locator(".form-section-navigation").boundingBox())!.height).toBeGreaterThanOrEqual(60);
        }
        if (name === "workspace") {
          const nav = page.getByRole("navigation", { name: "بخش‌های مدیریت رزرو" });
          await expect(nav).toBeVisible();
          await expect(page.getByText("درخواست‌ها و رزروها", {exact:true})).toBeVisible();
          await expect(page.getByText("ساخت سانس آزاد", {exact:true})).toBeHidden();
          await nav.getByRole("button", {name:"جلسات", exact:true}).click();
          await expect(page.getByText("ساخت سانس آزاد", {exact:true})).toBeVisible();
          await nav.getByRole("button", {name:"رزروها", exact:true}).click();
        }
        await page.evaluate(async () => { await document.fonts.ready; await Promise.all(Array.from(document.images).map(i => i.decode().catch(() => {}))); });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name}-${width}`).toBe(true);
        await page.screenshot({path:testInfo.outputPath(`${name}-${theme}-${width}.png`)});
      }
    }
    await page.goto("/coach/classes/new");
    const title = page.getByLabel("نام کلاس", {exact:true});
    await title.fill("کلاس آزمایشی قدرت");
    await page.getByRole("link", {name:/زمان و هزینه/}).click();
    await expect(page.locator("#class-schedule")).toBeInViewport();
    await expect(title).toHaveValue("کلاس آزمایشی قدرت");
    expect(errors).toEqual([]);
 });
}
