import { test, expect } from "@playwright/test";
import {
  createMockApiState,
  installApiMock,
  setBrowserSession,
} from "./support/mock-api";

test("recipient sees club and role, accepts once and can open the staff portal", async ({
  page,
}) => {
  const state = createMockApiState();
  await installApiMock(page, state);
  await setBrowserSession(page, true);
  let status = "invited",
    writes = 0;
  await page.route("**/api/v1/club-memberships/invite**", async (route) => {
    if (route.request().method() === "PATCH") {
      status = "accepted";
      writes++;
    }
    await route.fulfill({
      json: {
        data: {
          id: "invite",
          clubId: "club",
          clubName: "باشگاه انرژی",
          userId: state.user.id,
          role: "receptionist",
          permissions: ["students.read", "attendance.write"],
          status,
        },
      },
    });
  });
  await page.goto("/club-memberships/invite");
  await expect(
    page.getByText("دعوت همکاری با باشگاه انرژی", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/نقش شما: پذیرش/)).toBeVisible();
  await page.getByRole("button", { name: "پذیرش دعوت", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "ورود به محیط پرسنل", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "پذیرش دعوت", exact: true }),
  ).toBeDisabled();
  expect(writes).toBe(1);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "ورود به محیط پرسنل", exact: true }),
  ).toBeVisible();
});
test("a guest is sent to login with their invitation preserved", async ({
  page,
}) => {
  await installApiMock(page, createMockApiState());
  await setBrowserSession(page, false);
  await page.goto("/club-memberships/invite");
  await expect(page).toHaveURL(/\/auth/);
  expect(
    await page.evaluate(
      () =>
        JSON.parse(sessionStorage.getItem("gym4me.auth.return") ?? "null")
          ?.path,
    ),
  ).toBe("/club-memberships/invite");
});
