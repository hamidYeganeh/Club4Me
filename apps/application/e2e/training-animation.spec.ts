import { test, expect } from "@playwright/test";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  createMockApiState,
  installApiMock,
  setBrowserSession,
} from "./support/mock-api";

const root = resolve(
  process.cwd(),
  "../../data/exercise-catalog/runs/vital-active",
);
test("Vital library lazily loads a real local animation with authentication", async ({
  page,
}, info) => {
  test.skip(
    !existsSync(resolve(root, "media/0051.mp4")),
    "Private licensed test package not installed",
  );
  await installApiMock(page, createMockApiState());
  await setBrowserSession(page, true);
  await page.addInitScript(() =>
    sessionStorage.setItem("gym4me.splash.shown", "1"),
  );
  await page.route("**/api/v1/training/exercises", (r) =>
    r.fulfill({
      json: {
        data: {
          items: [
            {
              id: "vital:0051",
              name: "فلای دستگاه پک‌دک",
              muscle: "سینه",
              equipment: "دستگاه",
              instructions: "Source guide",
              instructionsLanguage: "en",
              animation: true,
              attribution: {
                publisher: "Vital Animations",
                licenseUrl: "https://vitalanimations.com/license",
              },
            },
          ],
        },
      },
    }),
  );
  let requests = 0;
  await page.route("**/api/v1/training/exercises/*/animation", (r) => {
    requests++;
    expect(r.request().headers().authorization).toMatch(/^Bearer /);
    return r.fulfill({
      contentType: "video/mp4",
      body: readFileSync(resolve(root, "media/0051.mp4")),
    });
  });
  await page.goto("/athlete/training/exercises");
  await expect(
    page.getByText("فلای دستگاه پک‌دک", { exact: true }),
  ).toBeVisible();
  expect(requests).toBe(0);
  await page.getByRole("button", { name: "نمایش انیمیشن حرکت" }).click();
  const video = page.getByLabel("انیمیشن فلای دستگاه پک‌دک");
  await expect(video).toBeVisible();
  await expect(video).toHaveAttribute("src", /^blob:/);
  await expect(video).toHaveJSProperty("loop", true);
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.readyState))
    .toBeGreaterThanOrEqual(2);
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime))
    .toBeGreaterThan(0);
  expect(requests).toBe(1);
  await page.screenshot({
    path: info.outputPath("vital-animation.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "بستن انیمیشن" }).click();
  await expect(video).toHaveCount(0);
});
