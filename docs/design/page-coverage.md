# Application design coverage — 7 September 2026

The original green brand tokens remain unchanged. Shared secondary navigation and the Sandow surface/radius/type adapter apply throughout the application. Photographic introductions use opposing vertical gradients with progressively masked 2/4/8/16px blur layers. Forms use compact introductions; search, maps, galleries and payment results prioritize their functional content.

## Added in this pass

| Route family | Implementation |
| --- | --- |
| `/athlete/profile/edit`, `/coach/profile/edit` | Shared secondary header, compact photo introduction, real avatar/initials and image-edit navigation; existing field editors retained. |
| `/{athlete,coach}/profile/image` | Secondary header and compact intro around existing upload workflow. |
| `/{athlete,coach}/profile/locations`, `/new`, `/[locationId]/edit` | Full-page location list and consistent form intro; saved-location queries, default selection and mutations retained. |
| `/coach/availability` | Photo intro and secondary header around the existing scheduler and exceptions. |
| `/coach/classes/new`, `/coach/classes/[classId]/edit`, `/coach/services/new`, `/coach/services/[offeringId]/edit`, `/coach/profile/professional` | Shared `DiscoveryPageHeader` photo intro and consistent navigation; existing form fields and save handlers retained. |
| `/coach/club-classes/[classId]`, `/coach/reservations` | Shared page introductions around class management and reservation records. |
| `/athlete/reservations/[reservationId]` | Compact reservation detail intro; actual source-specific records and actions retained. |
| `/discovery`, `/discovery/cities`, `/discovery/sports`, `/discovery/sports/[sportId]` | Discovery introductions through `AppPageIntro` / `DiscoveryBrowseIntro`. |
| `/discovery/business-classes/[classId]` | Photo hero with actual class title/description and separate capacity/date/fee facts; enrollment flow retained. |
| `/discovery/{clubs,classes,coaches}/[id]/reviews`, `/reviews/new` | Compact review/list/form introductions. Existing eligibility or unsupported-feature messaging remains authoritative. |
| `/discovery/search`, `/discovery/map`, entity `/gallery` routes | Secondary headers; search input, map canvas and original gallery imagery remain central. |
| Club `/slots`, booking review, coach booking receipt | Shared navigation; slot background adopts the shared opposing gradient/blur scrim. Existing quote, payment and booking callbacks retained. |
| `/club-memberships/[membershipId]` | Invitation intro/header around accept/reject actions. |
| Authentication screens using `AccountAuthOtpHeaderSection` | Shared secondary header around existing authentication forms. |
| `/articles`, `/coaches` | Reuse the real discovery screens instead of standalone placeholder preview cards. |

Home, profile overview, settings, notifications, favorites, benefits, memberships, support, athlete classes and main discovery/detail/location screens were adapted in the preceding passes. Welcome onboarding and payment gateway/result overlays retain their specialized layouts and inherit the common theme; large photographic heroes are not added to those flows.

## Settings behavior and verification

Settings use authenticated GET/PATCH `/notifications/preferences`. A real ephemeral MongoDB integration test exposed an identifier mismatch: update used an ObjectId while retrieval passed a string. Retrieval now uses the same ObjectId representation. Browser reload tests also exposed stale offline preferences being considered fresh for 60 seconds. The preferences query now revalidates on mount with zero stale time, so a restored snapshot does not suppress a server read. Tests verify partial-update preservation, fresh-service reads, account isolation and notification recipient filtering. Firebase is not initialized and no notifications are sent by these tests.

Four server preferences cover booking updates, reminders, discovery and marketing. Device notification registration is currently Android-only; web/iOS are explicitly shown as unsupported. Theme selection is a browser/device preference. Logout and account deletion retain their real API mutations and deletion confirmation.

Browser previews use mocked API data and verify UI wiring; they are not proof of deployed-server behavior. No production account was changed, deleted or messaged. Android permission/delivery and native blur performance require device verification.

[Light/dark preview gallery](previews/remaining/index.html)

## Validation completed

- Isolated production build and TypeScript passed after the settings cache fix and business-class hero change.
- 19 distinct browser cases passed across the design, settings, account, booking, professional profile and targeted scheduling/service suites. The ten-page responsive preview sweep covers both 375px/820px and light/dark. Settings are explicitly checked after reload.
- Two real ephemeral MongoDB preference tests passed. App targeted ESLint, backend preference-file formatting and the 71-token design consistency check passed.
- The local gallery decoded all 20 mobile screenshots in both themes; final screenshots wait for the splash screen to exit. Desktop-sized screenshots are also stored alongside them.

## Authentication and role pages — continuation

`AuthPageIntro` now brings the compact photograph, opposing gradients and progressive blur to `/auth/login`, `/auth/otp`, `/auth/otp/confirm`, `/auth/forgot-password`, `/auth/forgot-password/confirm`, `/auth/set-password`, and `/auth/roles`. Coach and owner request forms within the roles route use the same introduction and surface treatment. The existing green brand palette is unchanged.

Authentication forms use rounded surface containers. The shared auth layout starts beneath the secondary header instead of vertically centering the whole form. When the keyboard opens, the photo is replaced by a compact text introduction, retaining the title and form state. Set-password has its own secondary header; the required password setup flow still controls its navigation. Existing submit handlers, OTP resend/edit controls, role eligibility and password/deep-link routing remain in place.

[Authentication and role preview gallery](previews/auth/index.html) contains nine screens/states in light and dark themes, captured from the application with mocked API data.

Continuation validation: final production build/TypeScript, targeted ESLint, formatting and the 71-token consistency check passed. Seven distinct browser cases passed: light/dark responsive auth and role screens, OTP cell containment and typing, simulated keyboard layout with retained password input, password login, protected deep-link return and password-setup return routing. Eight screens/states were captured at 375px and 820px in both themes; password setup was captured at 375px in both themes. This is browser validation with test fixtures, not native-device or live authentication verification.

## Independent task routes — UX follow-up

See [the page-gap audit](./ux-page-gaps.md) for nine newly added routes and the distinction between missing pages and incomplete product capabilities. Role application forms now live at `/auth/roles/coach` and `/auth/roles/owner`; submission navigates to `/auth/roles/requests`. Pending requests remain trackable instead of opening another form. Protected role links are allowlisted as safe login-return destinations. Status refresh also refreshes account roles so approved access can appear.

Support now has list/new/thread routes for both athlete and coach. Creation preserves any order reference and opens the created thread; replies and closed-ticket behavior retain their existing API hooks. Legacy support links containing an order reference redirect to the new form route. Membership detail and paginated usage move to `/athlete/memberships/[entitlementId]`.

[Independent page preview gallery](previews/flows/index.html). These are application screenshots with mocked data; production submission was not performed.
