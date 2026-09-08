import { test, expect, type Page } from "@playwright/test";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname } from "node:path";
import {
  createMockApiState,
  installApiMock,
  setBrowserSession,
} from "../../e2e/support/mock-api";

const ORIGIN = "https://localhost";
const CLUB = "66d400000000000000000001";
const RESERVATION = "66d700000000000000000001";
const output = resolve(process.cwd(), "out");

async function installNativeFiles(page: Page) {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      get: () => sessionStorage.getItem("test:offline") !== "1",
    }),
  );
  // Model Capacitor's on-device file server: these files remain accessible without network.
  await page.route(`${ORIGIN}/**`, async (route) => {
    const url = new URL(route.request().url());
    let file = resolve(output, `.${decodeURIComponent(url.pathname)}`);
    if (!file.startsWith(`${output}/`) && file !== output) return route.abort();
    const exists = await stat(file).catch(() => null);
    if (!exists?.isFile()) file = resolve(output, "index.html");
    const mime: Record<string, string> = {
      ".html": "text/html",
      ".js": "application/javascript",
      ".css": "text/css",
      ".json": "application/json",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".svg": "image/svg+xml",
      ".woff2": "font/woff2",
    };
    return route.fulfill({
      status: 200,
      contentType: mime[extname(file)] ?? "application/octet-stream",
      body: await readFile(file),
    });
  });
}

async function waitForCache(page: Page, expected = '"me"') {
  await expect
    .poll(() =>
      page.evaluate(async (expected) => {
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open("gym4me-offline-v1", 1);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        const values = await new Promise<unknown[]>((resolve) => {
          const request = db
            .transaction("records")
            .objectStore("records")
            .getAll();
          request.onsuccess = () => resolve(request.result);
        });
        db.close();
        return JSON.stringify(values).includes(expected);
      }, expected),
    )
    .toBe(true);
}

test("reopens an authenticated native route offline and resolves an unvisited reservation ID locally", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const state = createMockApiState();
  let offline = false;
  await installNativeFiles(page);
  await installApiMock(page, state);
  await page.route("**/api/v1/**", async (route) =>
    offline ? route.abort("internetdisconnected") : route.fallback(),
  );
  await setBrowserSession(page, true);
  await page.goto(`${ORIGIN}/auth`);
  await page.evaluate(async () => {
    await fetch("https://api.gym4me.ir/api/v1/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
  });
  await page.goto(`${ORIGIN}/athlete/reservations`);
  await expect(page.getByText("سانس تست باشگاه").first()).toBeVisible();
  await waitForCache(page);
  await waitForCache(page, RESERVATION);
  offline = true;
  await page.evaluate(() => sessionStorage.setItem("test:offline", "1"));
  await context.setOffline(true);
  await page.goto(`${ORIGIN}/athlete/reservations/${RESERVATION}?source=club`);
  await expect(
    page.getByRole("heading", { name: "جزئیات رزرو", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("سانس تست باشگاه").first()).toBeVisible();
  await expect(
    page.getByText("اینترنت قطع است؛ بعضی اطلاعات ممکن است به‌روز نباشند."),
  ).toBeVisible();
  await expect(page.locator('[data-state="offline"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("saves a favorite offline, survives a restart, then syncs once connectivity returns", async ({
  page,
  context,
}) => {
  const state = createMockApiState();
  let offline = false;
  let saved = false;
  let writes = 0;
  await installNativeFiles(page);
  await installApiMock(page, state);
  await page.route("**/api/v1/**", async (route) => {
    if (offline) return route.abort("internetdisconnected");
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith(`/saves/club/${CLUB}`)) {
      writes++;
      saved = route.request().method() === "PUT";
      return route.fulfill({
        json: {
          data: saved
            ? {
                id: "saved-id",
                entityType: "club",
                entityId: CLUB,
                createdAt: new Date().toISOString(),
              }
            : { success: true },
        },
      });
    }
    if (path.endsWith("/saves"))
      return route.fulfill({
        json: {
          data: {
            items: saved
              ? [
                  {
                    id: "saved-id",
                    entityType: "club",
                    entityId: CLUB,
                    createdAt: new Date().toISOString(),
                  },
                ]
              : [],
          },
        },
      });
    return route.fallback();
  });
  await setBrowserSession(page, true);
  await page.goto(`${ORIGIN}/discovery/clubs/energy-plus-demo`);
  const save = page
    .getByRole("button", { name: "ذخیره کردن", exact: true })
    .last();
  await expect(save).toBeEnabled();
  await waitForCache(page, '"public","clubs"');
  offline = true;
  await page.evaluate(() => sessionStorage.setItem("test:offline", "1"));
  await context.setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));
  await save.click();
  await expect(
    page
      .getByRole("button", { name: "حذف از ذخیره‌شده‌ها", exact: true })
      .last(),
  ).toBeVisible();
  await expect(page.getByText(/در انتظار همگام‌سازی/)).toBeVisible();
  expect(writes).toBe(0);
  await page.waitForTimeout(350);
  await page.reload();
  await expect(
    page
      .getByRole("button", { name: "حذف از ذخیره‌شده‌ها", exact: true })
      .last(),
  ).toBeVisible();
  offline = false;
  await page.evaluate(() => sessionStorage.removeItem("test:offline"));
  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect.poll(() => writes).toBe(1);
  await expect(page.getByText(/در انتظار همگام‌سازی/)).toHaveCount(0);
});

test("a different account cannot restore the previous account's cached profile", async ({
  page,
}) => {
  const state = createMockApiState();
  await installNativeFiles(page);
  await installApiMock(page, state);
  await setBrowserSession(page);
  await page.goto(`${ORIGIN}/auth`);
  await page.evaluate(() => {
    localStorage.setItem("gym4me.accessToken", "account-a");
    localStorage.setItem("gym4me.refreshToken", "refresh-a");
  });
  await page.goto(`${ORIGIN}/athlete/profile`);
  await waitForCache(page);
  await page.evaluate(() => {
    localStorage.setItem("gym4me.accessToken", "account-b");
    localStorage.setItem("gym4me.refreshToken", "refresh-b");
  });
  await page.route("**/api/v1/**", (route) =>
    route.abort("internetdisconnected"),
  );
  await page.goto(`${ORIGIN}/athlete/profile`);
  await expect(page.locator("[data-state]")).toBeVisible();
  await expect(page.getByText("کاربر آزمایشی", { exact: true })).toHaveCount(0);
});

test("bundled Persian and brand fonts load without Google requests", async ({
  page,
}) => {
  await installNativeFiles(page);
  await installApiMock(page, createMockApiState());
  await setBrowserSession(page, true);
  const externalFonts: string[] = [];
  page.on("request", (request) => {
    if (/fonts\.(googleapis|gstatic)\.com/.test(request.url()))
      externalFonts.push(request.url());
  });
  await page.goto(`${ORIGIN}/athlete/memberships`);
  await expect(
    page.getByRole("heading", { name: "بسته‌ها و عضویت‌های من" }),
  ).toBeVisible();
  const loaded = await page.evaluate(async () => {
    const persian = await document.fonts.load('16px "IRANSansX"');
    const brand = await document.fonts.load('16px "Monoton"');
    return [persian.length, brand.length];
  });
  expect(loaded).toEqual([1, 1]);
  expect(externalFonts).toEqual([]);
});

test("native search restores shared filters and keeps the query when opening filters", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await installNativeFiles(page);
  await installApiMock(page, createMockApiState());
  await setBrowserSession(page, true);
  const params = new URLSearchParams({
    q: "یوگا",
    kind: "class",
    nearby: "0",
    maxPrice: "100000",
    serviceMode: "online",
    admission: "automatic",
    startsFrom: "2026-09-01",
    skillLevelId: "66d400000000000000000099",
  });
  await page.goto(`${ORIGIN}/discovery/search?${params}`);
  await expect(
    page.getByRole("searchbox", { name: "جست‌وجو در دیسکاوری" }),
  ).toHaveValue("یوگا");
  await page
    .getByRole("button", { name: "فیلتر نوع نتیجه", exact: true })
    .click();
  await expect(
    page.getByRole("searchbox", { name: "جست‌وجو در دیسکاوری" }),
  ).toHaveValue("یوگا");
  await expect(
    page.getByLabel("حداکثر بودجه (ریال)", { exact: true }),
  ).toHaveValue("100000");
  await page.getByLabel("حداکثر بودجه (ریال)", { exact: true }).fill("200000");
  await expect
    .poll(() => new URL(page.url()).searchParams.get("maxPrice"))
    .toBe("200000");
  await page.reload();
  await page
    .getByRole("button", { name: "فیلتر نوع نتیجه", exact: true })
    .click();
  await expect(
    page.getByLabel("حداکثر بودجه (ریال)", { exact: true }),
  ).toHaveValue("200000");
  expect(new URL(page.url()).searchParams.get("admission")).toBe("automatic");
  expect(new URL(page.url()).searchParams.get("startsFrom")).toBe("2026-09-01");
  expect(new URL(page.url()).searchParams.get("skillLevelId")).toBe(
    "66d400000000000000000099",
  );
  await page
    .getByRole("button", { name: "پاک‌کردن فیلترها", exact: true })
    .click();
  await expect
    .poll(() => new URL(page.url()).searchParams.has("maxPrice"))
    .toBe(false);
  await expect(
    page.getByRole("searchbox", { name: "جست‌وجو در دیسکاوری" }),
  ).toHaveValue("یوگا");
  expect(errors).toEqual([]);
});
