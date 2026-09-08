import { expect, test } from "@playwright/test";
import {
  createMockApiState,
  installApiMock,
  setBrowserSession,
  publicClubFixture,
  reservationFixture,
} from "./support/mock-api";

for (const theme of ["light", "dark"] as const) {
  test(`more pages ${theme}: browse, club booking and reservation cancellation`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    const state = createMockApiState();
    const reservations = ["تمرین قدرتی در انرژی پلاس", "تمرین هوازی عصر"].map(
      (title, index) => ({
        ...reservationFixture(state.startsAt, state.endsAt, "reserved", "paid"),
        id: `demo-${index}`,
        sessionTitle: title,
      }),
    );
    await installApiMock(page, state);
    await setBrowserSession(page, true);
    await page.addInitScript(
      (value) => localStorage.setItem("theme", value),
      theme,
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.route("**/api/v1/discovery/catalog/classes?*", (route) => {
      const q = new URL(route.request().url()).searchParams.get("q");
      return route.fulfill({
        json: {
          data: {
            items: [
              {
                id: "strength",
                slug: "strength",
                title: q || "قدرت و آمادگی جسمانی",
                description: "تمرین گروهی برای قوی‌تر شدن و اجرای درست حرکات.",
                imageUrl: "/profile/cover.jpg",
                deliveryMode: "club",
                capacity: 16,
                enrollmentCount: 12,
                price: { amount: 24000000, currency: "IRR" },
                courseStartAt: "2027-01-10T14:30:00Z",
              },
              {
                id: "mobility",
                slug: "mobility",
                title: "حرکت و انعطاف",
                description: "تمرین‌های سبک برای تعادل، انعطاف و آرامش بیشتر.",
                imageUrl: null,
                deliveryMode: "online",
                capacity: 12,
                enrollmentCount: 5,
                price: { amount: 6000000, currency: "IRR" },
                courseStartAt: "2027-01-12T14:30:00Z",
              },
            ],
            total: 2,
            page: 1,
            limit: 20,
            totalPages: 1,
          },
        },
      });
    });
    await page.route("**/api/v1/discovery/business-classes*", (route) =>
      route.fulfill({ json: { data: { items: [], total: 0 } } }),
    );
    await page.route(
      "**/api/v1/public/clubs/66d400000000000000000001",
      (route) =>
        route.fulfill({
          json: {
            data: {
              ...publicClubFixture(),
              description:
                "جایی برای تمرین با تمرکز و انرژی. فضای مجهز تمرین قدرتی و هوازی، همراه با امکاناتی که مسیر ورزش را برایت ساده‌تر می‌کند.",
              gallery: [
                {
                  id: "gym",
                  url: "/profile/cover.jpg",
                  mimeType: "image/jpeg",
                },
              ],
              equipment: [
                {
                  equipmentId: "weights",
                  title: "وزنه آزاد",
                  quantity: 20,
                  icon: "dumbbell",
                },
              ],
              amenities: [
                {
                  amenityId: "locker",
                  title: "رختکن",
                  availability: "included",
                  icon: "building-1",
                },
              ],
              location: {
                ...publicClubFixture().location,
                address: "تهران، سعادت‌آباد، خیابان سرو",
              },
            },
          },
        }),
    );
    await page.route("**/api/v1/reservations", (route) =>
      route.fulfill({ json: { data: { items: reservations } } }),
    );
    await page.route("**/api/v1/reservations/demo-0/cancel", (route) => {
      reservations[0] = {
        ...reservations[0]!,
        status: "cancelled",
        paymentStatus: "refunded",
        refundPercent: 100,
        refundAmount: 500000,
      };
      return route.fulfill({ json: { data: reservations[0] } });
    });
    for (const width of [375, 820]) {
      await page.setViewportSize({ width, height: 900 });
      for (const [name, path, heading] of [
        ["classes", "/discovery/classes", "وقت یک تمرین تازه است."],
        ["club", "/discovery/clubs/energy-plus-demo", "باشگاه انرژی پلاس"],
        ["reservations", "/athlete/reservations", "برنامه تمرینت، یک‌جا"],
      ]) {
        await page.goto(path!);
        await expect(
          page.getByRole("heading", { name: heading!, exact: true }).first(),
        ).toBeVisible();
        await expect(
          page.getByRole("status", { name: "Gym4Me", exact: true }),
        ).toHaveCount(0);
        await page.evaluate(() => document.fonts.ready);
        if (name === "reservations")
          await expect(
            page.getByRole("button", {
              name: "لغو تمرین قدرتی در انرژی پلاس",
              exact: true,
            }),
          ).toBeVisible();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        await page.screenshot({
          path: testInfo.outputPath(`${name}-${theme}-${width}.png`),
        });
      }
    }
    await page
      .getByRole("button", {
        name: "لغو تمرین قدرتی در انرژی پلاس",
        exact: true,
      })
      .click();
    await expect(
      page.getByRole("heading", { name: "لغو رزرو", exact: true }),
    ).toBeVisible();
    await page.getByLabel("تغییر برنامه").check();
    await page
      .getByRole("button", { name: "تأیید لغو رزرو", exact: true })
      .click();
    await expect(
      page.getByText("بازپرداخت‌شده", { exact: true }),
    ).toBeVisible();
    expect(reservations[0]?.paymentStatus).toBe("refunded");
    await page.goto("/discovery/clubs/energy-plus-demo");
    await page
      .getByRole("button", { name: "همین حالا رزرو کن", exact: true })
      .last()
      .click();
    await expect(page).toHaveURL(/\/slots$/);
    await expect(page.getByRole("radiogroup")).toBeVisible();
    await page.goto("/discovery/classes");
    await page.getByRole("searchbox").fill("یوگا");
    await expect(
      page.getByRole("link", { name: "یوگا", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "یوگا", exact: true }),
    ).toHaveAttribute("href", "/discovery/classes/strength");
  });
}
