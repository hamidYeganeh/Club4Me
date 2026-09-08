import { expect, test } from "@playwright/test";
import { defaultDiscoveryLayouts } from "../modules/discovery/components/discovery-default-layouts";
import {
  createMockApiState,
  installApiMock,
  setBrowserSession,
} from "./support/mock-api";

import { feed } from "./support/discovery-feed";

for (const { width, theme } of [
  { width: 360, theme: "light" },
  { width: 430, theme: "dark" },
  { width: 576, theme: "light" },
]) {
  test(`all discovery skeletons match their sections at ${width}px in ${theme}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await installApiMock(page, createMockApiState());
    await setBrowserSession(page, true);
    await page.addInitScript(
      ({ layouts, theme }) => {
        localStorage.setItem(
          "discovery-section-layouts-v1",
          JSON.stringify(layouts),
        );
        localStorage.setItem("theme", theme);
      },
      { layouts: defaultDiscoveryLayouts, theme },
    );
    let release!: () => void;
    const ready = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route("**/api/v1/discovery/sections", async (route) => {
      await ready;
      await route.fulfill({ json: { data: feed } });
    });
    await page.route("**/api/v1/geography/provinces*", async (route) => {
      await ready;
      await route.fulfill({
        json: {
          data: {
            items: [
              { id: "tehran", name: "تهران", slug: "tehran", clubsCount: 12 },
            ],
            total: 1,
          },
        },
      });
    });
    await page.goto("/discovery", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-discovery-section]")).toHaveCount(
      defaultDiscoveryLayouts.length,
    );
    await expect(
      page.locator('[data-skeleton-section="iran-map"] path'),
    ).toHaveCount(31);
    await page.evaluate(() => document.fonts.ready);
    await expect(
      page.getByRole("status", { name: "Gym4Me", exact: true }),
    ).toHaveCount(0);
    await expect(page.locator("[data-discovery-section] img")).toHaveCount(0);
    await expect(
      page.locator(
        '[data-discovery-section="featured-coaches"] [data-skeleton-card]',
      ),
    ).toHaveCount(3);

    async function measure() {
      return page.locator("[data-discovery-section]").evaluateAll((elements) =>
        elements.map((element) => {
          const section = element.querySelector("section")!;
          const card =
            element.querySelector("[data-skeleton-card]") ??
            element.querySelector(".swiper-slide > *") ??
            element.querySelector('[class*="w-max"] > *');
          const title = card!.querySelector(
            '[data-slot="card-title"], h3, strong',
          )!;
          const titleRect = title.getBoundingClientRect();
          const sectionRect = section.getBoundingClientRect(),
            cardRect = card!.getBoundingClientRect();
          return {
            id: element.getAttribute("data-discovery-section")!,
            sectionWidth: sectionRect.width,
            sectionHeight: sectionRect.height,
            cardWidth: cardRect.width,
            cardHeight: cardRect.height,
            cardTop: cardRect.top - sectionRect.top,
            titleTop: titleRect.top - cardRect.top,
            titleHeight: titleRect.height,
          };
        }),
      );
    }
    const before = await measure();
    const beforeMap = await page
      .locator('[data-skeleton-section="iran-map"] svg')
      .boundingBox();
    if (width === 430) {
      for (const id of [
        "top-rated-clubs",
        "featured-coaches",
        "featured-classes",
        "latest-articles",
        "article-library",
        "popular-sports",
        "discovery-portrait-stories",
      ]) {
        await page.locator(`[data-discovery-section="${id}"]`).screenshot({
          style: "nav, nextjs-portal { visibility: hidden !important; }",
          path: testInfo.outputPath(`${id}-skeleton.png`),
        });
      }
      await page.locator('[data-skeleton-section="iran-map"]').screenshot({
        style: "nav, nextjs-portal { visibility: hidden !important; }",
        path: testInfo.outputPath("iran-map-skeleton.png"),
      });
    }
    release();
    await expect(page.locator("[data-skeleton-card]")).toHaveCount(0);
    await expect(
      page.locator('[data-skeleton-section="iran-map"]'),
    ).toHaveCount(0);
    const after = await measure();
    const afterMap = await page
      .locator('svg[aria-label="نقشه ایران با مرزبندی ۳۱ استان"]')
      .boundingBox();
    expect(Math.abs(afterMap!.width - beforeMap!.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(afterMap!.height - beforeMap!.height)).toBeLessThanOrEqual(
      1,
    );
    for (const expected of before) {
      const actual = after.find((item) => item.id === expected.id)!;
      for (const property of [
        "sectionWidth",
        "sectionHeight",
        "cardWidth",
        "cardHeight",
        "cardTop",
        "titleTop",
        "titleHeight",
      ] as const) {
        expect
          .soft(
            Math.abs(actual[property] - expected[property]),
            `${expected.id}: ${property} skeleton=${expected[property]} loaded=${actual[property]}`,
          )
          .toBeLessThanOrEqual(1);
      }
    }
    if (width === 430)
      await page
        .locator('[data-discovery-section="article-library"]')
        .screenshot({
          style: "nav, nextjs-portal { visibility: hidden !important; }",
          path: testInfo.outputPath("article-library-loaded.png"),
        });
  });
}
