import { test, expect } from "@playwright/test";
import {
  publicClubFixture,
  setBrowserSession,
} from "../../application/e2e/support/mock-api";

test("owner edits the complete court model and persists gallery order after reload", async ({
  page,
}) => {
  const club = publicClubFixture();
  const imageIds = ["66d400000000000000000061", "66d400000000000000000062"];
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  let saved = {
    id: "66d400000000000000000071",
    clubId: club.id,
    name: "زمین تنیس",
    code: "T-1",
    description: "زمین اصلی",
    courtTypeId: "66d400000000000000000081",
    sportIds: ["66d400000000000000000082"],
    surfaceTypeId: "66d400000000000000000083",
    capacity: 8,
    environment: "outdoor",
    lengthMeters: 24,
    widthMeters: 12,
    locationLabel: "حیاط غربی",
    floor: "همکف",
    minimumReservationMinutes: 60,
    maximumReservationMinutes: 180,
    preparationMinutes: 10,
    cleanupMinutes: 15,
    isReservable: true,
    status: "active",
    galleryMediaIds: imageIds,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
  let writes = 0;
  await setBrowserSession(page, true);
  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    let data: unknown = { items: [] };
    if (path.endsWith("/business/me") || path.endsWith("/account/me"))
      data = {
        id: club.ownerId,
        phone: "09120000001",
        firstName: "مالک",
        lastName: "آزمایشی",
        roles: ["owner"],
        hasPassword: true,
        status: "active",
      };
    else if (path === `/api/v1/business/clubs/${club.id}`) data = club;
    else if (path === `/api/v1/business/clubs/${club.id}/courts`)
      data = { items: [saved] };
    else if (path === `/api/v1/business/clubs/${club.id}/courts/${saved.id}`) {
      const body = route.request().postDataJSON();
      expect(body).toMatchObject({
        name: "زمین روباز جدید",
        courtTypeId: saved.courtTypeId,
        sportIds: saved.sportIds,
        surfaceTypeId: saved.surfaceTypeId,
        lengthMeters: 24,
        widthMeters: 13,
        galleryMediaIds: [imageIds[1]],
        isReservable: false,
        status: "active",
        expectedUpdatedAt: saved.updatedAt,
      });
      expect(body).not.toHaveProperty("clubId");
      const fields = { ...body };
      delete fields.expectedUpdatedAt;
      saved = { ...saved, ...fields, updatedAt: "2026-09-07T00:00:00.000Z" };
      writes++;
      data = saved;
    } else if (path.endsWith("/media")) {
      expect(url.searchParams.get("ids")).toContain(imageIds[1]);
      data = {
        items: imageIds.map((id) => ({
          id,
          url: "/icon.png",
          mimeType: "image/png",
          status: "ready",
        })),
      };
    } else if (path.includes("/resources/") || path.includes("/catalog/"))
      data = { items: [], total: 0, page: 1, totalPages: 0 };
    await route.fulfill({ json: { data } });
  });
  await page.goto(`/clubs/${club.id}/reservations`);
  await page
    .getByRole("button", { name: "ویرایش زمین زمین تنیس", exact: true })
    .click();
  const form = page.getByRole("form", { name: "ویرایش زمین", exact: true });
  await form.getByLabel("نام زمین", { exact: true }).fill("زمین روباز جدید");
  await form.getByLabel("عرض (متر)", { exact: true }).fill("13");
  await form.getByRole("button", { name: "جلو بردن تصویر 2" }).click();
  await form.getByRole("button", { name: "حذف تصویر 2" }).click();
  await form.getByLabel("پذیرش رزرو جدید").uncheck();
  await form.getByRole("button", { name: "ذخیره تغییرات زمین" }).click();
  await expect.poll(() => writes).toBe(1);
  await page.reload();
  await page
    .getByRole("button", { name: "ویرایش زمین زمین روباز جدید", exact: true })
    .click();
  await expect(form.getByLabel("عرض (متر)", { exact: true })).toHaveValue("13");
  await expect(form.getByLabel("پذیرش رزرو جدید")).not.toBeChecked();
  await expect(form.getByRole("img", { name: "تصویر زمین 1" })).toBeVisible();
  await expect(form.getByRole("button", { name: "حذف تصویر 2" })).toHaveCount(
    0,
  );
  expect(errors).toEqual([]);
});
