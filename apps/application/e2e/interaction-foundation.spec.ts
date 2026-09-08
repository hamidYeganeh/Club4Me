import { expect, test } from "@playwright/test";
import {
  createMockApiState,
  installApiMock,
  setBrowserSession,
} from "./support/mock-api";

test("header back uses the route parent instead of browser history", async ({
  page,
}) => {
  await installApiMock(page, createMockApiState());
  await setBrowserSession(page, true);
  await page.goto("/athlete/settings");
  await page.getByRole("button", { name: "بازگشت" }).click();
  await expect(page).toHaveURL(/\/athlete\/profile$/);

  await page.goto("/discovery/articles/unavailable");
  await page.getByRole("button", { name: "بازگشت" }).click();
  await expect(page).toHaveURL(/\/discovery\/articles$/);
});

test("splash appears once per app session and route links do not prefetch", async ({
  page,
}) => {
  const prefetched: string[] = [];
  page.on("request", (request) => {
    if (request.headers()["next-router-prefetch"] === "1")
      prefetched.push(request.url());
  });
  await page.goto("/welcome");
  await expect(page.getByRole("status", { name: "Gym4Me" })).toBeVisible();
  await expect(page.getByRole("status", { name: "Gym4Me" })).toHaveCount(0);
  await page.getByRole("button", { name: "شروع کنید" }).click();
  await expect(page.getByRole("status", { name: "Gym4Me" })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("status", { name: "Gym4Me" })).toHaveCount(0);
  expect(prefetched).toEqual([]);
});

test("profile image opens the system picker without a redundant permission sheet", async ({
  page,
}) => {
  await installApiMock(page, createMockApiState());
  await setBrowserSession(page, true);
  await page.goto("/athlete/profile/image");
  const chooser = page.waitForEvent("filechooser");
  await page
    .getByRole("button", { name: /تغییر تصویر|تصویر/ })
    .last()
    .click();
  await chooser;
  await expect(page.getByText("دسترسی به دوربین", { exact: true })).toHaveCount(
    0,
  );
});
