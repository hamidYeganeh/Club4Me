import { expect, test } from "@playwright/test";
import { defaultDiscoveryLayouts } from "../modules/discovery/components/discovery-default-layouts";
import {
  createMockApiState,
  installApiMock,
  setBrowserSession,
} from "./support/mock-api";

for (const theme of ["light", "dark"]) {
  test(`clubs cards display API results and navigate in ${theme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await installApiMock(page, createMockApiState());
    await setBrowserSession(page, true);
    await page.addInitScript(
      (theme) => localStorage.setItem("theme", theme),
      theme,
    );
    const layout = defaultDiscoveryLayouts.find(
      (item) => item.layout === "cards",
    )!;
    await page.route("**/api/v1/discovery/sections", (route) =>
      route.fulfill({
        json: {
          data: [
            {
              ...layout,
              items: [0, 1, 2].map((index) => ({
                id: `club-${index}`,
                slug: `club-${index}`,
                name: `باشگاه ${index}`,
                imageUrl: "/discovery/locations/city-modern.jpg",
                averageRating: 4.5,
                reviewsCount: 12,
                sportIds: [],
                tags: [],
                shortDescription: "",
                coverMediaId: null,
                logoMediaId: null,
              })),
            },
          ],
        },
      }),
    );
    await page.goto("/discovery");
    const section = page.locator(
      '[data-discovery-section="discover-clubs-cards"]',
    );
    await expect(section.locator(".swiper-cards")).toBeVisible();
    await expect(section.locator(".swiper-slide-active")).toContainText(
      "باشگاه 0",
    );
    await section
      .getByRole("button", { name: "نمایش باشگاه 2", exact: true })
      .click();
    await expect(section.locator(".swiper-slide-active")).toContainText(
      "باشگاه 1",
    );
    await expect(section.locator(".swiper-slide-active a")).toHaveAttribute(
      "href",
      "/discovery/clubs/club-1",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });
}
