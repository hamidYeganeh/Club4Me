import { test, expect, type Page } from "@playwright/test";
import {
  createMockApiState,
  installApiMock,
  setBrowserSession,
} from "./support/mock-api";
const classId = "66d400000000000000000001",
  clubId = classId,
  assignmentId = "66d400000000000000000002";
const plan = {
  title: "قدرت پایه",
  description: "",
  days: [
    {
      id: "day1",
      title: "روز اول",
      weekday: 0,
      exercises: [
        {
          exerciseId: "squat",
          sets: 2,
          reps: 10,
          weight: 10,
          restSeconds: 60,
          note: "",
        },
      ],
    },
  ],
};
const preferences = {
  weekdays: [],
  timeFrom: "",
  timeTo: "",
  maxPrice: null,
  radiusKm: null,
  sport: "",
  level: "",
  availableOnly: true,
};
const course = {
  id: classId,
  title: "یوگای عصر",
  slug: "yoga",
  clubId,
  sport: "یوگا",
  level: "مبتدی",
  description: "لباس راحت همراه داشته باشید",
  faqs: [],
  socialMedia: [],
  model: "group",
  pricingModel: "monthly",
  price: 1000000,
  currency: "IRR",
  capacity: 10,
  enrollmentCount: 5,
  remainingCapacity: 5,
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
  enrollmentMode: "automatic",
  status: "active",
  club: { id: classId, name: "باشگاه آرامش" },
  branch: { id: "branch", name: "اصلی", address: "تهران، خیابان بهار" },
  coach: null,
  sessions: [],
  reasons: ["نزدیک به موقعیت پیش‌فرض شما"],
  distanceKm: 2,
};
async function setup(page: Page) {
  const state = createMockApiState();
  state.user.roles = ["athlete", "coach"];
  await installApiMock(page, state);
  await setBrowserSession(page, true);
  await page.addInitScript(() => {
    localStorage.setItem("gym4me.welcome.seen", "1");
    sessionStorage.setItem("gym4me.splash.shown", "1");
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/v1/coach/profile", (r) =>
    r.fulfill({
      json: {
        data: { id: classId, displayName: "مربی", reviewStatus: "approved" },
      },
    }),
  );
}
test("saved preferences preserve failure state, compare classes and fit both mobile themes", async ({
  page,
}, info) => {
  await setup(page);
  let saved = false,
    fail = true;
  await page.route("**/api/v1/athlete/club-classes/recommendations", (r) =>
    r.fulfill({
      json: {
        data: {
          items: [course, { ...course, id: assignmentId, title: "پیلاتس عصر" }],
          preferences: { ...preferences, sport: saved ? "یوگا" : "" },
        },
      },
    }),
  );
  await page.route("**/api/v1/athlete/club-classes/preferences", (r) => {
    saved = true;
    return fail
      ? r.fulfill({ status: 503, json: { error: { message: "Unavailable" } } })
      : r.fulfill({ json: { data: r.request().postDataJSON() } });
  });
  await page.goto("/athlete");
  const decline = page.getByRole("button", { name: "فعلاً نه", exact: true });
  if (await decline.isVisible()) await decline.click();
  await page.getByRole("button", { name: "زمان و ترجیحات من" }).click();
  await page.getByRole("textbox", { name: "رشته دلخواه" }).fill("یوگا");
  await page.getByRole("button", { name: "ذخیره و نمایش پیشنهادها" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "ذخیره انجام نشد" }),
  ).toBeVisible();
  await expect(page.getByRole("textbox", { name: "رشته دلخواه" })).toHaveValue(
    "یوگا",
  );
  fail = false;
  await page.getByRole("button", { name: "ذخیره و نمایش پیشنهادها" }).click();
  await expect(page.getByRole("textbox", { name: "رشته دلخواه" })).toHaveCount(
    0,
  );
  await page.getByText("مقایسه یوگای عصر", { exact: true }).click();
  await page.getByText("مقایسه پیلاتس عصر", { exact: true }).click();
  await expect(
    page.getByRole("region", { name: "مقایسه کلاس‌ها" }),
  ).toContainText("ماهانه");
  for (const theme of ["light", "dark"]) {
    await page.evaluate((theme) => {
      document.documentElement.classList.toggle("dark", theme === "dark");
      document.documentElement.dataset.theme = theme;
    }, theme);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath(`recommendations-${theme}.png`),
      fullPage: true,
    });
  }
});
test("coach opens a specific follow-up and saves contextual feedback without losing a failed draft", async ({
  page,
}) => {
  await setup(page);
  let fail = true;
  await page.route("**/api/v1/training/coach/follow-ups", (r) =>
    r.fulfill({
      json: {
        data: {
          items: [
            {
              athleteId: classId,
              name: "شاگرد نمونه",
              assignmentId,
              reason: "requested",
              label: "ورزشکار درخواست پیگیری کرده",
              pendingReviews: 1,
            },
          ],
        },
      },
    }),
  );
  await page.route("**/api/v1/training/coach/plans", (r) =>
    r.fulfill({ json: { data: { items: [] } } }),
  );
  await page.route("**/api/v1/training/coach/assignments", (r) =>
    r.fulfill({ json: { data: { items: [] } } }),
  );
  const session = {
    clientId: "12345678-1234-4234-8234-123456789abc",
    assignmentId,
    dayId: "day1",
    snapshot: plan,
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    status: "completed",
    revision: 1,
    sets: [],
    note: "حرکت دوم سخت بود",
    effort: "hard",
    followUpRequested: true,
  };
  await page.route(
    `**/api/v1/training/coach/assignments/${assignmentId}/sessions`,
    (r) => r.fulfill({ json: { data: { items: [session] } } }),
  );
  await page.route(
    "**/api/v1/training/coach/assignments/*/sessions/*/review",
    (r) =>
      fail
        ? r.fulfill({
            status: 503,
            json: { error: { message: "Unavailable" } },
          })
        : r.fulfill({
            json: {
              data: {
                ...session,
                coachReview: {
                  text: r.request().postDataJSON().text,
                  reviewedAt: new Date().toISOString(),
                  revision: 1,
                },
              },
            },
          }),
  );
  await page.goto(`/coach/training?assignment=${assignmentId}`);
  const form = page.getByRole("textbox", { name: "بازخورد همین جلسه" });
  await form.fill("جلسه بعد حرکت را با هم مرور می‌کنیم");
  await page.getByRole("button", { name: "ذخیره بازخورد" }).click();
  await expect(form).toHaveValue("جلسه بعد حرکت را با هم مرور می‌کنیم");
  fail = false;
  await page.getByRole("button", { name: "ذخیره بازخورد" }).click();
  await expect(page.getByText("بازخورد برای ورزشکار ذخیره شد.")).toBeVisible();
});
test("class groups require consent and show a copyable public invitation", async ({
  page,
}) => {
  await setup(page);
  await page.route(`**/api/v1/discovery/business-classes/${classId}`, (r) =>
    r.fulfill({ json: { data: course } }),
  );
  await page.route("**/api/v1/athlete/club-classes", (r) =>
    r.fulfill({
      json: {
        data: {
          items: [
            {
              id: assignmentId,
              classId,
              status: "active",
              paymentStatus: "paid",
            },
          ],
        },
      },
    }),
  );
  let created = false;
  const group = {
    id: assignmentId,
    title: "دوستان یوگا",
    goal: 2,
    isOwner: true,
    members: [{ name: "من", isMe: true, attendanceCount: 1 }],
  };
  await page.route(`**/api/v1/athlete/club-classes/${classId}/groups`, (r) => {
    if (r.request().method() === "POST") {
      expect(r.request().postDataJSON().accepted).toBe(true);
      created = true;
      return r.fulfill({ json: { data: group } });
    }
    return r.fulfill({ json: { data: { items: created ? [group] : [] } } });
  });
  await page.route("**/api/v1/athlete/club-classes/groups/*/invite", (r) =>
    r.fulfill({ json: { data: { token: "a".repeat(48), classId } } }),
  );
  await page.goto(`/discovery/business-class?classId=${classId}`);
  await page.getByText("ساخت گروه یا پذیرش دعوت", { exact: true }).click();
  await page.getByRole("textbox", { name: "نام گروه" }).fill("دوستان یوگا");
  await expect(
    page.getByRole("button", { name: "ساخت گروه خصوصی" }),
  ).toBeDisabled();
  await page.getByRole("checkbox", { name: /نام و تعداد حضور/ }).focus();
  await page.keyboard.press("Space");
  await page.getByRole("button", { name: "ساخت گروه خصوصی" }).click();
  await expect(
    page.getByRole("heading", { name: "دوستان یوگا" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "ساخت لینک دعوت تازه" }).click();
  await expect(
    page.getByRole("textbox", { name: "لینک آماده اشتراک" }),
  ).toHaveValue(
    /https:\/\/app.gym4me.ir\/discovery\/business-class\?classId=.*groupInvite=/,
  );
});

test("athlete reaches the coach's contextual feedback directly from home", async ({
  page,
}) => {
  await setup(page);
  const review = {
    text: "جلسه بعد روی کنترل حرکت تمرکز می‌کنیم",
    reviewedAt: new Date().toISOString(),
    revision: 1,
  };
  const session = {
    clientId: "12345678-1234-4234-8234-123456789abc",
    assignmentId,
    dayId: "day1",
    snapshot: plan,
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    status: "completed",
    revision: 1,
    sets: [],
    note: "",
    coachReview: review,
  };
  await page.route("**/api/v1/training/sessions", (r) =>
    r.fulfill({ json: { data: { items: [session] } } }),
  );
  await page.goto("/athlete");
  const region = page.getByRole("region", { name: "آخرین بازخورد مربی" });
  await expect(region).toContainText(review.text);
  const decline = page.getByRole("button", { name: "فعلاً نه", exact: true });
  if (await decline.isVisible()) await decline.click();
  await region.getByRole("link").click();
  await expect(
    page.getByRole("heading", { name: "روند پیشرفت", exact: true }),
  ).toBeVisible();
  await expect(page.getByText(review.text, { exact: true })).toBeVisible();
});
