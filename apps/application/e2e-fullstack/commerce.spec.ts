import { test, expect } from "@playwright/test";

/* eslint-disable @typescript-eslint/no-explicit-any -- acceptance responses are intentionally decoded at the test boundary */

const api = "http://127.0.0.1:7088";

test.beforeEach(async ({ page }) => {
  // Pass real requests through. Refuse any accidentally reused production build.
  await page.route("**/api/v1/**", async (route) => {
    if (new URL(route.request().url()).origin !== api) {
      await route.abort("blockedbyclient");
      throw new Error(
        "Acceptance build must use only the isolated loopback API",
      );
    }
    await route.continue();
  });
});

test("real browser, authentication, API and database complete club discovery, simulated payment and cancellation", async ({
  page,
  request,
}) => {
  const fixture = await (
    await request.get(`${api}/__acceptance/fixture`)
  ).json();
  await page.addInitScript(() =>
    localStorage.setItem("gym4me.welcome.seen", "1"),
  );
  await page.goto("/auth/login");
  await page.getByPlaceholder("0912 0000 000").fill(fixture.athlete.phone);
  await page.getByPlaceholder("رمز عبور را وارد کنید").fill(fixture.password);
  await page.getByRole("button", { name: "ورود", exact: true }).click();
  await expect(page).toHaveURL(/\/athlete$/);
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("gym4me.accessToken")))
    .toBeTruthy();
  await page.goto(`/discovery/clubs/${fixture.club.slug}`);
  await page
    .getByRole("button", { name: "همین حالا رزرو کن", exact: true })
    .last()
    .click();
  await page
    .getByRole("radiogroup", { name: "ساعت رزرو را انتخاب کنید" })
    .locator('[data-slot="radio-content"]')
    .first()
    .click();
  await page.getByRole("button", { name: "رزرو کنید", exact: true }).click();
  await expect(page.getByRole("heading", { name: "مرور رزرو" })).toBeVisible();
  await page.getByRole("button", { name: "ثبت رزرو و ادامه پرداخت" }).click();
  await expect(
    page.getByText("درگاه پرداخت آزمایشی", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "پرداخت موفق", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "رزرو شما با موفقیت انجام شد" }),
  ).toBeVisible();
  const headers = { Authorization: `Bearer ${fixture.athlete.accessToken}` };
  const mine = await (
    await request.get(`${api}/api/v1/reservations`, { headers })
  ).json();
  const reservation = mine.data.items.find(
    (item: any) => item.sessionId === fixture.sessionId,
  );
  expect(reservation.paymentStatus).toBe("paid");
  expect(
    (
      await request.get(`${api}/api/v1/reservations/${reservation.id}`, {
        headers: { Authorization: `Bearer ${fixture.other.accessToken}` },
      })
    ).status(),
  ).toBe(404);
  await page.goto("/athlete/reservations");
  await page
    .getByRole("button", { name: "نمایش تاریخچه همه رزروها", exact: true })
    .click();
  await page
    .getByRole("button", { name: "لغو سانس پذیرش یکپارچه", exact: true })
    .click();
  await page.getByRole("radio", { name: "سایر", exact: true }).check();
  await page.getByLabel("دلیل شما", { exact: true }).fill("تغییر برنامه");
  await page.getByRole("button", { name: "تأیید لغو رزرو" }).click();
  await expect(page.getByText("بازپرداخت‌شده", { exact: true })).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: "نمایش تاریخچه همه رزروها", exact: true })
    .click();
  await expect(page.getByText("بازپرداخت‌شده", { exact: true })).toBeVisible();
  const after = await (
    await request.get(`${api}/api/v1/reservations`, { headers })
  ).json();
  expect(
    after.data.items.find((item: any) => item.id === reservation.id),
  ).toMatchObject({ status: "cancelled", paymentStatus: "refunded" });
});

for (const kind of [
  "membership",
  "club-class",
  "coach-course",
  "coach-booking",
] as const) {
  test(`real UI purchase and persisted result for ${kind}`, async ({
    page,
    request,
  }) => {
    const fixture = await (
      await request.get(`${api}/__acceptance/fixture`)
    ).json();
    await page.addInitScript((tokens) => {
      localStorage.setItem("gym4me.welcome.seen", "1");
      localStorage.setItem("gym4me.accessToken", tokens.accessToken);
      localStorage.setItem("gym4me.refreshToken", tokens.refreshToken);
    }, fixture.athlete);
    const headers = { Authorization: `Bearer ${fixture.athlete.accessToken}` };
    if (kind === "membership") {
      await page.goto(`/discovery/clubs/${fixture.club.slug}`);
      await page.getByRole("button", { name: "خرید", exact: true }).click();
    } else if (kind === "club-class") {
      await page.goto(`/discovery/business-classes/${fixture.clubClassId}`);
      await page.getByRole("button", { name: "ثبت‌نام", exact: true }).click();
    } else if (kind === "coach-course") {
      await page.goto("/discovery/classes/fullstack-course");
      await page
        .getByRole("button", { name: "ثبت‌نام در کلاس", exact: true })
        .click();
      await page
        .getByRole("button", { name: "پرداخت ناموفق", exact: true })
        .click();
      await page
        .getByRole("button", { name: "ثبت‌نام دوباره", exact: true })
        .click();
    } else {
      await page.goto("/discovery/coaches/fullstack-coach");
      await page
        .getByRole("button", { name: "ادامه", exact: true })
        .first()
        .click();
      await page
        .getByRole("button", { name: "ثبت رزرو و ادامه پرداخت", exact: true })
        .click();
    }
    await expect(
      page.getByText("درگاه پرداخت آزمایشی", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "پرداخت موفق", exact: true })
      .click();
    await expect(
      page.getByText("درگاه پرداخت آزمایشی", { exact: true }),
    ).toHaveCount(0);
    if (kind === "membership") {
      await page
        .getByRole("link", { name: "مشاهده عضویت خریداری‌شده", exact: true })
        .click();
      await expect(
        page.getByText("بسته پذیرش یکپارچه", { exact: true }),
      ).toBeVisible();
      const result = await (
        await request.get(`${api}/api/v1/benefit-purchases/mine/entitlements`, {
          headers,
        })
      ).json();
      expect(
        result.data.items.find(
          (row: any) => row.productId === fixture.productId,
        ),
      ).toMatchObject({ status: "active", remainingSessions: 5 });
      await page.reload();
      await expect(
        page.getByText("بسته پذیرش یکپارچه", { exact: true }),
      ).toBeVisible();
    } else if (kind === "club-class") {
      await expect(
        page.getByText("ثبت‌نام قطعی", { exact: true }),
      ).toBeVisible();
      await page.reload();
      await expect(
        page.getByText("ثبت‌نام قطعی", { exact: true }),
      ).toBeVisible();
      const result = await (
        await request.get(`${api}/api/v1/athlete/club-classes`, { headers })
      ).json();
      expect(
        result.data.items.find(
          (row: any) => row.classId === fixture.clubClassId,
        ),
      ).toMatchObject({ status: "active", paymentStatus: "paid" });
      page.once("dialog", (dialog) => dialog.accept());
      await page
        .getByRole("button", { name: "لغو ثبت‌نام", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: "ثبت‌نام", exact: true }),
      ).toBeVisible();
    } else if (kind === "coach-course") {
      await expect(
        page.getByRole("button", { name: "ثبت‌نام شده", exact: true }),
      ).toBeDisabled();
      const result = await (
        await request.get(`${api}/api/v1/athlete/enrollments`, { headers })
      ).json();
      expect(
        result.data.items.find(
          (row: any) => row.classId === fixture.coachClassId,
        ),
      ).toMatchObject({ status: "active", paymentStatus: "paid" });
      await page.reload();
      await expect(
        page.getByRole("button", { name: "ثبت‌نام شده", exact: true }),
      ).toBeDisabled();
      page.once("dialog", (dialog) => dialog.accept());
      await page
        .getByRole("button", { name: "لغو ثبت‌نام", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: "ثبت‌نام دوباره", exact: true }),
      ).toBeEnabled();
    } else {
      await expect(
        page.getByRole("heading", { name: /رزرو جلسه با .* قطعی شد/ }),
      ).toBeVisible();
      const result = await (
        await request.get(`${api}/api/v1/athlete/bookings`, { headers })
      ).json();
      expect(
        result.data.items.find(
          (row: any) => row.sessionId === fixture.coachSessionId,
        ),
      ).toMatchObject({ paymentStatus: "paid" });
      page.once("dialog", (dialog) => dialog.accept());
      await page.getByRole("button", { name: "لغو رزرو", exact: true }).click();
      await expect(page).toHaveURL(/\/athlete\/reservations$/);
      const after = await (
        await request.get(`${api}/api/v1/athlete/bookings`, { headers })
      ).json();
      expect(
        after.data.items.find(
          (row: any) => row.sessionId === fixture.coachSessionId,
        ),
      ).toMatchObject({ paymentStatus: "refunded" });
    }
  });
}

test("coach package purchase activates three credits and survives reload", async ({
  page,
  request,
}) => {
  const fixture = await (
    await request.get(`${api}/__acceptance/fixture`)
  ).json();
  await page.addInitScript((tokens) => {
    localStorage.setItem("gym4me.welcome.seen", "1");
    localStorage.setItem("gym4me.accessToken", tokens.accessToken);
    localStorage.setItem("gym4me.refreshToken", tokens.refreshToken);
  }, fixture.athlete);
  await page.goto("/athlete/packages/fullstack-coach");
  await page
    .getByRole("button", { name: "ادامه خرید بسته مربی یکپارچه", exact: true })
    .click();
  await expect(
    page.getByText("درگاه پرداخت آزمایشی", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "پرداخت موفق", exact: true }).click();
  await expect(
    page.getByText("۳ جلسه باقی‌مانده", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("۳ جلسه باقی‌مانده", { exact: true }),
  ).toBeVisible();
  const result = await (
    await request.get(`${api}/api/v1/athlete/packages`, {
      headers: { Authorization: `Bearer ${fixture.athlete.accessToken}` },
    })
  ).json();
  expect(
    result.data.items.find(
      (row: any) => row.offeringId === fixture.coachPackageOfferingId,
    ),
  ).toMatchObject({
    status: "active",
    paymentStatus: "paid",
    remainingSessions: 3,
  });
});

test("athlete reschedules a paid coach booking and capacities move exactly once", async ({
  page,
  request,
}) => {
  const fixture = await (
    await request.get(`${api}/__acceptance/fixture`)
  ).json();
  const headers = { Authorization: `Bearer ${fixture.other.accessToken}` };
  const bookedResponse = await request.post(
    `${api}/api/v1/athlete/sessions/${fixture.coachSessionId}/bookings`,
    { headers },
  );
  expect(bookedResponse.ok()).toBeTruthy();
  const booked = (await bookedResponse.json()).data;
  const paidResponse = await request.patch(
    `${api}/api/v1/athlete/bookings/${booked.id}/mock-payment/approve`,
    { headers },
  );
  expect(paidResponse.ok()).toBeTruthy();
  await page.addInitScript((tokens) => {
    localStorage.setItem("gym4me.welcome.seen", "1");
    localStorage.setItem("gym4me.accessToken", tokens.accessToken);
    localStorage.setItem("gym4me.refreshToken", tokens.refreshToken);
  }, fixture.other);

  await page.goto(`/athlete/reservations/${booked.id}?source=coach`);
  await page.getByRole("button", { name: "تغییر زمان", exact: true }).click();
  await page
    .getByRole("button", { name: /جلسه جایگزین مربی یکپارچه|ظرفیت باقی‌مانده/ })
    .click();
  await page
    .getByRole("button", { name: "تأیید تغییر زمان", exact: true })
    .click();
  await expect(
    page.getByText("زمان جلسه تغییر کرد", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("جلسه جایگزین مربی یکپارچه", { exact: true }),
  ).toBeVisible();

  const bookings = await (
    await request.get(`${api}/api/v1/athlete/bookings`, { headers })
  ).json();
  expect(
    bookings.data.items.find((item: any) => item.id === booked.id),
  ).toMatchObject({
    sessionId: fixture.coachRescheduleSessionId,
    paymentStatus: "paid",
  });
});

test("shared search restores filters, queries the real API and clears filters", async ({
  page,
  request,
}) => {
  const fixture = await (
    await request.get(`${api}/__acceptance/fixture`)
  ).json();
  await page.addInitScript((tokens) => {
    localStorage.setItem("gym4me.welcome.seen", "1");
    localStorage.setItem("gym4me.accessToken", tokens.accessToken);
    localStorage.setItem("gym4me.refreshToken", tokens.refreshToken);
  }, fixture.athlete);
  const search = new URLSearchParams({
    q: "پذیرش",
    kind: "club",
    sort: "rating",
    nearby: "0",
  });
  await page.goto(`/discovery/search?${search}`);
  await expect(
    page.getByRole("searchbox", { name: "جست‌وجو در دیسکاوری" }),
  ).toHaveValue("پذیرش");
  await expect(
    page.getByText("باشگاه پذیرش یکپارچه", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("باشگاه پذیرش یکپارچه", { exact: true }),
  ).toBeVisible();
  expect(new URL(page.url()).searchParams.get("kind")).toBe("club");
  expect(new URL(page.url()).searchParams.get("sort")).toBe("rating");
  await page
    .getByRole("button", { name: "فیلتر نوع نتیجه", exact: true })
    .click();
  await expect(
    page.getByRole("searchbox", { name: "جست‌وجو در دیسکاوری" }),
  ).toHaveValue("پذیرش");
  const requested = page.waitForRequest((request) => {
    const url = new URL(request.url());
    return (
      url.pathname.endsWith("/catalog/search") &&
      url.searchParams.get("q") === "پذیرش" &&
      !url.searchParams.has("kind") &&
      !url.searchParams.has("sort")
    );
  });
  await page
    .getByRole("button", { name: "پاک‌کردن فیلترها", exact: true })
    .click();
  await requested;
  await expect
    .poll(() => new URL(page.url()).searchParams.get("kind"))
    .toBeNull();
  await expect
    .poll(() => new URL(page.url()).searchParams.get("sort"))
    .toBeNull();
  expect(new URL(page.url()).searchParams.get("q")).toBe("پذیرش");
});

test("class budget and delivery mode filter real records and survive reload", async ({
  page,
  request,
}) => {
  const fixture = await (
    await request.get(`${api}/__acceptance/fixture`)
  ).json();
  await page.addInitScript((tokens) => {
    localStorage.setItem("gym4me.welcome.seen", "1");
    localStorage.setItem("gym4me.accessToken", tokens.accessToken);
    localStorage.setItem("gym4me.refreshToken", tokens.refreshToken);
  }, fixture.athlete);
  const startsFrom = new Date(Date.now() - 86_400_000)
    .toISOString()
    .slice(0, 10);
  const startsTo = new Date(Date.now() + 30 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const params = new URLSearchParams({
    q: "یکپارچه",
    kind: "class",
    nearby: "0",
    minPrice: "0",
    maxPrice: "100000",
    serviceMode: "online",
    admission: "automatic",
    skillLevelId: fixture.skillLevelId,
    startsFrom,
    startsTo,
  });
  await page.goto(`/discovery/search?${params}`);
  await expect(
    page.getByText("دوره مربی یکپارچه", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/۱۰۰٬۰۰۰ ریال.*ظرفیت/)).toBeVisible();
  await expect(
    page.getByText("کلاس باشگاه یکپارچه", { exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "فیلتر نوع نتیجه", exact: true })
    .click();
  await page.getByLabel("حداکثر بودجه (ریال)", { exact: true }).fill("99999");
  await expect(
    page.getByText("نتیجه‌ای پیدا نشد.", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("حداکثر بودجه (ریال)", { exact: true }).fill("100000");
  await page
    .getByRole("combobox", { name: "شیوه برگزاری", exact: true })
    .selectOption("club");
  await expect(
    page.getByText("کلاس باشگاه یکپارچه", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("دوره مربی یکپارچه", { exact: true }),
  ).toHaveCount(0);
  await expect
    .poll(() => new URL(page.url()).searchParams.get("serviceMode"))
    .toBe("club");
  await page.reload();
  await expect(
    page.getByText("کلاس باشگاه یکپارچه", { exact: true }),
  ).toBeVisible();
  expect(new URL(page.url()).searchParams.get("maxPrice")).toBe("100000");
  expect(new URL(page.url()).searchParams.get("admission")).toBe("automatic");
  expect(new URL(page.url()).searchParams.get("startsFrom")).toBe(startsFrom);
  expect(new URL(page.url()).searchParams.get("skillLevelId")).toBe(
    fixture.skillLevelId,
  );
});
