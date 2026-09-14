# Flat UI and reservation payment methods

The application keeps its existing Persian RTL layout and light/dark palette. Application-level styles remove outlines, borders, rings and shadows, including shadows supplied by shared components. Arbitrary shadow utilities were removed from application source. Keyboard focus uses a surface-color change; selected payment options use a filled indicator and tinted surface.

Mobbin references: [Careem payment selection](https://mobbin.com/screens/47f6e4cd-31b4-457e-a4ac-8afa07d3e498) and [Swiggy payment options](https://mobbin.com/screens/812e029b-bf50-4621-94cd-ed5d35836df4). The useful pattern is a labeled, mutually exclusive method selection with an explicit payment action. The app retains its own typography, spacing and green palette. The 12ui follow-up review is now complete; details appear below.

[Cash selection — light](payment-preview/cash-light.png) · [Venue card selection — dark](payment-preview/pos-dark.png)

## API and lifecycle

- Owners configure `onSitePaymentMethods` (`cash` and/or `pos`) in the club editor's **عملیات → روش‌های پرداخت رزرو** section. The club create/update API persists this field and enforces ownership. Missing or empty settings mean online-only, including existing clubs that have not opted in. The application gateway cannot be disabled.
- `POST /api/v1/reservations/quote` publishes `availablePaymentMethods`: always `online`, followed only by that club's enabled on-site methods. Reservation submission validates the current configuration again and rejects a disabled method with `RESERVATION_PAYMENT_METHOD_UNAVAILABLE` before consuming capacity. On returning to review, checkout refreshes the quote and resets a removed selection to online.
- `POST /api/v1/reservations` accepts optional `paymentMethod`. Omission preserves existing online behavior. Prices, currency, inventory and entitlement eligibility remain server-validated.
- Cash and venue POS create a reserved booking with `paymentStatus: pay_on_arrival` and no online payment expiry. They do not open the online gateway or mark money as received. Zero-cost bookings remain `not_required`.
- Reservation lists/details expose the persisted method and collection/refund timestamps. Confirmation tells the customer to pay at reception.
- `POST /api/v1/business/clubs/:clubId/reservations/:reservationId/on-site-payment` accepts `{ action: "collect" | "refund", expectedAmount, receipt? }`. It requires the club's `payments.write` permission. It validates ownership, method, state and amount, records the staff member and timestamp, and performs the transition transactionally. Repeating a completed action is idempotent.
- Collection changes `pay_on_arrival` to `paid`. Attendance remains gated on actual payment or a free booking. Reminders include unpaid on-site reservations. Unpaid reservations are marked as no-shows when their session is completed.
- Cancelling an unpaid on-site booking releases inventory and returns no money. Cancelling a collected on-site booking records the policy's refund amount; it remains pending venue action until staff record the physical refund. On-site refunds do not use the platform gateway or payout ledger.
- The business reservation list offers explicit collection/refund actions with confirmation of the actual amount received or returned.

On-site payment is supported for club reservable sessions. Coach-service and package checkout retain their existing supported methods. Offline-paid reservations do not enter the gateway-based rescheduling exchange; customers can cancel and rebook, with any physical refund recorded by reception.

Changing the club's payment settings affects new reservations. Previously created cash/POS reservations retain their recorded method and can still be collected, cancelled, or refunded through the existing lifecycle.

## Verification

- Club-controlled payment follow-up: 30 backend tests passed across club persistence/ownership, DTO validation, on-site lifecycle, and online payment delegation. Five browser checks passed: four checkout paths (including changed club settings) and the owner's save/reload/disable flow. Backend, application, and business TypeScript checks passed; targeted application/business ESLint passed.

- Application, backend and business TypeScript checks; application ESLint.
- Ten backend tests passed across on-site lifecycle integration, existing online payment delegation, and reminders. The on-site integration suite uses a MongoDB replica set and covers persistence, permission/amount checks, concurrent duplicate collection, cancellation and physical-refund recording.
- Mobile Chromium checks cover online review, cash/POS selection and persistence, no gateway requests for on-site bookings, flat focus styles, and existing light/dark navigation/filter recovery. One dark screenshot write failed due to local disk exhaustion and passed on targeted retry.

This work has not been deployed. Browser tests use controlled API fixtures; backend lifecycle tests exercise the database separately.

## 12ui follow-up — 14 September 2026

Reviewed four generated alternatives for the payment-choice area and explicitly selected D. Draft, pick, responsive conversion, and plan all settled. The screenshot-based plan is unanchored; it is a reference for this small refinement, not a selector-verified or pixel-identical redesign of the whole app.

- Applied the selected design's visible checkmark within the green payment indicator and compact option spacing. Kept native mutually exclusive radios, arrow-key navigation, and pending-state disabling. Keyboard focus underlines the option title without adding outlines, borders, rings, or shadows.
- Restored visible completed/current booking steps using filled markers; the previous markers depended on borders suppressed by the flat theme. Removed redundant border/ring/divider utilities in the review component.
- Plan items 0–16 and 26–35 map to existing headers, session details, totals, and confirmation controls. Retained those components, real API values, sticky behavior, and existing theme tokens. Item 31's divider is omitted to honor the borderless request. Items 17–25 inform the option refinements; existing theme icons remain for consistency. Item 36 is the Next.js development badge captured in the source, not product branding, and was not added to the app.
- The generated landscape layout, rewritten sample content/amounts, font changes, gradients, and shadows were not applied because they conflict with the app's actual data, mobile layout, or requested theme. The kit declares no raster layers to ship and no recurring token deltas.
- Compared the final light/dark screenshots against candidate D's selection treatment. All three checkout browser checks passed after the refinement, including keyboard cycling with exactly one selected method, visible keyboard focus, cash/POS persistence without gateway requests, and cancellation-section clearance above the sticky footer. Application TypeScript and targeted ESLint passed. API code did not change in this follow-up.

The local design kit is retained at `/Users/mahdi/.codex/visualizations/2026/09/14/01a09ea1-437a-7c71-bb45-6d91c77a304b/12ui-payment-review`. A temporary disk-space failure was recovered using the same conversion; no replacement conversion was purchased.

### 12ui spend ledger

| purchase                                       | stage   | invocation                                            | price ceiling                                |
| ---------------------------------------------- | ------- | ----------------------------------------------------- | -------------------------------------------- |
| `crt-48367fd446fbde278a188bc9b38d3d9a6d477f3f` | draft   | `improve` pid 25602, started 2026-09-14T08:54:18.613Z | $0.12 (stage ceiling)                        |
| `b819a6e9-0b54-47cf-860b-f49527c44a9c`         | convert | not recorded                                          | $0.55 (stage ceiling, shared by 2 purchases) |
| `f1b85811-6953-4615-900c-ee2d9cf138bf`         | convert | not recorded                                          | $0.55 (stage ceiling, shared by 2 purchases) |

Three purchases across one run. The distinct stage ceilings total $0.67; actual prices settle server-side and are not recorded in the kit.
