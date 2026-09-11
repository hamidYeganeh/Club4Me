import { expect, test } from "@playwright/test";
import type { PublicCatalogClass } from "@api/discovery";
import type { ClassEnrollment } from "@api";
import {
  createMockApiState,
  installApiMock,
  setBrowserSession,
} from "./support/mock-api";

const classFixture: PublicCatalogClass = {
  id: "sandow-strength",
  slug: "sandow-strength",
  title: "قدرت و آمادگی جسمانی",
  description:
    "یک دوره تمرین گروهی برای قوی‌تر شدن، بهبود استقامت و یادگیری اجرای درست حرکات. قدم‌به‌قدم تمرین می‌کنیم تا با اطمینان بیشتری به هدف ورزشی‌ات نزدیک شوی.",
  imageMediaId: null,
  imageUrl: "/profile/cover.jpg",
  sportId: "fitness",
  clubId: null,
  coachIds: [],
  deliveryMode: "club",
  capacity: 16,
  enrollmentCount: 12,
  courseStartAt: "2027-01-10T14:30:00Z",
  courseEndAt: "2027-02-10T14:30:00Z",
  registrationStartAt: null,
  registrationEndAt: null,
  price: { amount: 24000000, currency: "IRR" },
  venue: { address: "تهران، سعادت‌آباد، خیابان سرو، مجموعه ورزشی انرژی" },
  prerequisites: ["لباس و کفش مناسب تمرین", "همراه داشتن حوله و بطری آب"],
  faqs: [
    {
      question: "برای شروع باید تجربه تمرین داشته باشم؟",
      answer: "خیر، حرکات متناسب با سطح آمادگی هر شرکت‌کننده تنظیم می‌شوند.",
    },
  ],
  status: "published",
};

for (const theme of ["light", "dark"] as const) {
  test(`class demo ${theme}: brand, responsive layout and enrollment`, async ({
    page,
  }, testInfo) => {
    await installApiMock(page, createMockApiState());
    await setBrowserSession(page, true);
    await page.addInitScript(
      (value) => localStorage.setItem("theme", value),
      theme,
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    let enrollment: ClassEnrollment | null = null;
    await page.route(
      "**/api/v1/discovery/catalog/classes/sandow-strength",
      (route) => route.fulfill({ json: { data: classFixture } }),
    );
    await page.route("**/api/v1/athlete/enrollments", (route) =>
      route.fulfill({
        json: { data: { items: enrollment ? [enrollment] : [] } },
      }),
    );
    await page.route(
      "**/api/v1/athlete/classes/sandow-strength/enrollments",
      (route) => {
        enrollment = {
          id: "demo-enrollment",
          classId: classFixture.id,
          athleteId: "demo-athlete",
          coachId: "demo-coach",
          classTitle: classFixture.title,
          classSlug: classFixture.slug,
          courseStartAt: classFixture.courseStartAt,
          courseEndAt: classFixture.courseEndAt,
          deliveryMode: "club",
          venue: classFixture.venue,
          status: "pending",
          paymentStatus: "pending",
          priceSnapshot: classFixture.price,
          refundPercent: null,
          refundAmount: null,
          registeredAt: new Date().toISOString(),
        };
        return route.fulfill({ json: { data: enrollment } });
      },
    );
    await page.route(
      "**/api/v1/athlete/enrollments/demo-enrollment/mock-payment/approve",
      (route) => {
        enrollment = {
          ...enrollment!,
          status: "active",
          paymentStatus: "paid",
        };
        return route.fulfill({ json: { data: enrollment } });
      },
    );
    for (const width of [375, 820]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/discovery/classes/sandow-strength");
      await expect(
        page.getByRole("heading", { level: 1, name: classFixture.title }),
      ).toBeVisible();
      await expect(
        page.getByRole("status", { name: "Gym4Me", exact: true }),
      ).toHaveCount(0);
      await page.evaluate(() => document.fonts.ready);
      expect(
        await page.evaluate(() =>
          getComputedStyle(document.documentElement)
            .getPropertyValue("--accent")
            .match(/[\d.]+/g)
            ?.map(Number),
        ),
      ).toEqual(
        theme === "light"
          ? [87.44, 0.2457, 148.29]
          : [87.414, 0.24723, 148.054],
      );
      expect(
        await page
          .locator(".class-detail")
          .evaluate((el) => el.scrollWidth <= el.clientWidth),
      ).toBe(true);
      await expect(page.getByRole("progressbar")).toHaveAttribute(
        "aria-valuenow",
        "12",
      );
      await expect(
        page.getByText("روزهای کاری", { exact: true }),
      ).toBeVisible();
      await expect(page.getByText("وضعیت", { exact: true })).toBeVisible();
      await expect(page.getByText("امتیاز", { exact: true })).toBeVisible();
      await expect(
        page.getByRole("button", { name: "ثبت‌نام در کلاس", exact: true }),
      ).toBeEnabled();
      await page.screenshot({
        path: testInfo.outputPath(`class-${theme}-${width}.png`),
      });
      await page
        .getByRole("heading", { name: "درباره این کلاس" })
        .scrollIntoViewIfNeeded();
      await page.screenshot({
        path: testInfo.outputPath(`class-details-${theme}-${width}.png`),
      });
    }
    await page
      .getByRole("button", { name: "ثبت‌نام در کلاس", exact: true })
      .click();
    await expect(
      page.getByText("درگاه پرداخت آزمایشی", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "پرداخت موفق", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "ثبت‌نام شده", exact: true }),
    ).toBeDisabled();
    expect(enrollment).toMatchObject({ paymentStatus: "paid" });
  });
}
