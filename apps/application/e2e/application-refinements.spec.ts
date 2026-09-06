import { expect, test } from "@playwright/test";
import {
  createMockApiState,
  installApiMock,
  setBrowserSession,
} from "./support/mock-api";

test.beforeEach(async ({ page }) => {
  await installApiMock(page, createMockApiState());
  await setBrowserSession(page, true);
});

test("reservations hide navigation and expand the Persian month on pull down", async ({
  page,
}) => {
  await page.goto("/athlete/reservations");
  await expect(
    page.getByRole("button", { name: "نمایش کل ماه", exact: true }),
  ).toBeVisible();
  await expect(page.locator('nav a[href="/athlete/profile"]')).toHaveCount(0);
  await expect(page.locator("button[aria-pressed]")).toHaveCount(15); // 14 dates + history
  const calendar = page.getByRole("button", {
    name: "نمایش کل ماه",
    exact: true,
  });
  await page.evaluate(() => {
    document.querySelectorAll("*").forEach((element) => {
      element.scrollTop = 0;
    });
    window.scrollTo(0, 0);
  });
  await calendar.dispatchEvent("touchstart", {
    touches: [{ identifier: 0, clientX: 160, clientY: 160 }],
  });
  await calendar.dispatchEvent("touchend", {
    changedTouches: [{ identifier: 0, clientX: 162, clientY: 250 }],
  });
  await expect(
    page.getByRole("button", { name: "نمایش دو هفته", exact: true }),
  ).toBeVisible();
  const count = await page.locator(".grid-cols-7 button").count();
  expect(count).toBeGreaterThanOrEqual(29);
  expect(count).toBeLessThanOrEqual(31);
  await page.locator(".grid-cols-7 button").first().click();
  await expect(
    page.locator('.grid-cols-7 button[aria-pressed="true"]'),
  ).toHaveCount(1);
  await page
    .getByRole("button", { name: "نمایش دو هفته", exact: true })
    .click();
  await expect(page.locator("button[aria-pressed]")).toHaveCount(15);
});

test("navigation is visible on profile and hidden in its internal pages", async ({
  page,
}) => {
  await page.goto("/athlete/profile");
  await expect(page.locator('nav a[href="/athlete/profile"]')).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Toggle theme", exact: true }),
  ).toBeVisible();
  for (const path of [
    "/athlete/profile/edit",
    "/athlete/profile/image",
    "/athlete/profile/locations",
    "/athlete/settings",
  ]) {
    await page.goto(path);
    await expect(page.locator('nav a[href="/athlete/profile"]')).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Toggle theme", exact: true }),
    ).toHaveCount(0);
  }
});

test("avatar crop can be cancelled and uploads only the confirmed square", async ({
  page,
}) => {
  const uploads: string[] = [];
  await page.route("**/api/v1/media", async (route) => {
    const body = route.request().postDataJSON() as { url: string };
    uploads.push(body.url);
    await route.fulfill({
      json: {
        data: {
          id: "cropped-avatar",
          url: body.url,
          mimeType: "image/png",
          status: "ready",
        },
      },
    });
  });
  await page.goto("/athlete/profile/image");
  const data = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 100;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "red";
    context.fillRect(0, 0, 100, 100);
    context.fillStyle = "blue";
    context.fillRect(100, 0, 100, 100);
    return canvas.toDataURL("image/png").split(",")[1]!;
  });
  const file = {
    name: "portrait.png",
    mimeType: "image/png",
    buffer: Buffer.from(data, "base64"),
  };
  await page.locator('input[type="file"]').setInputFiles(file);
  await expect(page.getByRole("dialog", { name: "برش تصویر" })).toBeVisible();
  expect(uploads).toHaveLength(0);
  await page.getByRole("button", { name: "انصراف", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(uploads).toHaveLength(0);
  await page.locator('input[type="file"]').setInputFiles(file);
  await page.getByRole("button", { name: "تأیید برش", exact: true }).click();
  await expect.poll(() => uploads.length).toBe(1);
  const png = Buffer.from(uploads[0]!.split(",")[1]!, "base64");
  expect(png.readUInt32BE(16)).toBe(100);
  expect(png.readUInt32BE(20)).toBe(100);
});

test("discovery keeps the configured card dimensions while loading", async ({
  page,
}) => {
  const section = {
    id: "test-coaches",
    key: "featured-coaches",
    type: "coaches",
    position: 0,
    title: "مربی‌های منتخب",
    subtitle: "مربی مناسب تمرین شما",
    layout: "carousel",
    viewAllLabel: "مشاهده همه",
    viewAllUrl: "/discovery/coaches",
    appearance: {
      backgroundColor: "",
      textColor: "",
      accentColor: "",
      showHeader: true,
      showViewAll: true,
      headerAlignment: "start",
      viewAllVariant: "link",
    },
    items: [
      {
        id: "coach-1",
        slug: "coach-1",
        displayName: "مربی نمونه",
        shortBio: "تمرین تخصصی",
        experienceYears: 5,
        averageRating: 4,
        reviewsCount: 10,
        serviceModes: ["club"],
        avatarMediaId: null,
        coverMediaId: null,
        imageUrl: null,
      },
    ],
  };
  await page.addInitScript((layout) => {
    localStorage.setItem(
      "discovery-section-layouts-v1",
      JSON.stringify([layout]),
    );
  }, section);
  let release!: () => void;
  const ready = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/v1/discovery/sections", async (route) => {
    await ready;
    await route.fulfill({ json: { data: [section] } });
  });
  await page.goto("/discovery", { waitUntil: "domcontentloaded" });
  const root = page.locator('[data-discovery-section="test-coaches"]');
  await expect(root).toHaveClass(/discovery-section-skeleton/);
  await expect(root).toHaveAttribute("inert", "");
  const card = root.locator(".swiper-slide > *").first();
  await expect(card).toBeVisible();
  const before = await card.boundingBox();
  expect(before?.width).toBeCloseTo(276, 0);
  expect(before?.height).toBeCloseTo(367, 0);
  release();
  await expect(root).not.toHaveClass(/discovery-section-skeleton/);
  await expect(root.getByText("مربی نمونه", { exact: true })).toBeVisible();
  const after = await card.boundingBox();
  expect(after?.width).toBeCloseTo(before!.width, 0);
  expect(after?.height).toBeCloseTo(before!.height, 0);
});
