import { test, expect } from "@playwright/test";
import {
  createMockApiState,
  installApiMock,
  setBrowserSession,
  sessionFixture,
} from "./support/mock-api";

test("availability preserves existing metadata and sends supported delivery modes", async ({
  page,
}) => {
  const state = createMockApiState();
  state.user.roles = ["coach"];
  await installApiMock(page, state);
  await setBrowserSession(page, true);
  let saved = {
    rules: [
      {
        id: "rule-1",
        dayOfWeek: 6,
        startMinute: 540,
        endMinute: 600,
        deliveryModes: ["club", "outdoor"],
        clubId: "66d400000000000000000001",
        validFrom: "2026-09-01",
        validUntil: "2027-09-01",
      },
    ],
    exceptions: [],
  };
  let writes = 0;
  await page.route("**/api/v1/coach/availability", async (route) => {
    if (route.request().method() === "PUT") {
      const rules = route.request().postDataJSON().rules;
      expect(rules).toHaveLength(1);
      expect(rules[0]).toMatchObject({
        deliveryModes: expect.arrayContaining(["club", "online", "outdoor"]),
        clubId: saved.rules[0]!.clubId,
        validFrom: "2026-09-01",
        validUntil: "2027-09-01",
      });
      saved = {
        rules: rules.map((rule: object) => ({ ...rule, id: "rule-1" })),
        exceptions: [],
      };
      writes++;
    }
    await route.fulfill({ json: { data: saved } });
  });
  await page.goto("/coach/availability");
  await page.getByRole("checkbox", { name: "آنلاین", exact: true }).check();
  await page.getByRole("button", { name: "ذخیره برنامه", exact: true }).click();
  await expect.poll(() => writes).toBe(1);
  await page.reload();
  await expect(
    page.getByRole("checkbox", { name: "آنلاین", exact: true }),
  ).toBeChecked();
});

test("failed availability fetch cannot erase saved hours", async ({ page }) => {
  await installApiMock(page, createMockApiState());
  await setBrowserSession(page, true);
  await page.route("**/api/v1/coach/availability", (route) =>
    route.fulfill({
      status: 500,
      json: { error: { code: "UNAVAILABLE", message: "unavailable" } },
    }),
  );
  await page.goto("/coach/availability");
  await expect(
    page.getByText(/برای جلوگیری از حذف زمان‌های قبلی/),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "ذخیره برنامه" })).toHaveCount(
    0,
  );
});

test("coach review explains unavailability before asking for text", async ({
  page,
}) => {
  await installApiMock(page, createMockApiState());
  await setBrowserSession(page, true);
  await page.goto("/discovery/coaches/test/reviews/new");
  await expect(page.getByText("ثبت نظر این بخش هنوز فعال نیست")).toBeVisible();
  await expect(page.locator("textarea")).toHaveCount(0);
});

test("membership page displays authoritative balance and dates", async ({
  page,
}) => {
  await installApiMock(page, createMockApiState());
  await setBrowserSession(page, true);
  await page.route("**/api/v1/benefit-purchases/mine/entitlements", (route) =>
    route.fulfill({
      json: {
        data: {
          items: [
            {
              id: "pack",
              productId: "product",
              clubId: "66d400000000000000000001",
              title: "بسته هشت جلسه",
              type: "session_pack",
              remainingSessions: 3,
              weeklyLimit: null,
              weeklyUsed: 0,
              sessionTypes: ["court"],
              startsAt: "2026-09-01",
              endsAt: "2030-09-01",
              status: "active",
            },
          ],
        },
      },
    }),
  );
  await page.route(
    "**/api/v1/benefit-purchases/mine/entitlements/pack/usage*",
    (route) => {
      const current = Number(
        new URL(route.request().url()).searchParams.get("page") || 1,
      );
      return route.fulfill({
        json: {
          data: {
            total: 11,
            totalPages: 2,
            page: current,
            items: [
              {
                id: `usage-${current}`,
                reservationId: `reservation-${current}`,
                status: current === 1 ? "consumed" : "released",
                sessionStartsAt: "2026-09-06T12:00:00.000Z",
              },
            ],
          },
        },
      });
    },
  );
  await page.goto("/athlete/memberships");
  await page.getByRole("link", { name: "جزئیات و سوابق مصرف" }).click();
  await expect(page.getByText("مصرف‌شده", { exact: true })).toBeVisible();
  await page
    .getByRole("navigation", { name: "صفحه‌بندی سوابق مصرف" })
    .getByRole("button", { name: "بعدی" })
    .click();
  await expect(page.getByText("برگشت اعتبار", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "جزئیات رزرو" })).toHaveAttribute(
    "href",
    "/athlete/reservations/reservation-2",
  );
  await expect(page.getByText("بسته هشت جلسه")).toBeVisible();
  await expect(
    page.getByText("جلسات باقی‌مانده", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "رزرو با این عضویت" }),
  ).toHaveAttribute("href", /\/slots$/);
});

test("global search includes business classes and can navigate beyond the first page", async ({
  page,
}) => {
  await installApiMock(page, createMockApiState());
  await setBrowserSession(page, true);
  await page.route("**/api/v1/discovery/catalog/search*", async (route) => {
    const current = Number(
      new URL(route.request().url()).searchParams.get("page") || 1,
    );
    await route.fulfill({
      json: {
        data: {
          clubs: [],
          coaches: [],
          classes: [],
          businessClasses: [
            {
              id: String(current),
              title: `یوگا صفحه ${current}`,
              description: "کلاس عمومی باشگاه",
              clubId: "club",
              capacity: 8,
              enrollmentCount: 1,
              price: { amount: 100, currency: "IRR" },
            },
          ],
          total: 21,
          page: current,
          limit: 20,
          totalPages: 2,
        },
      },
    });
  });
  await page.goto("/discovery/search");
  await page
    .getByRole("searchbox", { name: "جست‌وجو در دیسکاوری" })
    .fill("یوگا");
  await expect(page.getByRole("link", { name: /یوگا صفحه 1/ })).toBeVisible();
  await page.getByRole("button", { name: "بعدی" }).click();
  await expect(page.getByRole("link", { name: /یوگا صفحه 2/ })).toBeVisible();
});

test("OTP-only athlete can open protected membership page", async ({
  page,
}) => {
  const state = createMockApiState();
  state.user.hasPassword = false;
  await installApiMock(page, state);
  await setBrowserSession(page, true);
  await page.goto("/athlete/memberships");
  await expect(
    page.getByRole("heading", { name: "بسته‌ها و عضویت‌های من" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/athlete\/memberships$/);
});

test("login returns to the protected deep link including query", async ({
  page,
}) => {
  await installApiMock(page, createMockApiState());
  await setBrowserSession(page);
  await page.goto("/athlete/memberships?tab=history");
  await expect(page).toHaveURL(/\/auth$/);
  await page.goto("/auth/login");
  await page.getByPlaceholder("0912 0000 000").fill("09120000001");
  await page.getByPlaceholder("رمز عبور را وارد کنید").fill("Demo@1405");
  await page.getByRole("button", { name: "ورود", exact: true }).click();
  await expect(page).toHaveURL(/\/athlete\/memberships\?tab=history$/);
});

test("group booking uses the server quote and confirms exactly that amount", async ({
  page,
}) => {
  await installApiMock(page, createMockApiState());
  await setBrowserSession(page, true);
  await page.route("**/api/v1/reservations/quote", async (route) => {
    const request = route.request().postDataJSON();
    expect(request.participantCount).toBe(4);
    await route.fulfill({
      json: {
        data: {
          ...request,
          currency: "IRR",
          pricingUnit: "per_court",
          baseAmount: 6_000_000,
          optionsAmount: 0,
          coveredAmount: 0,
          totalPrice: 6_000_000,
          subtotal: 6_000_000,
          taxPercent: 0,
          taxAmount: 0,
        },
      },
    });
  });
  await page.goto("/discovery/clubs/energy-plus-demo/slots");
  await page
    .getByRole("radiogroup", { name: "ساعت رزرو را انتخاب کنید" })
    .locator('[data-slot="radio-content"]')
    .first()
    .click();
  await page.getByLabel("تعداد نفرات رزرو").fill("4");
  await page.getByRole("button", { name: "رزرو کنید", exact: true }).click();
  await expect(page.getByRole("heading", { name: "مرور رزرو" })).toBeVisible();
  const request = page.waitForRequest(
    (request) =>
      request.method() === "POST" &&
      new URL(request.url()).pathname.endsWith("/reservations"),
  );
  await page.getByRole("button", { name: "ثبت رزرو و ادامه پرداخت" }).click();
  expect((await request).postDataJSON()).toMatchObject({
    participantCount: 4,
    expectedTotalPrice: 6_000_000,
    expectedCurrency: "IRR",
  });
});

test("reservation receipt creates a persistent support ticket with its order reference", async ({
  page,
}) => {
  await installApiMock(page, createMockApiState());
  await setBrowserSession(page, true);
  const saved: Record<string, unknown>[] = [];
  await page.route("**/api/v1/support/tickets", async (route) => {
    if (route.request().method() === "POST") {
      const body = route.request().postDataJSON();
      expect(body).toMatchObject({
        referenceType: "reservation",
        referenceId: "66d700000000000000000001",
      });
      const ticket = {
        ...body,
        id: "ticket-1",
        status: "open",
        messages: [
          {
            id: "message-1",
            authorType: "user",
            body: body.message,
            createdAt: new Date().toISOString(),
          },
        ],
      };
      saved.push(ticket);
      return route.fulfill({ status: 201, json: { data: ticket } });
    }
    return route.fulfill({ json: { data: { items: saved } } });
  });
  await page.goto("/athlete/reservations");
  await page.evaluate(() =>
    fetch("http://127.0.0.1:7088/api/v1/reservations", {
      method: "POST",
      body: "{}",
      headers: { "Content-Type": "application/json" },
    }),
  );
  await page.goto("/athlete/reservations/66d700000000000000000001?source=club");
  await page.getByRole("link", { name: "پیگیری این رزرو از پشتیبانی" }).click();
  await expect(
    page.getByText("درخواست به سفارش شما متصل می‌شود."),
  ).toBeVisible();
  await page.getByLabel("شرح درخواست").fill("وضعیت پرداخت رزرو را بررسی کنید");
  await page.getByRole("button", { name: "ارسال", exact: true }).click();
  await expect.poll(() => saved.length).toBe(1);
  await expect(page).toHaveURL(/\/support\/ticket-1$/);
  await page.reload();
  await expect(
    page.getByText("وضعیت پرداخت رزرو را بررسی کنید", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("سفارش مرتبط:")).toBeVisible();
});

test("coach service editor preserves model fields and custom cancellation metadata", async ({
  page,
}) => {
  const state = createMockApiState();
  state.user.roles = ["coach"];
  await installApiMock(page, state);
  await setBrowserSession(page, true);
  const id = "66d400000000000000000011";
  const saved = {
    id,
    coachId: "66d400000000000000000012",
    sportId: "66d400000000000000000013",
    title: "ارزیابی آمادگی",
    description: "توضیح قبلی",
    type: "assessment",
    deliveryModes: ["club", "outdoor"],
    durationMinutes: 45,
    capacity: 3,
    price: { amount: 500000, currency: "IRR" },
    pricingType: "per_session",
    minAge: 18,
    maxAge: 65,
    skillLevelId: "66d400000000000000000014",
    sessionCount: null,
    venueClubIds: ["66d400000000000000000015"],
    requiredEquipmentText: "کفش ورزشی",
    coverMediaId: "66d400000000000000000016",
    cancellationPolicy: {
      title: "لغو ارزیابی",
      tiers: [{ hoursBefore: 0, refundPercent: 25 }],
      reservationCutoffMinutes: 60,
      rescheduleCutoffMinutes: 120,
      ownerCancellationRefundPercent: 100,
      noShowRefundPercent: 0,
      customNote: "preserve-me",
    },
    status: "draft",
  };
  let submitted = false;
  await page.route(`**/api/v1/coach/services/${id}`, async (route) => {
    if (route.request().method() === "PATCH") {
      expect(route.request().postDataJSON()).toMatchObject({
        description: "توضیح جدید برای ورزشکار",
        type: "assessment",
        minAge: 18,
        maxAge: 65,
        skillLevelId: saved.skillLevelId,
        venueClubIds: saved.venueClubIds,
        coverMediaId: saved.coverMediaId,
        requiredEquipmentText: "کفش ورزشی",
        cancellationPolicy: saved.cancellationPolicy,
        deliveryModes: expect.arrayContaining(["club", "online", "outdoor"]),
      });
      submitted = true;
    }
    await route.fulfill({ json: { data: saved } });
  });
  await page.goto(`/coach/services/${id}/edit`);
  await page
    .getByRole("textbox", { name: "توضیحات", exact: true })
    .fill("توضیح جدید برای ورزشکار");
  const online = page.getByRole("checkbox", { name: "آنلاین", exact: true });
  await page.locator("label").filter({ has: online }).click();
  await expect(online).toBeChecked();
  await page.getByRole("button", { name: "ذخیره خدمت", exact: true }).click();
  await expect.poll(() => submitted).toBe(true);
  await expect(page).toHaveURL(/\/coach\/reservations$/);
});

test("professional password setup returns to the original page once", async ({
  page,
}) => {
  const state = createMockApiState();
  state.user.roles = ["coach"];
  state.user.hasPassword = false;
  await installApiMock(page, state);
  await setBrowserSession(page, true);
  await page.route("**/api/v1/account/auth/set-password", async (route) => {
    state.user.hasPassword = true;
    await route.fulfill({ json: { data: { success: true } } });
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/api/v1/coach/availability", (route) =>
    route.fulfill({ json: { data: { rules: [], exceptions: [] } } }),
  );
  await page.goto("/coach/availability?from=calendar");
  await expect(page).toHaveURL(/\/auth\/set-password$/);
  await page.getByLabel("رمز عبور", { exact: true }).fill("Example@1405");
  await page.getByLabel("تکرار رمز عبور", { exact: true }).fill("Example@1405");
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/\/coach\/availability\?from=calendar$/);
  await expect(
    page.getByRole("heading", { name: "زمان‌های در دسترس" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("guest login preserves group size and selected extras, then fetches a fresh quote", async ({
  page,
}) => {
  const state = createMockApiState();
  await installApiMock(page, state);
  await setBrowserSession(page);
  await page.route("**/api/v1/reservations/quote", async (route) => {
    const body = route.request().postDataJSON();
    expect(body.participantCount).toBe(4);
    expect(body.options).toEqual([{ optionId: "extra-one", quantity: 2 }]);
    await route.fulfill({
      json: {
        data: {
          ...body,
          currency: "IRR",
          pricingUnit: "per_court",
          baseAmount: 6000000,
          optionsAmount: 400000,
          coveredAmount: 0,
          totalPrice: 6400000,
          subtotal: 6400000,
          taxPercent: 0,
          taxAmount: 0,
        },
      },
    });
  });
  await page.route("**/api/v1/public/clubs/*/reservable-sessions**", (route) =>
    route.fulfill({
      json: {
        data: {
          items: [
            {
              ...sessionFixture(state.startsAt, state.endsAt),
              options: [
                {
                  id: "extra-one",
                  type: "equipment",
                  title: "راکت",
                  unitPrice: 200000,
                  maxPerReservation: 4,
                  availableQuantity: 10,
                  reservedQuantity: 0,
                },
              ],
            },
          ],
        },
      },
    }),
  );
  await page.goto("/discovery/clubs/energy-plus-demo/slots");
  await page
    .getByRole("radiogroup", { name: "ساعت رزرو را انتخاب کنید" })
    .locator('[data-slot="radio-content"]')
    .first()
    .click();
  await page.getByLabel("تعداد نفرات رزرو").fill("4");
  await page.getByLabel("تعداد راکت", { exact: true }).fill("2");
  await page.getByRole("button", { name: "رزرو کنید", exact: true }).click();
  await expect(page).toHaveURL(/\/auth$/);
  await page.goto("/auth/login");
  await page.getByPlaceholder("0912 0000 000").fill("09120000001");
  await page.getByPlaceholder("رمز عبور را وارد کنید").fill("Demo@1405");
  await page.getByRole("button", { name: "ورود", exact: true }).click();
  await expect(page).toHaveURL(/participants=4/);
  await expect(page.getByLabel("تعداد نفرات رزرو")).toHaveValue("4");
  await expect(page.getByLabel("تعداد راکت", { exact: true })).toHaveValue("2");
  await page.getByRole("button", { name: "رزرو کنید", exact: true }).click();
  await expect(page.getByRole("heading", { name: "مرور رزرو" })).toBeVisible();
});

test("club class results keep the selected club while paging and clear it explicitly", async ({
  page,
}) => {
  await installApiMock(page, createMockApiState());
  await setBrowserSession(page, true);
  const clubId = "66d400000000000000000001";
  const requests: Array<{ club: string | null; page: string | null }> = [];
  await page.route("**/api/v1/discovery/catalog/search*", (route) => {
    const params = new URL(route.request().url()).searchParams;
    requests.push({ club: params.get("clubId"), page: params.get("page") });
    return route.fulfill({
      json: {
        data: {
          clubs: [],
          coaches: [],
          classes: [],
          businessClasses: [],
          page: Number(params.get("page")),
          limit: 20,
          total: 21,
          totalPages: 2,
        },
      },
    });
  });
  await page.goto(`/discovery/classes?clubId=${clubId}`);
  await expect.poll(() => requests.at(-1)).toEqual({ club: clubId, page: "1" });
  await page.getByRole("button", { name: "بعدی", exact: true }).click();
  await expect.poll(() => requests.at(-1)).toEqual({ club: clubId, page: "2" });
  await page
    .getByRole("link", { name: "نمایش کلاس‌های همه باشگاه‌ها" })
    .click();
  await expect.poll(() => requests.at(-1)).toEqual({ club: null, page: "1" });
});

test("membership purchase waits for a mock decision and handles failure then success", async ({
  page,
}) => {
  await installApiMock(page, createMockApiState());
  await setBrowserSession(page, true);
  const clubId = "66d400000000000000000001";
  let decisions = 0;
  await page.route("**/api/v1/public/clubs/*/benefit-products", (route) =>
    route.fulfill({
      json: {
        data: {
          items: [
            {
              id: "product",
              clubId,
              title: "عضویت ویژه آزمون",
              type: "session_pack",
              description: "بسته آزمایشی",
              price: 150000,
              sessionCount: 5,
              validityDays: 30,
              weeklyLimit: null,
              status: "active",
              sessionTypes: ["court"],
            },
          ],
        },
      },
    }),
  );
  await page.route("**/api/v1/benefit-purchases/product", (route) =>
    route.fulfill({ json: { data: { id: "purchase" } } }),
  );
  await page.route("**/api/v1/payments/intents", (route) =>
    route.fulfill({
      json: {
        data: {
          id: "membership-intent",
          amount: 150000,
          grossAmount: 150000,
          discountAmount: 0,
          walletAmount: 0,
          status: "pending",
          referenceType: "benefit_purchase",
          referenceId: "purchase",
        },
      },
    }),
  );
  await page.route(
    "**/api/v1/payments/intents/membership-intent/mock/decision",
    (route) => {
      decisions++;
      return route.fulfill({
        json: {
          data: {
            id: "membership-intent",
            status: route.request().postDataJSON().status,
          },
        },
      });
    },
  );
  await page.goto("/discovery/clubs/energy-plus-demo");
  const buy = page.getByRole("button", { name: "خرید", exact: true });
  await buy.click();
  await expect(
    page.getByText("درگاه پرداخت آزمایشی", { exact: true }),
  ).toBeVisible();
  expect(decisions).toBe(0);
  await page
    .getByRole("button", { name: "پرداخت ناموفق", exact: true })
    .click();
  await expect(
    page.getByText("درگاه پرداخت آزمایشی", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "مشاهده عضویت خریداری‌شده" }),
  ).toHaveCount(0);
  await buy.click();
  await page.getByRole("button", { name: "پرداخت موفق", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "مشاهده عضویت خریداری‌شده" }),
  ).toHaveAttribute("href", "/athlete/memberships");
  expect(decisions).toBe(2);
});

test("payment review applies coupon and Persian wallet amount and submits the accepted server total", async ({
  page,
}) => {
  const state = createMockApiState();
  await installApiMock(page, state);
  await setBrowserSession(page, true);
  await page.goto("/discovery/clubs/energy-plus-demo/slots");
  await page
    .getByRole("radiogroup", { name: "ساعت رزرو را انتخاب کنید" })
    .locator('[data-slot="radio-content"]')
    .first()
    .click();
  await page.getByRole("button", { name: "رزرو کنید", exact: true }).click();
  await page.getByRole("button", { name: "ثبت رزرو و ادامه پرداخت" }).click();
  await page.getByLabel("کد تخفیف", { exact: true }).fill("SAVE10");
  await page.getByLabel("سهم کیف پول (ریال)", { exact: true }).fill("۱۰۰۰۰");
  const quoted = page.waitForResponse(
    (response) =>
      response.url().endsWith("/payments/quote") &&
      response.request().postDataJSON()?.couponCode === "SAVE10",
  );
  await page.getByRole("button", { name: "بررسی مبلغ", exact: true }).click();
  const quote = (await (await quoted).json()).data;
  const intent = page.waitForRequest(
    (request) =>
      request.url().endsWith("/payments/intents") &&
      request.postDataJSON()?.expectedAmount !== undefined,
  );
  await page.getByRole("button", { name: "پرداخت موفق", exact: true }).click();
  expect((await intent).postDataJSON()).toMatchObject({
    couponCode: "SAVE10",
    walletAmount: 10000,
    expectedAmount: quote.amount,
  });
  await expect(
    page.getByRole("heading", { name: "رزرو شما با موفقیت انجام شد" }),
  ).toBeVisible();
});
