import { test, expect, type Page } from "@playwright/test";
import {
  createMockApiState,
  installApiMock,
  setBrowserSession,
} from "./support/mock-api";

const plan = {
  title: "قدرت پایه",
  description: "سه ست با تمرکز بر فرم",
  days: [
    {
      id: "day1",
      title: "پایین‌تنه",
      weekday: 0,
      exercises: [
        {
          exerciseId: "squat",
          sets: 2,
          reps: 10,
          weight: 20,
          restSeconds: 60,
          note: "",
        },
      ],
    },
  ],
};
const assignment = () => ({
  id: "66d400000000000000000002",
  athleteId: "66d100000000000000000001",
  version: 1,
  snapshot: plan,
  startsAt: new Date(Date.now() - 86400000).toISOString(),
  endsAt: new Date(Date.now() + 86400000).toISOString(),
  status: "active",
  consentAt: null as string | null,
  available: true,
});
async function setup(page: Page) {
  await installApiMock(page, createMockApiState());
  await setBrowserSession(page, true);
  await page.addInitScript(() => {
    localStorage.setItem("theme", "light");
    sessionStorage.setItem("gym4me.splash.shown", "1");
  });
  await page.route("**/api/v1/training/exercises", (r) =>
    r.fulfill({
      json: {
        data: {
          items: [
            {
              id: "squat",
              name: "اسکوات",
              muscle: "پا",
              equipment: "وزن بدن",
              instructions: "با کنترل پایین برو و برگرد.",
            },
          ],
        },
      },
    }),
  );
}
test("athlete accepts, logs during API outage, resumes after reload and syncs exactly once", async ({
  page,
}, info) => {
  await setup(page);
  await page.setViewportSize({ width: 375, height: 900 });
  const a = assignment();
  let outage = false;
  const sessions = new Map<string, { status: string }>();
  let writes = 0;
  await page.route("**/api/v1/training/assignments", (r) =>
    outage
      ? r.abort("internetdisconnected")
      : r.fulfill({ json: { data: { items: [a] } } }),
  );
  await page.route("**/api/v1/training/assignments/*/consent", (r) => {
    a.consentAt = new Date().toISOString();
    return r.fulfill({ json: { data: { accepted: true } } });
  });
  await page.route("**/api/v1/training/sessions", (r) =>
    r.fulfill({ json: { data: { items: [...sessions.values()] } } }),
  );
  await page.route("**/api/v1/training/sessions/*", (r) => {
    if (outage) return r.abort("internetdisconnected");
    writes++;
    const body = r.request().postDataJSON();
    const key = r.request().url().split("/").at(-1)!;
    const s = {
      ...body,
      clientId: key,
      revision: body.expectedRevision + 1,
      snapshot: plan,
    };
    sessions.set(key, s);
    return r.fulfill({ json: { data: s } });
  });
  await page.goto("/athlete/training");
  await page
    .getByRole("button", { name: "پذیرش برنامه و اشتراک نتایج" })
    .click();
  await page.getByRole("button", { name: "شروع تمرین", exact: true }).click();
  outage = true;
  await page.getByLabel("وزنه حرکت 1 ست 1", { exact: true }).fill("32.5");
  const weightInput = page.getByLabel("وزنه حرکت 1 ست 1", { exact: true });
  const weightCounter = page
    .locator("[data-counter]")
    .filter({ has: weightInput });
  await weightCounter.getByRole("button", { name: "افزایش مقدار" }).click();
  await expect(weightInput).toHaveValue("33");
  await weightCounter.getByRole("button", { name: "کاهش مقدار" }).click();
  await expect(weightInput).toHaveValue("32.5");
  await page
    .getByRole("textbox", { name: "یادداشت جلسه", exact: true })
    .fill("تمرین با کنترل کامل");
  await page
    .getByRole("button", { name: "ثبت حرکت 1 ست 1", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "لغو ثبت حرکت 1 ست 1", exact: true }),
  ).toBeVisible();
  await expect(
    weightCounter.getByRole("button", { name: "افزایش مقدار" }),
  ).toBeDisabled();
  await expect(
    weightCounter.getByRole("button", { name: "کاهش مقدار" }),
  ).toBeDisabled();
  await page.reload();
  await expect(
    page.getByLabel("وزنه حرکت 1 ست 1", { exact: true }),
  ).toHaveValue("32.5");
  await expect(
    page.getByRole("textbox", { name: "یادداشت جلسه", exact: true }),
  ).toHaveValue("تمرین با کنترل کامل");
  await expect(
    page.getByRole("button", { name: "لغو ثبت حرکت 1 ست 1", exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/نسخه آفلاین برنامه‌ها/)).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  await page.screenshot({
    path: info.outputPath("training-mobile.png"),
    fullPage: true,
  });
  outage = false;
  await page
    .getByRole("button", { name: "پایان و ذخیره تمرین", exact: true })
    .click();
  await expect(page.getByText("همه ثبت‌های محلی همگام‌اند")).toBeVisible();
  // The lost active-session payload is replayed before the final completed revision.
  expect(sessions.size).toBe(1);
  expect([...sessions.values()][0].status).toBe("completed");
  expect(writes).toBeLessThanOrEqual(3);
  await page.getByRole("link", { name: "روند پیشرفت", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "روند پیشرفت", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("بیشترین وزنه ثبت‌شده", { exact: true }),
  ).toBeVisible();
});

test("coach builds a versioned plan and assigns its selected version", async ({
  page,
}, info) => {
  await setup(page);
  const records: { versions: { plan: typeof plan }[] }[] = [];
  let sent: { version?: number; mutationId?: string } = {};
  await page.route("**/api/v1/training/coach/plans", (r) =>
    r.fulfill({ json: { data: { items: records } } }),
  );
  await page.route("**/api/v1/training/coach/plans/*", (r) => {
    const body = r.request().postDataJSON();
    const record = {
      id: r.request().url().split("/").at(-1),
      version: 1,
      versions: [
        { version: 1, plan: body.plan, createdAt: new Date().toISOString() },
      ],
    };
    records.push(record);
    return r.fulfill({ json: { data: record } });
  });
  await page.route("**/api/v1/training/coach/clients", (r) =>
    r.fulfill({
      json: {
        data: {
          items: [{ id: "66d100000000000000000001", name: "علی رضایی" }],
          classes: [],
        },
      },
    }),
  );
  await page.route("**/api/v1/training/coach/assignments", (r) => {
    if (r.request().method() === "PUT") sent = r.request().postDataJSON();
    return r.fulfill({ json: { data: { items: [] } } });
  });
  await page.goto("/coach/training");
  await page.getByRole("button", { name: "برنامه جدید", exact: true }).click();
  await page.getByLabel("نام برنامه", { exact: true }).fill("قدرت پایه");
  await page.getByRole("button", { name: "افزودن روز", exact: true }).click();
  await page
    .getByRole("button", { name: "ذخیره نسخه برنامه", exact: true })
    .click();
  await expect(page.getByText(/نسخه برنامه ذخیره شد/)).toBeVisible();
  expect(records[0].versions[0].plan.days.length).toBe(2);
  await page
    .getByRole("combobox", { name: "دریافت‌کننده", exact: true })
    .selectOption("athlete:66d100000000000000000001");
  await page.getByLabel("شروع اعتبار", { exact: true }).fill("1405/06/17");
  await page.getByLabel("پایان اعتبار", { exact: true }).fill("1405/07/16");
  await page
    .getByRole("button", { name: "ارسال نسخه انتخابی", exact: true })
    .click();
  await expect(page.getByText(/برنامه ارسال شد/)).toBeVisible();
  expect(sent.version).toBe(1);
  expect(sent.mutationId).toBeTruthy();
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  await page.screenshot({
    path: info.outputPath("coach-training-mobile.png"),
    fullPage: true,
  });
});

test("library filters and renders in dark mode without overflow", async ({
  page,
}, info) => {
  await setup(page);
  await page.addInitScript(() => localStorage.setItem("theme", "dark"));
  await page.goto("/athlete/training/exercises");
  await page.getByLabel("جست‌وجوی حرکت", { exact: true }).fill("اسکوات");
  await expect(
    page.getByText("با کنترل پایین برو و برگرد.", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("جست‌وجوی حرکت", { exact: true }).fill("ناموجود");
  await expect(page.getByText("حرکتی با این فیلتر پیدا نشد.")).toBeVisible();
  await page.getByLabel("جست‌وجوی حرکت", { exact: true }).clear();
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  await page.screenshot({
    path: info.outputPath("exercises-dark.png"),
    fullPage: true,
  });
});
