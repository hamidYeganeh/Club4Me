# Application UI/UX review — Mobbin references

The application keeps its existing Sandow surfaces, green accent, Persian typography, RTL layout, icon set, light/dark themes, and safe-area spacing. Mobbin is used for interaction and information hierarchy references, not copied brand styling.

## Reference decisions

| Reference | Observed pattern | Application decision |
|---|---|---|
| [ClassPass search](https://mobbin.com/flows/41b95cfe-b2ba-44dd-87ed-1e28eb0091bc) | Search plus clear browsing categories | Four semantic entry points for clubs, classes, coaches, and sports on the search landing screen. |
| [Nike Training Club search](https://mobbin.com/flows/42444b60-54b5-4b9c-8311-294a3b154dfa) | Focused browsing navigation and visible result metadata | Correct active training destination, result count, removable exercise filters, and a recovery action for no matches. |
| [Airbnb booking](https://mobbin.com/flows/5b91784c-84a8-41e5-9f29-138275095d5f) | Editable reservation summary | Explicit edit-session action and an accessible current checkout step. |
| [Booking.com booking](https://mobbin.com/flows/4b416fa8-669a-410e-a2d5-f76b3e588874) | Persistent total near the booking action | Pinned payable amount and confirmation; cancellation conditions precede the action in reading order. |
| [Airbnb account settings](https://mobbin.com/flows/c808890f-1025-46e0-a083-2da40e5a081f) | Consistent destinations in a simple list | A grouped profile list with descriptive labels and a direct support destination. |
| [Strava progress](https://mobbin.com/screens/8750eb55-deb4-4533-8b91-0a85affae067) | Progress metrics and a selected section | Retain the existing progress dashboard and correct its shared navigation state. |
| [Headspace goals](https://mobbin.com/screens/6aba84cc-e359-446c-8cf3-b10cae809456) | Clear choices followed by a primary continuation | Retain the existing onboarding and role-selection hierarchy. |
| [ClassPass upcoming](https://mobbin.com/screens/55214e64-ab88-4f1e-bece-9e20ce82d276) | Upcoming activity foregrounds time and place | Retain the existing next-activity card and agenda. |

## Changes

- Shared list filters expose active-filter counts and result totals; selected filters can be cleared outside the sheet.
- Exercise library shows matching counts, removable muscle/equipment choices, and an actionable empty search.
- Training navigation follows the current route and announces it using aria-current.
- Search landing offers club, class, coach, and sport destinations while retaining recent searches and topics.
- Booking review retains payment behavior and calculations; adds editing, clear cancellation hierarchy, a persistent total, and pending-state protection.
- Athlete and coach profiles use consistent row spacing, secondary descriptions, quieter icons, and support access.
- Membership search no longer silently renders nothing when filters exclude all memberships; unknown membership IDs lead back to the membership list.
- Unknown saved locations retain the page header and a way back; network failures still offer retry.
- The legacy class URL without an ID now offers a class-browsing action instead of an indefinite loader.
- Reviews and galleries surface failed entity requests before loading dependent content; galleries retain their header and a recovery route.
- Checkout content cannot shrink inside its scroll container, keeping the full cancellation section above the fixed payment action.

## Audit scope

The route inventory contains 100 page routes. Shared screens cover both athlete and coach roles. The browser audit uses controlled API fixtures; many unknown detail IDs deliberately exercise unavailable states. Those captures do not substitute for every populated detail state, permission prompt, native-device behavior, or real payment gateway. Booking review receives a separate interaction check.

## Route coverage

| Route | Screen entry |
|---|---|
| `/` | Route wrapper / redirect / composed page |
| `/articles` | Route wrapper / redirect / composed page |
| `/athlete` | import { AthleteHomeScreen } from "@modules/athlete/screens/AthleteHomeScreen"; |
| `/athlete/benefits` | import { BenefitsScreen } from "@modules/benefits/screens/BenefitsScreen"; |
| `/athlete/classes` | import { AthleteClubClassesScreen } from "@modules/athlete/screens/AthleteClubClassesScreen"; |
| `/athlete/favorites` | import { AthleteFavoritesScreen } from "@modules/athlete/screens/AthleteFavoritesScreen"; |
| `/athlete/memberships` | import { MembershipsScreen } from "@modules/benefits/screens/MembershipsScreen"; |
| `/athlete/memberships/[entitlementId]` | import { MembershipsScreen } from "@modules/benefits/screens/MembershipsScreen"; |
| `/athlete/notifications` | import { NotificationsScreen } from "@modules/notifications/screens/NotificationsScreen"; |
| `/athlete/packages` | import { CoachPackagesScreen } from "@modules/coach-packages/CoachPackagesScreen"; |
| `/athlete/packages/[coachSlug]` | import { CoachPackagesScreen } from "@modules/coach-packages/CoachPackagesScreen"; |
| `/athlete/profile` | import { AthleteProfileScreen } from "@modules/athlete/screens/AthleteProfileScreen"; |
| `/athlete/profile/edit` | import { ProfileEditScreen } from "@modules/profile/screens/ProfileEditScreen"; |
| `/athlete/profile/image` | import { ProfileImageScreen } from "@modules/profile/screens/ProfileImageScreen"; |
| `/athlete/profile/locations` | import { LocationsScreen } from "@modules/locations/screens/LocationsScreen"; |
| `/athlete/profile/locations/[locationId]/edit` | import { LocationFormScreen } from "@modules/locations/screens/LocationFormScreen"; |
| `/athlete/profile/locations/new` | import { LocationFormScreen } from "@modules/locations/screens/LocationFormScreen"; |
| `/athlete/recommendations` | import { AthleteRecommendationsSection } from "@modules/athlete/sections/AthleteRecommendationsSection";; import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader"; |
| `/athlete/reservations` | import { ReservationsScreen } from "@modules/reservations/screens/ReservationsScreen"; |
| `/athlete/reservations/[reservationId]` | import { ReservationDetailsScreen } from "@modules/reservations/screens/ReservationDetailsScreen"; |
| `/athlete/settings` | import { AppSettingsScreen } from "@modules/settings/screens/AppSettingsScreen"; |
| `/athlete/support` | import { SupportTicketsScreen } from "@modules/support/screens/SupportTicketsScreen"; |
| `/athlete/support/[ticketId]` | import { SupportTicketsScreen } from "@modules/support/screens/SupportTicketsScreen"; |
| `/athlete/support/new` | import { SupportTicketsScreen } from "@modules/support/screens/SupportTicketsScreen"; |
| `/athlete/training` | import { AthleteTraining } from "@modules/training/AthleteTraining"; |
| `/athlete/training/exercises` | import { ExerciseLibrary } from "@modules/training/ExerciseLibrary"; |
| `/athlete/training/progress` | import { TrainingProgress } from "@modules/training/TrainingProgress"; |
| `/auth` | import { AccountAuthHomeScreen } from "@modules/account/screens/AccountAuthHomeScreen"; |
| `/auth/forgot-password` | import { AccountAuthForgotPasswordScreen } from "@modules/account/screens/AccountAuthForgotPasswordScreen"; |
| `/auth/forgot-password/confirm` | import { AccountAuthForgotPasswordConfirmScreen } from "@modules/account/screens/AccountAuthForgotPasswordConfirmScreen";; import { AuthScreenSkeleton } from "@/components/loading-skeletons"; |
| `/auth/login` | import { AccountAuthLoginScreen } from "@modules/account/screens/AccountAuthLoginScreen"; |
| `/auth/otp` | import { AccountAuthOtpScreen } from "@modules/account/screens/AccountAuthOtpScreen"; |
| `/auth/otp/confirm` | import { AccountAuthOtpConfirmScreen } from "@modules/account/screens/AccountAuthOtpConfirmScreen";; import { AuthScreenSkeleton } from "@/components/loading-skeletons"; |
| `/auth/roles` | import { AccountAuthRolesScreen } from "@modules/account/screens/AccountAuthRolesScreen"; |
| `/auth/roles/coach` | import { RoleRequestScreen } from "@modules/account/screens/RoleRequestScreens"; |
| `/auth/roles/owner` | import { RoleRequestScreen } from "@modules/account/screens/RoleRequestScreens"; |
| `/auth/roles/requests` | import { RoleRequestsScreen } from "@modules/account/screens/RoleRequestScreens"; |
| `/auth/set-password` | import { AccountAuthSetPasswordScreen } from "@modules/account/screens/AccountAuthSetPasswordScreen"; |
| `/auth/social/callback` | Route wrapper / redirect / composed page |
| `/club-memberships/[membershipId]` | import { ClubMembershipInvitationScreen } from "@modules/account/screens/ClubMembershipInvitationScreen"; |
| `/coach` | import { CoachHomeScreen } from "@modules/coach/screens/CoachHomeScreen"; |
| `/coach/availability` | import { CoachAvailabilityScreen } from "@modules/coach/screens/CoachAvailabilityScreen"; |
| `/coach/benefits` | import { BenefitsScreen } from "@modules/benefits/screens/BenefitsScreen"; |
| `/coach/classes/[classId]/edit` | import { CoachClassFormScreen } from "@modules/coach/screens/CoachClassFormScreen"; |
| `/coach/classes/new` | import { CoachClassFormScreen } from "@modules/coach/screens/CoachClassFormScreen"; |
| `/coach/club-classes` | import { CoachClubClassScreen } from "@modules/coach/screens/CoachClubClassScreen"; |
| `/coach/club-classes/[classId]` | import { CoachClubClassScreen } from "@modules/coach/screens/CoachClubClassScreen"; |
| `/coach/favorites` | import { AthleteFavoritesScreen } from "@modules/athlete/screens/AthleteFavoritesScreen"; |
| `/coach/notifications` | import { NotificationsScreen } from "@modules/notifications/screens/NotificationsScreen"; |
| `/coach/profile` | import { ProfileScreen } from "@modules/profile/screens/ProfileScreen"; |
| `/coach/profile/edit` | import { ProfileEditScreen } from "@modules/profile/screens/ProfileEditScreen"; |
| `/coach/profile/image` | import { ProfileImageScreen } from "@modules/profile/screens/ProfileImageScreen"; |
| `/coach/profile/locations` | import { LocationsScreen } from "@modules/locations/screens/LocationsScreen"; |
| `/coach/profile/locations/[locationId]/edit` | import { LocationFormScreen } from "@modules/locations/screens/LocationFormScreen"; |
| `/coach/profile/locations/new` | import { LocationFormScreen } from "@modules/locations/screens/LocationFormScreen"; |
| `/coach/profile/professional` | import { CoachProfileFormScreen } from "@modules/coach/screens/CoachProfileFormScreen"; |
| `/coach/reservations` | import { CoachReservationsScreen } from "@modules/coach/screens/CoachReservationsScreen"; |
| `/coach/services/[offeringId]/edit` | import { CoachOfferingFormScreen } from "@modules/coach/screens/CoachOfferingFormScreen/CoachOfferingFormScreen"; |
| `/coach/services/new` | import { CoachOfferingFormScreen } from "@modules/coach/screens/CoachOfferingFormScreen/CoachOfferingFormScreen"; |
| `/coach/settings` | import { AppSettingsScreen } from "@modules/settings/screens/AppSettingsScreen"; |
| `/coach/support` | import { SupportTicketsScreen } from "@modules/support/screens/SupportTicketsScreen"; |
| `/coach/support/[ticketId]` | import { SupportTicketsScreen } from "@modules/support/screens/SupportTicketsScreen"; |
| `/coach/support/new` | import { SupportTicketsScreen } from "@modules/support/screens/SupportTicketsScreen"; |
| `/coach/training` | import { CoachTraining } from "@modules/training/CoachTraining"; |
| `/coach/training/exercises` | import { ExerciseLibrary } from "@modules/training/ExerciseLibrary"; |
| `/coaches` | Route wrapper / redirect / composed page |
| `/discovery` | import { DiscoveryHomeScreen } from "@modules/discovery/screens/DiscoveryHomeScreen"; |
| `/discovery/articles` | import { DiscoveryArticlesScreen } from "@modules/discovery/screens/DiscoveryArticlesScreen"; |
| `/discovery/articles/[articleId]` | import { DiscoveryArticleDetailScreen } from "@modules/discovery/screens/DiscoveryArticleDetailScreen"; |
| `/discovery/business-class` | import { BusinessClassDetailScreen } from "@modules/discovery/screens/BusinessClassDetailScreen"; |
| `/discovery/business-classes/[classId]` | import { BusinessClassDetailScreen } from "@modules/discovery/screens/BusinessClassDetailScreen"; |
| `/discovery/cities` | import { DiscoveryCitiesScreen } from "@modules/discovery/screens/DiscoveryCitiesScreen"; |
| `/discovery/city/[cityId]` | import { DiscoveryCityScreen } from "@modules/discovery/screens/DiscoveryCityScreen"; |
| `/discovery/city/[cityId]/district/[districtId]` | import { DiscoveryDistrictScreen } from "@modules/discovery/screens/DiscoveryDistrictScreen"; |
| `/discovery/classes` | import { DiscoveryClassesScreen } from "@modules/discovery/screens/DiscoveryClassesScreen"; |
| `/discovery/classes/[classId]` | import { DiscoveryProfileDetailScreen } from "@modules/discovery/screens/DiscoveryProfileDetailScreen"; |
| `/discovery/classes/[classId]/gallery` | import { DiscoveryEntityGalleryScreen } from "@modules/discovery/screens/DiscoveryEntityGalleryScreen"; |
| `/discovery/classes/[classId]/reviews` | import { DiscoveryReviewsScreen } from "@modules/discovery/screens/DiscoveryReviewsScreen"; |
| `/discovery/classes/[classId]/reviews/new` | import { DiscoveryReviewFormScreen } from "@modules/discovery/screens/DiscoveryReviewFormScreen"; |
| `/discovery/club-types/[typeId]` | Route wrapper / redirect / composed page |
| `/discovery/clubs` | import { DiscoveryClubsScreen } from "@modules/discovery/screens/DiscoveryClubsScreen";; import type { DiscoveryClubsBrowse } from "@modules/discovery/screens/DiscoveryClubsScreen"; |
| `/discovery/clubs/[clubId]` | import { DiscoveryClubsDetailScreen } from "@modules/discovery/screens/DiscoveryClubsDetailScreen"; |
| `/discovery/clubs/[clubId]/gallery` | import { DiscoveryClubGalleryScreen } from "@modules/discovery/screens/DiscoveryClubGalleryScreen"; |
| `/discovery/clubs/[clubId]/reviews` | import { DiscoveryReviewsScreen } from "@modules/discovery/screens/DiscoveryReviewsScreen"; |
| `/discovery/clubs/[clubId]/reviews/new` | import { DiscoveryReviewFormScreen } from "@modules/discovery/screens/DiscoveryReviewFormScreen"; |
| `/discovery/clubs/[clubId]/slots` | import { DiscoveryClubSlotsScreen } from "@modules/discovery/screens/DiscoveryClubSlotsScreen"; |
| `/discovery/coaches` | import { DiscoveryPeopleScreen } from "@modules/discovery/screens/DiscoveryPeopleScreen"; |
| `/discovery/coaches/[coachId]` | import { DiscoveryProfileDetailScreen } from "@modules/discovery/screens/DiscoveryProfileDetailScreen"; |
| `/discovery/coaches/[coachId]/gallery` | import { DiscoveryEntityGalleryScreen } from "@modules/discovery/screens/DiscoveryEntityGalleryScreen"; |
| `/discovery/coaches/[coachId]/reviews` | import { DiscoveryReviewsScreen } from "@modules/discovery/screens/DiscoveryReviewsScreen"; |
| `/discovery/coaches/[coachId]/reviews/new` | import { DiscoveryReviewFormScreen } from "@modules/discovery/screens/DiscoveryReviewFormScreen"; |
| `/discovery/map` | import { DiscoveryMapScreen } from "@modules/discovery/screens/DiscoveryMapScreen"; |
| `/discovery/province/[provinceId]` | import { DiscoveryProvinceScreen } from "@modules/discovery/screens/DiscoveryProvinceScreen"; |
| `/discovery/regions/[regionId]` | import { DiscoveryCategoryScreen } from "@modules/discovery/screens/DiscoveryCategoryScreen"; |
| `/discovery/search` | import { DiscoverySearchScreen } from "@modules/discovery/screens/DiscoverySearchScreen"; |
| `/discovery/sports` | import { DiscoverySportsScreen } from "@modules/discovery/screens/DiscoverySportsScreen"; |
| `/discovery/sports/[sportId]` | import { DiscoveryCategoryScreen } from "@modules/discovery/screens/DiscoveryCategoryScreen"; |
| `/welcome` | import { WelcomeHomeScreen } from "@modules/welcome/screens/WelcomeHomeScreen"; |
| `/welcome/introduce` | import { WelcomeIntroduceScreen } from "@modules/welcome/screens/WelcomeIntroduceScreen"; |
| `/welcome/sign-in` | Route wrapper / redirect / composed page |

## Verification

All 100 application routes were captured and visually reviewed in mobile Chromium at 375 × 900, using the dark theme and controlled API fixtures. Route checks passed across batches and targeted reruns after fixes. This is not a single uninterrupted full-suite run: earlier batches encountered local disk exhaustion, development reloads, and loading-state failures that were investigated and repaired or rechecked.

The focused search, exercise-filter recovery, training navigation, and profile-link checks passed in both light and dark themes. The final checkout test passed, including total/action visibility, the entire cancellation section clearing the fixed footer, return to session selection, and no reservation creation during review. TypeScript and ESLint passed.

The audit includes initial mobile viewports and selected interaction states. Unavailable detail fixtures, external map tiles, welcome video playback, native permissions, and a real payment gateway require separate testing with production-like data and devices.

Run the lightweight visual and interaction suite against an existing preview:

```sh
PLAYWRIGHT_BASE_URL=http://127.0.0.1:7081 npx playwright test --config=playwright.mobbin.config.ts
```

Run from `apps/application`. The preview URL can be changed to match the local server. This config disables video and traces and uses scale-1 screenshots to reduce disposable output.
