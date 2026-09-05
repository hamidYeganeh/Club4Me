# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: coach-analytics.spec.ts >> coach dashboard renders charts, supports range changes and fits mobile
- Location: e2e/coach-analytics.spec.ts:88:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('region', { name: 'عملکرد شما' }).getByText('۳٬۰۰۰٬۰۰۰', { exact: true })
Expected: visible
Timeout: 8000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('region', { name: 'عملکرد شما' }).getByText('۳٬۰۰۰٬۰۰۰', { exact: true }) with timeout 8000ms
  - waiting for getByRole('region', { name: 'عملکرد شما' }).getByText('۳٬۰۰۰٬۰۰۰', { exact: true })

```

```yaml
- status "Gym4Me":
  - img "Gym4Me"
- status "در حال بارگذاری محتوا":
  - status "در حال بارگذاری محتوا"
- navigation "منوی اصلی":
  - link "خانه":
    - /url: /coach
  - link "کشف":
    - /url: /discovery
  - link "افزودن":
    - /url: /coach/classes/new
  - link "رزرو ها":
    - /url: /coach/reservations
  - link "پروفایل":
    - /url: /coach/profile
```

# Test source

```ts
  13  | const now = new Date("2026-09-05T12:00:00Z");
  14  | const booking = (changes: Partial<CoachBooking> = {}) =>
  15  |   ({
  16  |     id: "booking-1",
  17  |     bookedAt: now.toISOString(),
  18  |     status: "confirmed",
  19  |     paymentStatus: "paid",
  20  |     priceSnapshot: { amount: 1_000_000, currency: "IRR" },
  21  |     refundAmount: null,
  22  |     ...changes,
  23  |   }) as CoachBooking;
  24  | const coachClass = {
  25  |   id: "class-1",
  26  |   title: "تمرین قدرتی",
  27  |   status: "published",
  28  |   capacity: 10,
  29  |   enrollmentCount: 4,
  30  | } as CoachClass;
  31  | const enrollment = {
  32  |   id: "enrollment-1",
  33  |   classId: "class-1",
  34  |   registeredAt: now.toISOString(),
  35  |   status: "active",
  36  |   paymentStatus: "paid",
  37  |   priceSnapshot: { amount: 2_000_000, currency: "IRR" },
  38  |   refundAmount: null,
  39  | } as CoachEnrollment;
  40  | 
  41  | test("analytics excludes unpaid amounts, retains partial refunds and separates currencies", () => {
  42  |   const result = buildCoachAnalytics(
  43  |     [coachClass],
  44  |     [
  45  |       booking(),
  46  |       booking({ paymentStatus: "pending" }),
  47  |       booking({
  48  |         paymentStatus: "refunded",
  49  |         refundAmount: 800_000,
  50  |         status: "cancelled_by_athlete",
  51  |       }),
  52  |       booking({ priceSnapshot: { amount: 20, currency: "USD" } }),
  53  |       booking({ bookedAt: "2026-07-01T00:00:00Z" }),
  54  |       booking({ bookedAt: "2026-09-06T12:00:00Z" }),
  55  |       booking({ bookedAt: "invalid" }),
  56  |     ],
  57  |     [enrollment],
  58  |     30,
  59  |     "IRR",
  60  |     now,
  61  |   );
  62  |   expect(result.income).toBe(3_200_000);
  63  |   expect(result.reservations).toBe(5);
  64  |   expect(result.occupancyPercent).toBe(40);
  65  |   expect(result.statuses.map((item) => item.value)).toEqual([0, 4, 0, 1, 0]);
  66  |   expect(retainedPayment(booking({ paymentStatus: "refunded" }))).toBe(0);
  67  |   expect(retainedPayment(booking({ refundAmount: 2_000_000 }))).toBe(0);
  68  | });
  69  | 
  70  | test("analytics uses Tehran day boundaries and excludes inactive class capacity", () => {
  71  |   const result = buildCoachAnalytics(
  72  |     [{ ...coachClass, status: "cancelled" }],
  73  |     [
  74  |       booking({ bookedAt: "2026-08-29T20:30:00Z" }), // Aug 30 in Tehran: first included day.
  75  |       booking({ bookedAt: "2026-08-29T20:29:59Z" }),
  76  |     ],
  77  |     [],
  78  |     7,
  79  |     "IRR",
  80  |     now,
  81  |   );
  82  |   expect(result.reservations).toBe(1);
  83  |   expect(result.trend[0].bookings).toBe(1);
  84  |   expect(result.occupancyPercent).toBe(0);
  85  |   expect(result.occupancy).toEqual([]);
  86  | });
  87  | 
  88  | test("coach dashboard renders charts, supports range changes and fits mobile", async ({
  89  |   page,
  90  | }) => {
  91  |   const state = createMockApiState();
  92  |   state.user.roles = ["coach"];
  93  |   await installApiMock(page, state);
  94  |   await setBrowserSession(page, true);
  95  |   const timestamp = new Date().toISOString();
  96  |   await page.route("**/api/v1/coach/**", async (route) => {
  97  |     const path = new URL(route.request().url()).pathname;
  98  |     const data = path.endsWith("/profile")
  99  |       ? { displayName: "مربی آزمایشی", reviewStatus: "approved" }
  100 |       : path.endsWith("/classes/class-1/enrollments")
  101 |         ? { items: [{ ...enrollment, registeredAt: timestamp }] }
  102 |         : path.endsWith("/classes")
  103 |           ? { items: [coachClass] }
  104 |           : path.endsWith("/bookings")
  105 |             ? { items: [booking({ bookedAt: timestamp })] }
  106 |             : { items: [] };
  107 |     await route.fulfill({ json: { data } });
  108 |   });
  109 |   const errors: string[] = [];
  110 |   page.on("pageerror", (error) => errors.push(error.message));
  111 |   await page.goto("/coach");
  112 |   const section = page.getByRole("region", { name: "عملکرد شما" });
> 113 |   await expect(section.getByText("۳٬۰۰۰٬۰۰۰", { exact: true })).toBeVisible();
      |                                                                 ^ Error: expect(locator).toBeVisible() failed
  114 |   await expect(section.locator("svg")).toHaveCount(4);
  115 |   await section.getByLabel("بازه گزارش").selectOption("7");
  116 |   await expect(section.getByText("۳٬۰۰۰٬۰۰۰", { exact: true })).toBeVisible();
  117 |   await section.locator("summary").first().click();
  118 |   await expect(section.locator("table").first()).toBeVisible();
  119 |   expect(
  120 |     await page.evaluate(
  121 |       () => document.documentElement.scrollWidth <= window.innerWidth,
  122 |     ),
  123 |   ).toBe(true);
  124 |   await page.screenshot({
  125 |     path: "/tmp/coach-analytics-mobile.png",
  126 |     fullPage: true,
  127 |   });
  128 |   expect(errors).toEqual([]);
  129 | });
  130 | 
  131 | test("coach dashboard shows empty states and retries failed analytics", async ({
  132 |   page,
  133 | }) => {
  134 |   const state = createMockApiState();
  135 |   state.user.roles = ["coach"];
  136 |   await installApiMock(page, state);
  137 |   await setBrowserSession(page, true);
  138 |   let fail = true;
  139 |   await page.route("**/api/v1/coach/**", async (route) => {
  140 |     const path = new URL(route.request().url()).pathname;
  141 |     if (path.endsWith("/bookings") && fail) {
  142 |       return route.fulfill({ status: 500, json: { message: "Unavailable" } });
  143 |     }
  144 |     return route.fulfill({
  145 |       json: {
  146 |         data: path.endsWith("/profile")
  147 |           ? { displayName: "مربی آزمایشی", reviewStatus: "approved" }
  148 |           : { items: [] },
  149 |       },
  150 |     });
  151 |   });
  152 |   await page.goto("/coach");
  153 |   await expect(
  154 |     page.getByText("دریافت آمار کامل نشد. دوباره تلاش کنید."),
  155 |   ).toBeVisible({ timeout: 20000 });
  156 |   fail = false;
  157 |   await page.getByRole("button", { name: "تلاش دوباره", exact: true }).click();
  158 |   await expect(
  159 |     page.getByText("در این بازه درآمدی ثبت نشده است."),
  160 |   ).toBeVisible();
  161 |   await expect(
  162 |     page.getByText("هنوز کلاس فعالی برای نمایش وجود ندارد."),
  163 |   ).toBeVisible();
  164 | });
  165 | 
```