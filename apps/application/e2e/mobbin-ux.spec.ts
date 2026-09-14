import { expect, test } from "@playwright/test";
import {
  createMockApiState,
  installApiMock,
  setBrowserSession,
} from "./support/mock-api";

test.beforeEach(async ({ page }) => {
  // Keep edits in other local tasks from resetting an in-progress interaction.
  await page.routeWebSocket(/\/_next\/webpack-hmr/, (socket) => socket.close());
});

for (const theme of ["light", "dark"] as const) {
  test(`Mobbin patterns preserve navigation and recovery in ${theme}`, async ({
    page,
  }, info) => {
    await installApiMock(page, createMockApiState());
    await setBrowserSession(page, true);
    await page.addInitScript((value) => {
      localStorage.setItem("theme", value);
      sessionStorage.setItem("gym4me.splash.shown", "1");
    }, theme);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 375, height: 900 });
    await page.route("**/api/v1/training/exercises", (route) =>
      route.fulfill({
        json: {
          data: {
            items: [
              {
                id: "squat",
                name: "اسکوات",
                muscle: "پا",
                equipment: "وزن بدن",
                instructions: "با کنترل حرکت کن.",
              },
            ],
          },
        },
      }),
    );
    await page.goto("/discovery/search", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("link", { name: /یک کلاس تازه/ }),
    ).toHaveAttribute("href", "/discovery/classes");
    await expect(
      page.getByRole("link", { name: /باشگاه مناسب تو/ }),
    ).toHaveAttribute("href", "/discovery/clubs");
    await page.screenshot({ path: info.outputPath(`search-${theme}.png`) });
    await page.goto("/athlete/training/exercises", {
      waitUntil: "domcontentloaded",
    });
    await expect(
      page
        .getByRole("navigation", { name: "بخش تمرین" })
        .getByRole("link", { name: "کتابخانه حرکات" }),
    ).toHaveAttribute("aria-current", "page");
    await page
      .getByRole("searchbox", { name: "جست‌وجوی حرکت" })
      .fill("بدون نتیجه");
    await expect(
      page.getByRole("heading", { name: "حرکتی با این فیلتر پیدا نشد." }),
    ).toBeVisible();
    await page.getByRole("button", { name: "نمایش همه حرکات" }).click();
    await expect(
      page.getByRole("heading", { name: "اسکوات", exact: true }),
    ).toBeVisible();
    await page.screenshot({ path: info.outputPath(`exercises-${theme}.png`) });
    await page.goto("/athlete/profile", { waitUntil: "domcontentloaded" });
    const support = page.getByRole("link", { name: /راهنما و پشتیبانی/ });
    await support.scrollIntoViewIfNeeded();
    await expect(support).toHaveAttribute("href", "/athlete/support");
    await page.screenshot({ path: info.outputPath(`profile-${theme}.png`) });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}

test("booking review keeps total visible and can return to session selection", async ({
  page,
}, info) => {
  const state = createMockApiState();
  await installApiMock(page, state);
  await setBrowserSession(page, true);
  await page.addInitScript(() =>
    sessionStorage.setItem("gym4me.splash.shown", "1"),
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/discovery/clubs/energy-plus-demo/slots", {
    waitUntil: "domcontentloaded",
  });
  await page
    .getByRole("radiogroup", { name: "ساعت رزرو را انتخاب کنید" })
    .locator('[data-slot="radio-content"]')
    .first()
    .click();
  await page.getByRole("button", { name: "رزرو کنید", exact: true }).click();
  const confirm = page.getByRole("button", { name: "ثبت رزرو و ادامه پرداخت" });
  await expect(confirm).toBeInViewport();
  await expect(page.getByText("قابل پرداخت", { exact: true })).toBeInViewport();
  await page
    .getByRole("heading", { name: "شرایط لغو و بازپرداخت" })
    .scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    document.querySelectorAll(".app-scroll-root, main").forEach((element) => {
      element.scrollTop = element.scrollHeight;
    });
    window.scrollTo(0, document.documentElement.scrollHeight);
  });
  const cancellation = page.getByRole("heading", {
    name: "شرایط لغو و بازپرداخت",
  });
  await expect(cancellation).toBeInViewport();
  await expect
    .poll(
      async () => {
        const heading = await page
          .getByRole("region", { name: "شرایط لغو و بازپرداخت", exact: true })
          .boundingBox();
        const footer = await page
          .getByRole("region", { name: "تأیید رزرو", exact: true })
          .boundingBox();
        return Boolean(
          heading && footer && heading.y + heading.height <= footer.y,
        );
      },
      { timeout: 10_000 },
    )
    .toBe(true);
  await expect(confirm).toBeInViewport();
  await page.screenshot({ path: info.outputPath("booking-review.png") });
  await page.getByRole("button", { name: "ویرایش سانس" }).click();
  await expect(
    page.getByRole("radiogroup", { name: "ساعت رزرو را انتخاب کنید" }),
  ).toBeVisible();
  expect(state.reservation).toBeNull();
});

for (const [method, label, theme] of [
  ["cash", "پرداخت نقدی", "light"],
  ["pos", "کارت‌خوان در محل", "dark"],
] as const) {
  test(`on-site ${method} payment persists and skips gateway in ${theme}`, async ({
    page,
  }, info) => {
    const state = createMockApiState();
    state.onSitePaymentMethods = ["cash", "pos"];
    await installApiMock(page, state);
    await setBrowserSession(page, true);
    await page.addInitScript((theme) => {
      localStorage.setItem("theme", theme);
      sessionStorage.setItem("gym4me.splash.shown", "1");
    }, theme);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 375, height: 900 });
    let gatewayRequests = 0;
    page.on("request", (request) => {
      if (request.url().includes("/payments/intents")) gatewayRequests++;
    });
    await page.goto("/discovery/clubs/energy-plus-demo/slots", {
      waitUntil: "domcontentloaded",
    });
    await page
      .getByRole("radiogroup", { name: "ساعت رزرو را انتخاب کنید" })
      .locator('[data-slot="radio-content"]')
      .first()
      .click();
    await page.getByRole("button", { name: "رزرو کنید", exact: true }).click();
    const radio = page.getByRole("radio", { name: new RegExp(label) });
    await radio.check();
    await expect(radio).toBeChecked();
    await radio.focus();
    await page.keyboard.press("ArrowDown");
    await expect(
      page.getByRole("radio", {
        name: method === "cash" ? /کارت‌خوان در محل/ : /پرداخت آنلاین/,
      }),
    ).toBeChecked();
    await page.keyboard.press("ArrowUp");
    await expect(radio).toBeChecked();
    await expect(
      page.locator('input[name="reservation-payment"]:checked'),
    ).toHaveCount(1);
    await expect(
      radio.locator("xpath=ancestor::label").locator("strong"),
    ).toHaveCSS("text-decoration-line", "underline");
    expect(
      await radio.evaluate((element) => ({
        outline: getComputedStyle(element).outlineStyle,
        shadow: getComputedStyle(element).boxShadow,
        border: getComputedStyle(element).borderTopWidth,
      })),
    ).toEqual({ outline: "none", shadow: "none", border: "0px" });
    await expect(
      page.getByText("قابل پرداخت در محل", { exact: true }),
    ).toBeInViewport();
    await page.screenshot({
      path: info.outputPath(`payment-${method}-${theme}.png`),
    });
    await page
      .getByRole("button", { name: "ثبت رزرو با پرداخت حضوری", exact: true })
      .click();
    await expect(
      page.getByText(
        "رزرو ثبت شد. هزینه را هنگام مراجعه به پذیرش باشگاه پرداخت کنید.",
      ),
    ).toBeVisible();
    expect(state.reservation).toMatchObject({
      paymentMethod: method,
      paymentStatus: "pay_on_arrival",
      paymentExpiresAt: null,
    });
    expect(gatewayRequests).toBe(0);
    await page.goto(`/athlete/reservations/${state.reservation!.id}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByText(label, { exact: true })).toBeVisible();
    await expect(
      page.getByText("قابل پرداخت در پذیرش", { exact: true }),
    ).toBeVisible();
    expect(gatewayRequests).toBe(0);
  });
}

test("checkout follows club methods and resets a disabled choice to the gateway", async ({
  page,
}) => {
  const state = createMockApiState();
  await installApiMock(page, state);
  await setBrowserSession(page, true);
  await page.addInitScript(() =>
    sessionStorage.setItem("gym4me.splash.shown", "1"),
  );
  await page.goto("/discovery/clubs/energy-plus-demo/slots");
  await page
    .getByRole("radiogroup", { name: "ساعت رزرو را انتخاب کنید" })
    .locator('[data-slot="radio-content"]')
    .first()
    .click();
  await page.getByRole("button", { name: "رزرو کنید", exact: true }).click();
  await expect(
    page.getByRole("radio", { name: /پرداخت آنلاین/ }),
  ).toBeChecked();
  await expect(page.getByRole("radio")).toHaveCount(1);
  await page.getByRole("button", { name: "ویرایش سانس" }).click();
  state.onSitePaymentMethods = ["cash"];
  await page.getByRole("button", { name: "رزرو کنید", exact: true }).click();
  await expect(page.getByRole("radio")).toHaveCount(2);
  await expect(
    page.getByRole("radio", { name: /کارت‌خوان در محل/ }),
  ).toHaveCount(0);
  await page.getByRole("radio", { name: /پرداخت نقدی/ }).check();
  await page.getByRole("button", { name: "ویرایش سانس" }).click();
  state.onSitePaymentMethods = [];
  await page.getByRole("button", { name: "رزرو کنید", exact: true }).click();
  await expect(
    page.getByRole("radio", { name: /پرداخت آنلاین/ }),
  ).toBeChecked();
  await expect(page.getByRole("radio")).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "ثبت رزرو و ادامه پرداخت" }),
  ).toBeVisible();
});
