# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: application-refinements.spec.ts >> reservations hide navigation and expand the Persian month on pull down
- Location: e2e/application-refinements.spec.ts:13:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'نمایش کل ماه', exact: true })
Expected: visible
Timeout: 8000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('button', { name: 'نمایش کل ماه', exact: true }) with timeout 8000ms
  - waiting for getByRole('button', { name: 'نمایش کل ماه', exact: true })

```

```yaml
- status "Gym4Me":
  - img "Gym4Me"
- status "در حال بارگذاری محتوا":
  - status "در حال بارگذاری محتوا"
```

# Test source

```ts
  1   | import { expect, test } from "@playwright/test";
  2   | import {
  3   |   createMockApiState,
  4   |   installApiMock,
  5   |   setBrowserSession,
  6   | } from "./support/mock-api";
  7   | 
  8   | test.beforeEach(async ({ page }) => {
  9   |   await installApiMock(page, createMockApiState());
  10  |   await setBrowserSession(page, true);
  11  | });
  12  | 
  13  | test("reservations hide navigation and expand the Persian month on pull down", async ({
  14  |   page,
  15  | }) => {
  16  |   await page.goto("/athlete/reservations");
  17  |   await expect(
  18  |     page.getByRole("button", { name: "نمایش کل ماه", exact: true }),
> 19  |   ).toBeVisible();
      |     ^ Error: expect(locator).toBeVisible() failed
  20  |   await expect(page.locator('nav a[href="/athlete/profile"]')).toHaveCount(0);
  21  |   await expect(page.locator("button[aria-pressed]")).toHaveCount(15); // 14 dates + history
  22  |   const calendar = page.getByRole("button", {
  23  |     name: "نمایش کل ماه",
  24  |     exact: true,
  25  |   });
  26  |   await page.evaluate(() => {
  27  |     document.querySelectorAll("*").forEach((element) => {
  28  |       element.scrollTop = 0;
  29  |     });
  30  |     window.scrollTo(0, 0);
  31  |   });
  32  |   await calendar.dispatchEvent("touchstart", {
  33  |     touches: [{ clientX: 160, clientY: 160 }],
  34  |   });
  35  |   await calendar.dispatchEvent("touchend", {
  36  |     changedTouches: [{ clientX: 162, clientY: 250 }],
  37  |   });
  38  |   await expect(
  39  |     page.getByRole("button", { name: "نمایش دو هفته", exact: true }),
  40  |   ).toBeVisible();
  41  |   const count = await page.locator(".grid-cols-7 button").count();
  42  |   expect(count).toBeGreaterThanOrEqual(29);
  43  |   expect(count).toBeLessThanOrEqual(31);
  44  |   await page.locator(".grid-cols-7 button").first().click();
  45  |   await expect(
  46  |     page.locator('.grid-cols-7 button[aria-pressed="true"]'),
  47  |   ).toHaveCount(1);
  48  |   await page
  49  |     .getByRole("button", { name: "نمایش دو هفته", exact: true })
  50  |     .click();
  51  |   await expect(page.locator("button[aria-pressed]")).toHaveCount(15);
  52  | });
  53  | 
  54  | test("navigation is visible on profile and hidden in its internal pages", async ({
  55  |   page,
  56  | }) => {
  57  |   await page.goto("/athlete/profile");
  58  |   await expect(page.locator('nav a[href="/athlete/profile"]')).toBeVisible();
  59  |   for (const path of [
  60  |     "/athlete/profile/edit",
  61  |     "/athlete/profile/image",
  62  |     "/athlete/profile/locations",
  63  |     "/athlete/settings",
  64  |   ]) {
  65  |     await page.goto(path);
  66  |     await expect(page.locator('nav a[href="/athlete/profile"]')).toHaveCount(0);
  67  |   }
  68  | });
  69  | 
  70  | test("avatar crop can be cancelled and uploads only the confirmed square", async ({
  71  |   page,
  72  | }) => {
  73  |   const uploads: string[] = [];
  74  |   await page.route("**/api/v1/media", async (route) => {
  75  |     const body = route.request().postDataJSON() as { url: string };
  76  |     uploads.push(body.url);
  77  |     await route.fulfill({
  78  |       json: {
  79  |         data: {
  80  |           id: "cropped-avatar",
  81  |           url: body.url,
  82  |           mimeType: "image/png",
  83  |           status: "ready",
  84  |         },
  85  |       },
  86  |     });
  87  |   });
  88  |   await page.goto("/athlete/profile/image");
  89  |   const data = await page.evaluate(() => {
  90  |     const canvas = document.createElement("canvas");
  91  |     canvas.width = 200;
  92  |     canvas.height = 100;
  93  |     const context = canvas.getContext("2d")!;
  94  |     context.fillStyle = "red";
  95  |     context.fillRect(0, 0, 100, 100);
  96  |     context.fillStyle = "blue";
  97  |     context.fillRect(100, 0, 100, 100);
  98  |     return canvas.toDataURL("image/png").split(",")[1]!;
  99  |   });
  100 |   const file = {
  101 |     name: "portrait.png",
  102 |     mimeType: "image/png",
  103 |     buffer: Buffer.from(data, "base64"),
  104 |   };
  105 |   await page.locator('input[type="file"]').setInputFiles(file);
  106 |   await expect(page.getByRole("dialog", { name: "برش تصویر" })).toBeVisible();
  107 |   expect(uploads).toHaveLength(0);
  108 |   await page.getByRole("button", { name: "انصراف", exact: true }).click();
  109 |   await expect(page.getByRole("dialog")).toHaveCount(0);
  110 |   expect(uploads).toHaveLength(0);
  111 |   await page.locator('input[type="file"]').setInputFiles(file);
  112 |   await page.getByRole("button", { name: "تأیید برش", exact: true }).click();
  113 |   await expect.poll(() => uploads.length).toBe(1);
  114 |   const png = Buffer.from(uploads[0]!.split(",")[1]!, "base64");
  115 |   expect(png.readUInt32BE(16)).toBe(100);
  116 |   expect(png.readUInt32BE(20)).toBe(100);
  117 | });
  118 | 
```