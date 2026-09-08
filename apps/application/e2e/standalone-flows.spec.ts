import { expect, test } from "@playwright/test";
import {
  createMockApiState,
  installApiMock,
  setBrowserSession,
} from "./support/mock-api";

for (const theme of ["light", "dark"] as const) {
  test(`standalone ${theme}: role requests, support and membership routes`, async ({
    page,
  }, info) => {
    test.setTimeout(180_000);
    const state = createMockApiState();
    state.user.roles = ["athlete", "coach"];
    // Use an athlete account for requesting the professional role.
    state.user.roles = ["athlete"];
    await installApiMock(page, state);
    await setBrowserSession(page, true);
    await page.addInitScript(
      (value) => localStorage.setItem("theme", value),
      theme,
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    const requests: Record<string, unknown>[] = [];
    const messages = [
      {
        id: "message-1",
        authorType: "agent",
        body: "سلام، لطفاً جزئیات بیشتری از درخواست خود بنویسید.",
        createdAt: "2026-09-07T10:00:00Z",
      },
    ];
    const tickets = [
      {
        id: "ticket-demo",
        subject: "پیگیری پرداخت کلاس",
        status: "waiting_for_user",
        messages,
      },
    ];
    await page.route("**/api/v1/account/role-requests", (route) =>
      route.fulfill({ json: { data: { items: requests } } }),
    );
    await page.route("**/api/v1/account/roles/*", async (route) => {
      const body = route.request().postDataJSON();
      const role = route.request().url().split("/").at(-1);
      const request = {
        id: `request-${role}`,
        role,
        status: "pending",
        details: body.details,
        createdAt: "2026-09-07T10:00:00Z",
      };
      requests.push(request);
      await route.fulfill({ json: { data: request } });
    });
    await page.route("**/api/v1/support/tickets", async (route) => {
      if (route.request().method() === "POST") {
        const body = route.request().postDataJSON();
        const ticket = {
          id: "ticket-created",
          subject: body.subject,
          status: "open",
          messages: [
            {
              id: "created-message",
              authorType: "user",
              body: body.message,
              createdAt: "2026-09-07T10:00:00Z",
            },
          ],
        };
        tickets.push(ticket);
        return route.fulfill({ json: { data: ticket } });
      }
      return route.fulfill({ json: { data: { items: tickets } } });
    });
    await page.route(
      "**/api/v1/support/tickets/ticket-demo/replies",
      async (route) => {
        messages.push({
          id: "reply-1",
          authorType: "user",
          body: route.request().postDataJSON().message,
          createdAt: "2026-09-07T11:00:00Z",
        });
        await route.fulfill({ json: { data: tickets[0] } });
      },
    );
    await page.route("**/api/v1/benefit-purchases/mine/entitlements", (route) =>
      route.fulfill({
        json: {
          data: {
            items: [
              {
                id: "pack",
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
      (route) =>
        route.fulfill({
          json: { data: { items: [], total: 0, totalPages: 1, page: 1 } },
        }),
    );
    for (const width of [375, 820]) {
      await page.setViewportSize({ width, height: 900 });
      for (const [name, path] of [
        ["coach-request", "/auth/roles/coach"],
        ["owner-request", "/auth/roles/owner"],
        ["role-status", "/auth/roles/requests"],
        ["support-list", "/athlete/support"],
        ["support-new", "/athlete/support/new"],
        ["support-thread", "/athlete/support/ticket-demo"],
        ["coach-support", "/coach/support"],
        ["membership", "/athlete/memberships/pack"],
      ]) {
        await page.goto(path!);
        await expect(page.locator("header")).toHaveCount(1);
        await expect(page.locator("[data-hero-scrim]")).toHaveCount(1);
        await expect(page.locator('[role="status"].bg-accent')).toHaveCount(0);
        await page.evaluate(async () => {
          await document.fonts.ready;
          await Promise.all(
            Array.from(document.images).map((img) =>
              img.decode().catch(() => {}),
            ),
          );
          document
            .querySelectorAll("main,.app-scroll-root")
            .forEach((el) => el.scrollTo(0, 0));
          await new Promise(requestAnimationFrame);
        });
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        await page.screenshot({
          path: info.outputPath(`${name}-${theme}-${width}.png`),
        });
      }
    }
    await page.goto("/auth/roles?manage=1");
    await expect(page.locator("form")).toHaveCount(0);
    await page.getByRole("button", { name: /مربی/ }).click();
    await expect(page).toHaveURL(/\/auth\/roles\/coach$/);
    await page.reload();
    await expect(page.locator('form [name="specialty"]')).toBeVisible();
    for (const [name, value] of Object.entries({
      displayName: "نگار احمدی",
      city: "تهران",
      specialty: "بدنسازی",
      experienceYears: "5",
      description: "آموزش تمرین قدرتی و آمادگی جسمانی متناسب با سطح ورزشکار",
    }))
      await page.locator(`form [name="${name}"]`).fill(value);
    await page
      .getByRole("button", { name: "ارسال درخواست", exact: true })
      .click();
    await expect(page).toHaveURL(/\/auth\/roles\/requests$/);
    await expect(page.getByText("در حال بررسی", { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByText("در حال بررسی", { exact: true })).toBeVisible();
    await page.goto("/auth/roles/coach");
    await expect(page.locator("form")).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "پیگیری درخواست‌ها", exact: true }),
    ).toBeVisible();
    expect(requests).toHaveLength(1);
    await page.goto("/athlete/support");
    await expect(page.locator("form")).toHaveCount(0);
    await page
      .getByRole("link", { name: "ثبت تیکت جدید", exact: true })
      .click();
    await expect(page).toHaveURL(/\/support\/new$/);
    await page.getByLabel("موضوع", { exact: true }).fill("پیگیری درخواست جدید");
    await page
      .getByLabel("شرح درخواست")
      .fill("لطفاً وضعیت درخواست من را بررسی کنید.");
    await page.getByRole("button", { name: "ارسال", exact: true }).click();
    await expect(page).toHaveURL(/\/support\/ticket-created$/);
    await page.reload();
    await expect(
      page.getByText("لطفاً وضعیت درخواست من را بررسی کنید.", { exact: true }),
    ).toBeVisible();
    await page.goto("/athlete/support/ticket-demo");
    await page
      .getByLabel("پاسخ شما")
      .fill("پرداخت انجام شده اما رزرو نمایش داده نمی‌شود.");
    await page.getByRole("button", { name: "ارسال", exact: true }).click();
    await expect(
      page.getByText("پرداخت انجام شده اما رزرو نمایش داده نمی‌شود.", {
        exact: true,
      }),
    ).toBeVisible();
    await page.goto("/athlete/support/missing");
    await expect(
      page.getByRole("heading", { name: "این درخواست در دسترس نیست" }),
    ).toBeVisible();
  });
}

test("guest role request returns to the same form after login", async ({
  page,
}) => {
  await installApiMock(page, createMockApiState());
  await setBrowserSession(page);
  await page.route("**/api/v1/account/role-requests", (route) =>
    route.fulfill({ json: { data: { items: [] } } }),
  );
  await page.goto("/auth/roles/owner");
  await expect(page).toHaveURL(/\/auth$/);
  await page.goto("/auth/login");
  await page.getByPlaceholder("0912 0000 000").fill("09120000001");
  await page.getByPlaceholder("رمز عبور را وارد کنید").fill("Demo@1405");
  await page.getByRole("button", { name: "ورود", exact: true }).click();
  await expect(page).toHaveURL(/\/auth\/roles\/owner$/);
  await expect(page.locator('form [name="businessName"]')).toBeVisible();
});

for (const theme of ["light", "dark"] as const)
  test(`role tracking ${theme} refreshes approved account access`, async ({
    page,
  }, info) => {
    const state = createMockApiState();
    await installApiMock(page, state);
    await setBrowserSession(page, true);
    await page.addInitScript(
      (value) => localStorage.setItem("theme", value),
      theme,
    );
    const request = {
      id: "request-coach",
      role: "coach",
      status: "pending",
      details: { displayName: "نگار احمدی", city: "تهران" },
      createdAt: "2026-09-07T10:00:00Z",
    };
    await page.route("**/api/v1/account/role-requests", (route) =>
      route.fulfill({ json: { data: { items: [request] } } }),
    );
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto("/auth/roles/requests");
    await expect(page.getByText("در حال بررسی", { exact: true })).toBeVisible();
    await expect(page.locator('[role="status"].bg-accent')).toHaveCount(0);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(
        Array.from(document.images).map((img) => img.decode().catch(() => {})),
      );
    });
    await page.screenshot({
      path: info.outputPath(`role-status-${theme}-375.png`),
    });
    request.status = "approved";
    state.user.roles.push("coach");
    await page
      .getByRole("button", { name: "به‌روزرسانی", exact: true })
      .click();
    await expect(
      page.getByRole("link", { name: "ورود به حساب مربی", exact: true }),
    ).toHaveAttribute("href", "/coach");
  });
