# API-to-UI usage audit

Generated 2026-09-05 by static inspection of `apps/backend`, `packages/api`, and
the four UI apps (`admin`, `application`, `business`, and `website`). Test,
generated, build, and dependency files were excluded.

## Implementation follow-up

The actionable product gaps from this audit were implemented after the initial
scan:

- Logout in the athlete/coach, admin, and business settings screens.
- Article deletion and article-category creation in the admin article flow.
- Saved-location deletion in the athlete/coach location manager.
- Athlete waitlist claiming on the business-class detail screen.
- Coach weekly availability, unavailable-date exceptions, and session
  rescheduling.
- Customer wallet balance/history, referral-code sharing, and referral-code
  redemption.
- Club team listing/invitation plus invitation accept/reject UI.
- Business-owner review listing and official responses.

The following remain intentionally without new UI:

- Payment gateway callbacks, mock/provider decision routes, and refund
  processing, per the requested payment-gateway exclusion.
- iOS-specific integrations.
- Health/readiness and other infrastructure endpoints.
- The legacy `/discovery/clubs...` family, the synchronous export route, and
  duplicate direct-public coaching routes; current UI uses their newer catalog,
  operations, async-export, and portal equivalents.
- Admin club detail and the duplicate business class moderation endpoints,
  because their list/operations responses already power the existing detail
  experiences.

The original findings below are retained as the baseline scan; items listed as
implemented above are no longer outstanding.

## High-confidence unused operations

These operations have a typed hook/client path in `packages/api`, but the hook
is never referenced from UI code.

| Method and route | Unused hook | Definition |
|---|---|---|
| POST `/account/auth/logout` | `useLogout` | `packages/api/src/domains/account/account.hooks.ts:135` |
| DELETE `/admin/articles/:id` | `useDeleteArticle` | `packages/api/src/domains/articles/articles.hooks.ts:64` |
| POST `/admin/article-categories` | `useCreateArticleCategory` | `packages/api/src/domains/articles/articles.hooks.ts:75` |
| POST `/athlete/club-classes/enrollments/:enrollmentId/waitlist/claim` | `useClaimClubClassWaitlist` | `packages/api/src/domains/coaching/club-classes.ts:161` |
| GET `/discovery/catalog/coaches` | `useCatalogCoaches` | `packages/api/src/domains/discovery/discovery.hooks.ts:62` |
| GET `/discovery/clubs` | `useClubs` | `packages/api/src/domains/discovery/discovery.hooks.ts:18` |
| GET `/discovery/clubs/:clubId` | `useClub` | `packages/api/src/domains/discovery/discovery.hooks.ts:163` |
| GET `/discovery/clubs/:clubId/classes` | `useClubClasses` | `packages/api/src/domains/discovery/discovery.hooks.ts:171` |
| GET `/discovery/clubs/:clubId/slots` | `useClubSlots` | `packages/api/src/domains/discovery/discovery.hooks.ts:179` |
| POST `/discovery/clubs` | `useCreateClub` | `packages/api/src/domains/discovery/discovery.hooks.ts:187` |
| POST `/discovery/clubs/:clubId/classes` | `useCreateClass` | `packages/api/src/domains/discovery/discovery.hooks.ts:205` |
| POST `/discovery/clubs/:clubId/slots` | `useCreateSlot` | `packages/api/src/domains/discovery/discovery.hooks.ts:219` |
| POST `/discovery/clubs/:clubId/slots/reserve` | `useReserveSlot` | `packages/api/src/domains/discovery/discovery.hooks.ts:233` |
| DELETE `/me/locations/:locationId` | `useDeleteUserLocation` | `packages/api/src/domains/locations/locations.hooks.ts:44` |

`useRefreshSession` is also not referenced by a component, but the refresh
route is used internally by the HTTP response interceptor, so it is not an
unused API operation.

## Backend operations with no shared client/UI path

The following feature routes exist in backend controllers but have no matching
operation in `packages/api`. This excludes health/readiness routes and includes
provider/admin operations even when they may intentionally be backend-only.

- Memberships: GET/POST `/business/clubs/:clubId/memberships`; PATCH
  `/club-memberships/:membershipId/accept`; PATCH
  `/club-memberships/:membershipId/reject`.
- Club moderation detail: GET `/admin/clubs/:clubId`.
- Coach service detail: GET/PATCH `/coach/services/:serviceId`.
- Coach class detail: GET/PATCH `/coach/classes/:classId`.
- Coach scheduling: POST `/coach/sessions/:sessionId/reschedule`.
- Coach availability: GET/PUT `/coach/availability`; POST
  `/coach/availability/exceptions`.
- Direct public coaching routes: GET `/public/coaches/:slug`, GET
  `/public/coaches/:slug/services`, GET `/public/classes`, GET
  `/public/classes/:slug`. (The UI currently uses discovery-catalog routes for
  these concepts.)
- Business class moderation: GET `/business/clubs/:clubId/classes`; PATCH
  `/business/clubs/:clubId/classes/:classId/review`.
- User benefits: GET `/benefits/wallet`; POST `/benefits/discounts/quote`; GET
  `/benefits/referral-code`; POST `/benefits/referrals/redeem`.
- Payment administration/provider: POST
  `/admin/payments/:intentId/refunds`; POST
  `/payments/callbacks/mock`.
- Legacy synchronous export: GET `/business/clubs/:clubId/operations/export`.
- Club review response: PATCH
  `/business/clubs/:clubId/reviews/:reviewId/response`.

## Typed API fields with no UI identifier usage

These fields are declared on API models, but their identifiers do not appear in
any UI source file. This is a conservative lexical result: it is strong evidence
for ordinary property access/destructuring, but runtime spreading or dynamic
key access can hide usage.

- `AdminCoach`: `avatarMediaId`
- `ClubCancellationRule`: `courtIds`, `reservationCutoffMinutes`,
  `rescheduleCutoffMinutes`, `noShowRefundPercent`,
  `ownerCancellationRefundPercent`
- `ClubLocation`: `cityRegionIds`, `postalCode`
- `BusinessDashboardSummary`: `paymentMix`
- `OperationsExportJob`: `sizeBytes`, `downloadPath`, `completedAt`
- `AthleteClubClassEnrollment`: `enrolledAt`
- `CoachClass`: `skillLevelId`, `plannedSessionCount`
- `CoachOffering`: `pricingType`, `venueClubIds`
- `CoachSession`: `offeringTitle`
- `CoachBooking`: `offeringTitle`, `bookedAt`
- `ClassEnrollment`: `classSlug`, `registeredAt`
- `CoachAttendanceItem`: `sourceType`, `checkedInAt`
- `CoachSport`: `specialtyIds`, `certificateMediaIds`, `achievements`
- `PaymentIntent`: `authority`, `grossAmount`, `discountAmount`, `platformFee`,
  `refundedAmount`, `refundedGatewayAmount`, `refundedWalletAmount`,
  `refundedDiscountAmount`, `checkoutUrl`, `reconciledAt`
- `PayoutBalance`: `ledgerBalance`
- `Reservation`: `slotId`
- `DiscoveryCoachItem`: `avatarMediaId`
- `PublicCatalogClass`: `imageMediaId`, `coachIds`
- `ClubCourt`: `surfaceTypeId`, `lengthMeters`, `widthMeters`, `locationLabel`,
  `isReservable`, `minimumReservationMinutes`, `maximumReservationMinutes`,
  `preparationMinutes`, `cleanupMinutes`
- `SupportTicket`: `internalNotes`, `slaDueAt`, `firstRespondedAt`,
  `slaBreachedAt`, `escalationLevel`

## Interpretation

- The legacy `/discovery/clubs...` family is the clearest deletion/migration
  candidate: all eight hooks are unused and overlap newer business, public
  catalog, class, and reservation flows.
- Unused write operations may indicate missing UI rather than removable API.
  Membership invitations, waitlist claims, review responses, account logout,
  location deletion, refunds, and coach availability are notable product gaps.
- Do not remove payment callbacks, health routes, app-release checks, token
  refresh, or push-device registration merely because no screen imports them;
  they are infrastructure/direct-client flows.
