import { expect, test } from "@playwright/test";
import { emptyCoachProfessionalProfile, type CoachProfile } from "@api";
import {
  createMockApiState,
  installApiMock,
  setBrowserSession,
} from "./support/mock-api";

const coachId = "66d400000000000000000021";
const sportId = "66d400000000000000000022";
const profileFixture = (): CoachProfile => ({
  id: coachId,
  userId: "user-1",
  slug: "professional-coach",
  displayName: "مربی آزمایشی",
  shortBio: "مربی تمرین قدرتی",
  bio: "آموزش اصولی با تمرکز بر اجرای صحیح حرکات",
  experienceYears: 8,
  galleryMediaIds: [],
  specialties: [],
  trainingStyles: [],
  experienceSummary: "",
  experience: [],
  faqs: [],
  languages: ["فارسی", "انگلیسی"],
  serviceModes: ["club", "online"],
  contact: { phone: "09120000000", instagram: "https://instagram.com/coach" },
  reviewStatus: "approved",
  visibility: "public",
  rejectionReason: null,
  professionalProfile: emptyCoachProfessionalProfile(),
});

test("coach saves professional details, keeps existing sports and sees them on the public profile", async ({
  page,
}) => {
  const state = createMockApiState();
  state.user.roles = ["coach"];
  await installApiMock(page, state);
  await setBrowserSession(page, true);
  let saved = profileFixture();
  let saves = 0;
  let sportWrites = 0;
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/api/v1/coach/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/profile")) {
      if (route.request().method() === "PATCH") {
        saved = { ...saved, ...route.request().postDataJSON() };
        saves++;
      }
      return route.fulfill({ json: { data: saved } });
    }
    if (path.endsWith("/sports")) {
      if (route.request().method() === "PUT") sportWrites++;
      return route.fulfill({
        json: {
          data: {
            items: [
              {
                id: "coach-sport",
                coachId,
                sportId,
                specialtyIds: [],
                experienceYears: 8,
                certificateMediaIds: ["66d400000000000000000023"],
                achievements: ["قهرمانی"],
              },
            ],
          },
        },
      });
    }
    return route.fulfill({ json: { data: { items: [] } } });
  });
  await page.route(
    "**/api/v1/discovery/catalog/coaches/professional-coach",
    (route) =>
      route.fulfill({
        json: {
          data: {
            ...saved,
            imageUrl: null,
            portfolio: [],
            averageRating: 0,
            reviewsCount: 0,
          },
        },
      }),
  );
  await page.route("**/api/v1/public/coaches/**", (route) =>
    route.fulfill({ json: { data: { items: [] } } }),
  );
  await page.route(/\/api\/v1\/media\/(?:private\/)?upload$/, (route) =>
    route.fulfill({
      json: {
        data: {
          id: "66d400000000000000000024",
          url: "https://example.com/certificate.png",
          status: "ready",
        },
      },
    }),
  );
  await page.goto("/coach/profile/professional");
  await page
    .getByLabel("مناسب چه کسانی است؟")
    .fill("بزرگسالانی که تمرین را از پایه شروع می‌کنند");
  await page.getByLabel("هدف‌های تمرین").fill("افزایش قدرت، یادگیری تکنیک");
  await page.getByLabel("مبتدی", { exact: true }).check();
  await page.getByLabel("حداقل سن", { exact: true }).fill("18");
  await page.getByLabel("حداکثر سن", { exact: true }).fill("60");
  await page
    .getByLabel("در جلسه اول چه می‌گذرد؟")
    .fill("ارزیابی سطح اولیه و آشنایی با هدف ورزشکار");
  await page
    .getByLabel("پشتیبانی بین جلسات")
    .fill("پاسخ‌گویی و بررسی تمرین‌ها هر هفته");
  await page
    .getByLabel("لینک ویدئوی معرفی یا نمونه آموزش")
    .fill("https://www.aparat.com/v/example");
  await page.getByRole("button", { name: "افزودن مدرک", exact: true }).click();
  await page.getByLabel("عنوان مدرک و درجه مربیگری").fill("مربیگری درجه دو");
  await page.getByLabel("صادرکننده مدرک").fill("فدراسیون ورزشی");
  await page.getByLabel("سال دریافت", { exact: true }).fill("۱۴۰۳");
  await page.getByLabel("تصویر مدرک (اختیاری)").setInputFiles({
    name: "certificate.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await expect(
    page.getByText("تصویر مدرک پیوست شده", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "افزودن نمونه پیشرفت" }).click();
  await page
    .getByLabel("عنوان نمونه", { exact: true })
    .fill("شروع تمرین قدرتی");
  await page.getByLabel("هدف اولیه شاگرد").fill("یادگیری اجرای صحیح");
  await page.getByLabel("مدت همکاری").fill("۱۲ هفته");
  await page
    .getByLabel("مسیر تمرین و نتیجه ثبت‌شده")
    .fill("تسلط بر اجرای حرکات پایه با پیشرفت تدریجی");
  const consent = page.getByLabel(
    "رضایت شاگرد را برای انتشار این نمونه دریافت کرده‌ام.",
  );
  await expect(consent).toHaveAttribute("required", "");
  await consent.check();
  await page
    .getByRole("button", { name: "ذخیره پروفایل", exact: true })
    .click();
  await expect.poll(() => saves).toBe(1);
  expect(sportWrites).toBe(0);
  expect(saved.contact.instagram).toBe("https://instagram.com/coach");
  expect(saved.professionalProfile?.goals).toEqual([
    "افزایش قدرت",
    "یادگیری تکنیک",
  ]);
  expect(saved.professionalProfile?.credentials[0]?.issuer).toBe(
    "فدراسیون ورزشی",
  );
  expect(saved.professionalProfile?.credentials[0]?.mediaId).toBe(
    "66d400000000000000000024",
  );
  await page.reload();
  await expect(page.getByLabel("صادرکننده مدرک")).toHaveValue("فدراسیون ورزشی");
  await expect(page.getByLabel("حداقل سن", { exact: true })).toHaveValue("18");
  await page.getByLabel("حداکثر سن", { exact: true }).fill("10");
  await page
    .getByRole("button", { name: "ذخیره پروفایل", exact: true })
    .click();
  await expect(
    page.getByText("حداکثر سن باید برابر یا بیشتر از حداقل سن باشد"),
  ).toBeVisible();
  expect(saves).toBe(1);
  await page.goto("/discovery/coaches/professional-coach");
  await expect(
    page.getByRole("heading", { name: "این مربی برای چه کسی مناسب است؟" }),
  ).toBeVisible();
  await expect(page.getByText(saved.bio, { exact: true })).toBeVisible();
  await expect(
    page.getByText("فارسی، انگلیسی", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /مشاهده ویدئوی معرفی/ }),
  ).toHaveAttribute("href", "https://www.aparat.com/v/example");
  await expect(page.getByText("برنامه منعطف", { exact: true })).toHaveCount(0);
  await expect(page.getByText("پیشنهاد کاربران", { exact: true })).toHaveCount(
    0,
  );
  await page
    .getByRole("heading", { name: "مدارک و صلاحیت‌ها" })
    .scrollIntoViewIfNeeded();
  await expect(
    page.getByText("مربیگری درجه دو", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("heading", { name: "نمونه پیشرفت شاگردان" })
    .scrollIntoViewIfNeeded();
  await expect(
    page.getByText("شروع تمرین قدرتی", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "/tmp/coach-professional-mobile.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("older coach profiles hide empty professional sections", async ({
  page,
}) => {
  await installApiMock(page, createMockApiState());
  await setBrowserSession(page, false);
  const old = profileFixture();
  delete old.professionalProfile;
  await page.route(
    "**/api/v1/discovery/catalog/coaches/professional-coach",
    (route) =>
      route.fulfill({
        json: {
          data: {
            ...old,
            bio: "",
            languages: [],
            imageUrl: null,
            portfolio: [],
            averageRating: 0,
            reviewsCount: 0,
          },
        },
      }),
  );
  await page.route("**/api/v1/public/coaches/**", (route) =>
    route.fulfill({ json: { data: { items: [] } } }),
  );
  await page.goto("/discovery/coaches/professional-coach");
  await expect(
    page.getByRole("heading", { name: "مربی آزمایشی", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "مدارک و صلاحیت‌ها" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "این مربی برای چه کسی مناسب است؟" }),
  ).toHaveCount(0);
});

test("coach can reorder and remove existing portfolio images without losing them on a second save", async ({
  page,
}) => {
  const state = createMockApiState();
  state.user.roles = ["coach"];
  await installApiMock(page, state);
  await setBrowserSession(page, true);
  const ids = [
    "66d400000000000000000031",
    "66d400000000000000000032",
    "66d400000000000000000033",
  ];
  let saved = {
    ...profileFixture(),
    galleryMediaIds: ids,
    travelRadiusKm: 10,
    geo: {
      countryId: "66d400000000000000000041",
      provinceId: "66d400000000000000000042",
      cityId: "66d400000000000000000043",
      cityRegionIds: [],
    },
  };
  let writes = 0;
  await page.route("**/api/v1/coach/profile", async (route) => {
    if (route.request().method() === "PATCH") {
      const body = route.request().postDataJSON();
      expect(body.galleryMediaIds).toEqual([ids[2], ids[1]]);
      expect(body.travelRadiusKm).toBe(15);
      saved = { ...saved, ...body };
      writes++;
    }
    await route.fulfill({ json: { data: saved } });
  });
  await page.route("**/api/v1/coach/sports", (route) =>
    route.fulfill({ json: { data: { items: [] } } }),
  );
  await page.route(/\/api\/v1\/media(?:\?.*)?$/, (route) =>
    route.fulfill({
      json: {
        data: {
          items: ids.map((id) => ({
            id,
            url: "/icon.png",
            status: "ready",
            mimeType: "image/png",
          })),
        },
      },
    }),
  );
  await page.goto("/coach/profile/professional");
  await page
    .getByRole("button", { name: "جلو بردن تصویر 3", exact: true })
    .click();
  await page.getByRole("button", { name: "حذف تصویر 1", exact: true }).click();
  await page
    .getByRole("spinbutton", { name: "شعاع رفت‌وآمد (کیلومتر)", exact: true })
    .fill("15");
  await page
    .getByRole("button", { name: "ذخیره پروفایل", exact: true })
    .click();
  await expect.poll(() => writes).toBe(1);
  await page
    .getByRole("button", { name: "ذخیره پروفایل", exact: true })
    .click();
  await expect.poll(() => writes).toBe(2);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "حذف تصویر 2", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "حذف تصویر 3", exact: true }),
  ).toHaveCount(0);
});
