# Sandow → Club4Me design system

Reviewed and extracted 2026-09-06 from [SH Sandow UI Kit](https://www.figma.com/design/VbhFFT3ziySCy7I3P06TVm/?node-id=37-445).

## Review and source boundaries

The shared URL selects the welcome page, not an application screen. The file exposes two pages: Welcome and Design System & Components. The latter contains **30 sections**. The filename says v1.6, while section headers say v1.7. This integration records node IDs and extraction date rather than claiming a consistent upstream release.

The design is strongest as a mobile component library: generous rounded containers, bold headings, neutral surfaces, compact visual metrics, and clear accent hierarchy. Its 375 × 812 example grid has 16px outer gutters and a 4px spacing scale. Existing Club4Me screens are compositions of these patterns around discovery, class management and booking; this is not a reproduction of a finished Sandow application screen.

Observed inconsistencies:

- The primary-typeface layer is named Urbanist, while visible text and actual styles use **Work Sans**. Actual style values take precedence.
- Pulse Orange/40 is #FB923C in the palette but #FF8036 in the welcome context. The palette is the primitive source of truth.
- Dark blur sm/md/lg all report an 8px effect radius. Light blur reports 8/16/32, while generated CSS uses 4/8/16. Keep the recorded source references; no invented uniform blur scale.
- Some photographs return `unknown` asset URLs. Production cards continue using their API image URLs and existing fallback behavior.
- White small text on Orange/50 and Green/50 has insufficient contrast. Production metric cards use dark text on those backgrounds. The application keeps its original green brand accent and foreground from `heroui.css` in both themes; Sandow orange is used only as a categorical metric color.
- The file's nutrition, biometric and AI components are visual concepts, not evidence of implemented application capabilities.

The Plugin API reader rejected read-only inspection scripts. Design context and structural metadata succeeded, then the Figma Starter plan tool limit prevented further requests. Full design context was obtained for the palette, typography, buttons 1, navigation, spacing, effects, home fitness metrics, coach overview, settings cards and notification cards. Other families have a structural inventory, not a complete verified implementation spec. No Figma canvas changes or Code Connect publication were performed.

## Extracted foundations

| Foundation   | Source                                                                                          | Application decision                                                                             |
| ------------ | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Colors       | 71 named colors: Gray plus Orange, Yellow, Blue, Red, Green, Purple                             | Generated primitive CSS, mapped to existing HeroUI semantic variables                            |
| Typography   | Work Sans; display 96/128/180; headings 24/30/36/48/60/72; text 10/12/14/16/18/20/24            | Preserve IRANSansX and readable Persian line height; reusable section headings 18/28, body 14/24 |
| Weight       | 400, 500, 600, 700, 800 across styles                                                           | Existing font weights preserved; section labels 700                                              |
| Tracking     | Negative tracking for Latin text; uppercase label tracking                                      | Do not apply Latin tracking or uppercase to Persian                                              |
| Spacing      | 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128, 160, 192, 224, 256px; 2px increments below 8 | 16px page gutters, 12px card gaps, 32px dashboard sections                                       |
| Corners      | 16px controls, 24px settings, 32px feature/metric cards; 100% Figma corner smoothing            | CSS border-radius with identical nominal sizes; CSS is not an exact Figma squircle               |
| Buttons      | 32/40/48/56/64px heights, corresponding 11/13/16/19/21px radii                                  | 56px default, 64px large, 44px minimum small and icon touch targets                              |
| Fields       | Standard text and telephone controls 56px                                                       | Shared field height 56px, 16px radius                                                            |
| Metric cards | 154px width, 194px reference height, 16px padding, 32px radius                                  | Minimum height with reflow for Persian labels; real reservation/class statistics                 |
| Settings     | 344px reference width, 24px radius, 12px padding, optional control                              | Fluid SettingsRow; caller owns accessible switch labels and API updates                          |
| Effects      | Shadows from 0 4px 8px #1112140D to 0 32px 64px #11121426                                       | Soft card shadow; focus outline; reduced motion honored                                          |

Raw color values and source style descriptions are in [sandow-extraction.json](./sandow-extraction.json). Named component families and variants are in [sandow-components.json](./sandow-components.json). Structural frame entries are not all Figma components; the inventory distinguishes frames from component symbols.

## Sections mapped to application features

| Figma section                                                                                     | Application feature                          | Integration status                                                                                      |
| ------------------------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| [Typography](https://www.figma.com/design/VbhFFT3ziySCy7I3P06TVm/?node-id=37-767)                 | All application screens                      | IRANSansX retained for Persian; Work Sans source ramp documented.                                       |
| [Inputs 1](https://www.figma.com/design/VbhFFT3ziySCy7I3P06TVm/?node-id=205-17108)                | Auth, profile edit, search                   | HeroUI controls use the 56px field token; existing validation remains.                                  |
| [Chat System](https://www.figma.com/design/VbhFFT3ziySCy7I3P06TVm/?node-id=205-21018)             | No equivalent feature                        | Catalogued only; AI chat requires a product/API contract.                                               |
| [Misc & Helper](https://www.figma.com/design/VbhFFT3ziySCy7I3P06TVm/?node-id=205-18672)           | Native shell, sheets, media                  | Keep Capacitor safe areas, keyboard and native behavior; source inventory only.                         |
| [Cards & Lists 1](https://www.figma.com/design/VbhFFT3ziySCy7I3P06TVm/?node-id=205-19545)         | Coach/club discovery, recommendations        | Existing API-backed cards use the 32px feature radius; source coach overview inspected.                 |
| [Cards & Lists 2](https://www.figma.com/design/VbhFFT3ziySCy7I3P06TVm/?node-id=205-21301)         | Dashboards, profile, settings, notifications | Metric tones, settings rows and notification layout integrated.                                         |
| [Alerts & Notifications](https://www.figma.com/design/VbhFFT3ziySCy7I3P06TVm/?node-id=762-135964) | Request failures, toasts                     | Existing error/loading/success logic inherits semantic colors; individual variants not fully inspected. |
| [Dropdowns](https://www.figma.com/design/VbhFFT3ziySCy7I3P06TVm/?node-id=762-136649)              | Filters, profile forms                       | Keep HeroUI interaction and accessibility; semantic colors inherited.                                   |
| [Loaders](https://www.figma.com/design/VbhFFT3ziySCy7I3P06TVm/?node-id=762-137172)                | Discovery and route loading                  | Existing skeletons inherit neutral surfaces; not replaced with unrelated demo loaders.                  |
| [Inputs 2](https://www.figma.com/design/VbhFFT3ziySCy7I3P06TVm/?node-id=760-132567)               | OTP, password, forms                         | Theme adaptation through existing HeroUI inputs; individual variants not fully inspected.               |
| [Color Palette](https://www.figma.com/design/VbhFFT3ziySCy7I3P06TVm/?node-id=205-15864)           | Application theme                            | 71 source colors exported; semantic light/dark adapter applied.                                         |
| [Navigations](https://www.figma.com/design/VbhFFT3ziySCy7I3P06TVm/?node-id=205-18013)             | Discovery and role headers                   | Reusable SectionHeading and 44px back/filter targets; existing routes retained.                         |
| [Profile Pics & Avatars](https://www.figma.com/design/VbhFFT3ziySCy7I3P06TVm/?node-id=205-18344)  | Profiles, coach cards                        | Existing avatar upload and cropping retained; semantic theme inherited.                                 |
| [Progress & Indicators 2](https://www.figma.com/design/VbhFFT3ziySCy7I3P06TVm/?node-id=763-39112) | Activity metrics                             | Existing RingChart kept with real completion data; remaining source variants catalogued.                |
| [File Upload](https://www.figma.com/design/VbhFFT3ziySCy7I3P06TVm/?node-id=1118-11982)            | Profile photo and uploader                   | Existing upload persistence and validation retained; individual source variants not ported.             |
| [Accordion](https://www.figma.com/design/VbhFFT3ziySCy7I3P06TVm/?node-id=1121-13030)              | Support and expandable sections              | Existing behavior retained; source inventory only.                                                      |
| [Tooltips](https://www.figma.com/design/VbhFFT3ziySCy7I3P06TVm/?node-id=770-48453)                | Supporting actions                           | Keep existing accessible primitives; source inventory only.                                             |
| [Tabs](https://www.figma.com/design/VbhFFT3ziySCy7I3P06TVm/?node-id=205-20764)                    | Reservation and discovery filters            | Existing state/routing retained; semantic theme inherited.                                              |
| [Progress & Indicators 1](https://www.figma.com/design/VbhFFT3ziySCy7I3P06TVm/?node-id=205-20515) | Athlete/coach analytics                      | Existing data-driven charts retained; categorical metric colors integrated.                             |
| [Tags & Chips](https://www.figma.com/design/VbhFFT3ziySCy7I3P06TVm/?node-id=765-40129)            | Class status, sports, filters                | Existing HeroUI chips inherit accessible semantic colors.                                               |
| [Checkboxes & Radios](https://www.figma.com/design/VbhFFT3ziySCy7I3P06TVm/?node-id=766-44542)     | Settings and booking choices                 | Existing controls retained; semantic theme inherited.                                                   |
| [Effects](https://www.figma.com/design/VbhFFT3ziySCy7I3P06TVm/?node-id=767-44795)                 | Cards and fields                             | Extracted shadow/blur references; soft card shadow and focus treatment adapted.                         |
| [Tables](https://www.figma.com/design/VbhFFT3ziySCy7I3P06TVm/?node-id=769-45615)                  | Coach reporting                              | Existing analytics maintained; source table variants catalogued.                                        |
| [Grids & Spacing](https://www.figma.com/design/VbhFFT3ziySCy7I3P06TVm/?node-id=252-32469)         | Application layout                           | 16px page gutter, 32px dashboard section rhythm, existing responsive max-width.                         |
| [Buttons 1](https://www.figma.com/design/VbhFFT3ziySCy7I3P06TVm/?node-id=760-132459)              | Application actions                          | 56px default, 64px large, 44px small touch target; existing HeroUI button/link semantics.               |
| [Buttons 2](https://www.figma.com/design/VbhFFT3ziySCy7I3P06TVm/?node-id=205-17666)               | Icon and secondary actions                   | Header icon targets adapted; other variants inherit theme.                                              |
| [Logo](https://www.figma.com/design/VbhFFT3ziySCy7I3P06TVm/?node-id=230-35766)                    | Brand identity                               | Club4Me/Gym4Me logo retained; Sandow marketing logo is not the application brand.                       |
| [Badges & Achievements](https://www.figma.com/design/VbhFFT3ziySCy7I3P06TVm/?node-id=1018-160462) | No achievement engine                        | Catalogued only; no fabricated scores, streaks or rewards.                                              |
| [Pagination](https://www.figma.com/design/VbhFFT3ziySCy7I3P06TVm/?node-id=1004-164235)            | API lists                                    | Existing list pagination preserved; individual source variants not ported.                              |
| [Breadcrumb](https://www.figma.com/design/VbhFFT3ziySCy7I3P06TVm/?node-id=1104-41937)             | Nested discovery routes                      | Existing mobile back navigation retained; source inventory only.                                        |

## Code structure and sync

- `packages/theme/src/sandow-palette.css`: generated, exact palette values.
- `packages/theme/src/sandow.css`: reviewed semantic aliases and component surface rules, imported only by the application.
- `apps/application/app/globals.css`: imports the adapter after the baseline theme; both Next.js and Capacitor import this same stylesheet.
- `packages/ui/src/section-heading.tsx`: common heading, supporting copy, optional icon and action; used in discovery, athlete overview/quick actions and settings.
- `packages/ui/src/settings-row.tsx`: layout shared by the notification preference controls.
- `packages/ui/src/dashboard-metric-card.tsx`: four categorical tones; titles reflow and the chart keeps an 80px visual area.
- Existing club/coach cards consume the feature-radius token with a fallback, so other applications retain their previous radius.
- Notification read mutations, settings preference mutations, reservation navigation, coach analytics, uploads and discovery API hooks remain the data owners.

Run `npm run design:sync` after reviewing updates to the palette snapshot. Run `npm run design:check` to detect generated CSS drift. This is a deterministic local snapshot sync, **not a live Figma subscription**. Do not overwrite semantic adaptations when refreshing primitives.

To refresh from Figma: retrieve metadata for page 37:445, fetch design context for changed component nodes, compare source styles and screenshots, update the extraction JSON and inventory, regenerate the palette, and review feature mappings. Continue component detail inspection when Figma access is available. Do not treat structural metadata as sufficient to port an uninspected component.

## Validation

`apps/application/e2e/sandow-design-system.spec.ts` checks light/dark dashboard contrast and clipping, 375px/820px layouts, working discovery actions and preference updates, and a 320px Persian notification's read/navigation behavior. All **5 tests passed** against the production build; each theme/viewport runs in an isolated browser context. All **4 coach analytics tests passed**, including responsive charts, date ranges, empty states and retry behavior. Chart class overrides now merge with Tailwind precedence, allowing the metric's 80px area to override the generic chart minimum; heatmap rows share the available height.

Production build, application TypeScript, targeted ESLint and the 71-token drift check passed. Login, account deletion and profile editing also passed during broader regression testing. The full booking journey reached payment and notification successfully but failed at the reservation cancellation swipe: the test opened reservation details instead of exposing the cancel action. That broader regression remains unresolved and is not counted as passing. Its API review fixture was corrected to include the response's required review totals.

Browser checks use mocked API responses; native-device testing and a complete accessibility audit were not performed. Previews: [light dashboard](./previews/athlete-light-375.png), [dark dashboard](./previews/athlete-dark-820.png), [dark settings](./previews/settings-dark-375.png), [320px notification](./previews/notification-320.png).

## Class detail example and brand preservation

The original Club4Me green accent is inherited directly from `heroui.css`; the Sandow adapter never overrides brand colors. `/discovery/classes/[classId]` uses a dedicated `ClassDetailLayout` with a 32px hero, live capacity indicator, 24px information cards, course dates, venue, prerequisites and a fixed green registration action. Existing enrollment, cancellation, payment, gallery and review hooks/routes remain in use. Demo screenshots use explicitly mocked class data and the existing local gym photograph.

Class validation: both light/dark tests passed at 375px and 820px, verifying the exact original brand token, capacity display, layout, enrollment and mock payment confirmation. Production build, TypeScript and targeted ESLint passed. [Dark mobile demo](./previews/class-dark-375.png) · [Light mobile demo](./previews/class-light-375.png) · [Wide demo](./previews/class-dark-820.png) · [Lower sections](./previews/class-details-dark-375.png).

## Additional application pages — 2026-09-07

- `/discovery/classes`: image-led `ClassBrowseCard` displays real prices, remaining capacity and course start dates. Both catalog and business-class queries, search, pagination, loading/error/empty states and route destinations remain connected.
- `/discovery/clubs/[clubId]`: rounded hero, three compact statistics, introduction before equipment, consistent surface spacing and an opaque booking bar. Existing gallery gestures, favorites, facility sheets, location, share, report and booking navigation remain available. Single-image galleries no longer repeat an isolated thumbnail.
- `/athlete/reservations`: green selected date, a unified calendar surface and reservation cards with times inside the card. A visible cancellation action supplements the existing swipe actions and uses the existing confirmation/reason/refund flow.

`e2e/design-pages.spec.ts` passed in light and dark themes at 375px and 820px. It verifies search, the club-to-slot route and cancellation through the mocked refund response. The production build (including TypeScript), standalone type check and targeted ESLint passed. No native-device validation was performed.

[Side-by-side previews with a theme toggle](./previews/more-pages.html) display captured app screens using sample data; this gallery is a visual preview, not a live booking service. [Overview image](./previews/more-pages-overview.png).


## Coach, favorites and profile — 2026-09-07

- Coach detail uses a rounded image, identity surface, compact facts and a fixed green session action. Existing coach queries, gallery, reviews and booking flow remain connected.
- Favorites groups saved items by category with counts, thumbnail cards and separate removal actions. Existing per-item queries, retry states and offline favorite mutations remain in use.
- Profile has a compact cover, account-role badge, actual avatar or initials, completion progress and three activity shortcuts. Its hero cannot collapse inside the flex layout.

`e2e/account-design.spec.ts` passed in light and dark themes at 375px and 820px. Checks cover layout overflow, visible profile heading, category filtering, removal, coach slot selection through reservation review, and profile-edit navigation. Production build with TypeScript and targeted ESLint passed. The final build ran in an isolated temporary copy to avoid competing writes to `.next`. An existing test regex was rewritten equivalently without the ES2018 dotAll flag for the app’s ES2017 target.

[Three-page preview with light/dark toggle](./previews/account-pages.html) · [Overview](./previews/account-pages-overview.png). Screenshots are from the running app with mocked sample data; this gallery is a visual demo. Original brand accent values remain unchanged.

## Discovery image heroes and progressive blur

The club-detail photo treatment now extends to coach, class and article details, plus the coach, class and magazine browse pages. `DiscoveryImageHero` provides a rounded, content-sized photographic header with white overlay text and the original green badges. Existing club and coach gallery containers use its shared `DiscoveryHeroScrim`, preserving their gesture handlers and controls. Other page types retain their existing headers.

The scrim combines opposing vertical gradients with four masked backdrop-blur layers (2, 4, 8 and 16px) at each edge. Masks increase softness toward the edges while preserving the image centre. Decorative layers ignore pointer input; static gradients preserve text contrast when backdrop filters are unsupported or reduced transparency is requested. No blur animation runs during scrolling. Browse images reuse local application assets; detail images continue to come from their API records.

Validation: production build and TypeScript passed in the isolated preview. Targeted ESLint passed. Seven browser tests passed across the coach/profile, class, discovery-hero and club-hero suites: light/dark 375px/820px layouts, gradient masks and blur levels, article navigation, coach booking review, class enrollment/payment, favorite removal and club-to-slot navigation. Browser data is mocked; native GPU performance has not been measured.

[Six-page light/dark gallery](./previews/heroes/index.html) · [Overview](./previews/heroes/overview.png).

## Shared secondary headers and location discovery

Redesigned detail pages use `SecondaryHeader`: the former `DiscoveryPageHeader` delegates to it, and club/article/profile screens now use it directly. Club and article save controls occupy its action slot. Photo-level back buttons were removed where they would duplicate navigation; the article keeps its deterministic back destination. Existing reservations and favorites already use this header.

Province, city and club-list screens adopt `DiscoveryImageHero` with the existing opposing gradients, masked blur layers and original green accent. City district lists and province city cards retain their real resource queries, pagination and destinations. The club-list hero also applies to region/district/type lists that reuse this screen without their own introduction.

[Province, city and clubs preview](./previews/locations/index.html). Demo images use mock API records and existing local photographs.

Validation for this update: isolated production build including TypeScript, targeted ESLint and whitespace checks passed. All nine browser tests passed, covering light/dark mobile/tablet layouts, province-to-city and city-to-club navigation, shared-header presence, profile editing, coach booking review, class enrollment/payment, article return navigation and club booking navigation. The older account and hero preview galleries were refreshed with the new headers. Native-device testing was not performed.

## Main application pages

`AppPageIntro` extends the same photographic/gradient/blur language to athlete home, coach home, settings, reservations, notifications, saved items, memberships, benefits, support and enrolled classes. Utility pages use a compact 16rem minimum-height hero so controls remain close to the header. Home pages keep the larger discovery-size hero. `SecondaryHeader` continues to own page navigation.

Profile places the existing avatar, account identity, edit and theme controls over the cover with `DiscoveryHeroScrim`. Actual profile data, completion, preferences, reservation actions, wallet/referral actions, support form and memberships remain owned by their existing hooks and sections. Reusable form controls continue to inherit the established theme. Original green accent tokens are unchanged.

[Main-page gallery](./previews/main/index.html) presents eleven screens with light/dark switching. Images use sample API data and local photographs; they are previews of the running application.

Validation: isolated production build with TypeScript and targeted ESLint passed. All nine tests in `main-pages-design`, `account-design` and `sandow-design-system` passed: 375px/820px light/dark pages, header and blur presence, overflow, dashboard actions, preference updates, notification read/navigation, profile editing, favorite removal, support-form opening and membership history. Gallery image decoding and both theme choices were verified for all 22 mobile screenshots. Native-device blur performance was not measured.


## Remaining forms, utility screens and settings verification

Profile editing/image upload, saved locations and location forms, coach availability/class/service/professional forms, class management, reservation details, review lists/forms and invitations now share the photographic introduction and secondary header. Search, maps and galleries use the secondary header while retaining their functional canvas. Public business-class detail uses a photographic hero; `/articles` and `/coaches` reuse the real discovery screens. Authentication and booking review/receipt navigation use the shared header. See [route coverage](./page-coverage.md) and [ten-page light/dark demo](./previews/remaining/index.html).

Settings are connected to authenticated API endpoints. A real temporary MongoDB test exposed and now guards the ObjectId/string mismatch in preference retrieval. Browser reload tests also exposed a stale offline snapshot; the preferences query now revalidates on mount. Device push registration remains Android-only, which the settings copy explicitly states. These checks do not modify production accounts or send real notifications.

Validation for this pass: final isolated production build/TypeScript, targeted app ESLint, backend preference formatting and 71-token consistency checks passed. Nineteen distinct browser cases passed, including settings after reload and scheduling/service saves, alongside two real MongoDB integration cases. Preview screenshots cover ten screens at 375px/820px in both themes; all twenty mobile gallery images decoded successfully.

## Authentication and role continuation

Nine authentication/role screens and states now use `AuthPageIntro`: password login, OTP entry/confirmation, password recovery/confirmation, password creation, role selection and coach/owner role requests. It reuses the compact photographic hero and the same gradient/blur scrim. Form surfaces and role cards use the shared rounded treatment; all brand tokens remain unchanged. When the keyboard opens, the introduction switches to text while preserving the form instance and its values. OTP fieldsets explicitly fit the new card width to avoid clipping cells on narrow screens.

[Authentication and roles demo](./previews/auth/index.html) · [Route coverage](./page-coverage.md).

Validation: final isolated production build/TypeScript, targeted ESLint, formatting and token checks passed. Seven distinct browser cases passed, including existing login/deep-link/password-setup navigation plus responsive light/dark pages, OTP bounds/typing and simulated keyboard collapse. All eighteen mobile gallery images decoded in both theme selections. Native-device authentication was not exercised.

## Standalone workflow pages

Nine routes now separate role applications/tracking, athlete and coach ticket creation/threads, coach support entry and membership detail/usage. The role chooser no longer mounts an application form on its own URL. Submission and back navigation use explicit destinations, protected role links survive login, and pending applications route to tracking. See [the Persian UX gap inventory](./ux-page-gaps.md) and [preview gallery](./previews/flows/index.html).

Final build/TypeScript, targeted ESLint and token checks passed; nine distinct browser cases and four routing tests passed. Browser cases use fixtures. The route-transition resolver now respects reduced-motion preferences, avoiding overlapping outgoing controls in this mode. Remaining product gaps (coach package/monthly purchase, coach/class review submission and atomic booking rescheduling) are documented separately from missing pages.

## تکمیل یکدستی و اولویت موبایل — ۲۰۲۶/۰۹/۰۷

- تصمیم محصول: اپلیکیشن و پنل بیزینس باید موبایل‌فرست باشند. فرم‌ها از تک‌ستونه آغاز می‌شوند؛ کنترل‌های اصلی حداقل ۴۴ پیکسل هدف لمس دارند، ناوبری افقی فقط در نوار محدود خودش پیمایش می‌شود و کل صفحه نباید اسکرول افقی داشته باشد. رنگ اصلی برند حفظ می‌شود.
- این مرحله در `apps/application` اجرا شد؛ این یادداشت به معنی تکمیل بازطراحی پنل بیزینس نیست.
- رزروهای مربی پنج نمای مستقل در همان مسیر دارد: رزروها، جلسات، ثبت‌نام‌ها، حضور‌وغیاب و خدمات. فرم‌ها هنگام تعویض نما mounted می‌مانند تا اطلاعات واردشده حفظ شوند.
- فرم کلاس، خدمت و پروفایل حرفه‌ای دارای پیمایش بخش‌ها، عنوان و توضیح هر بخش، کنترل‌های مشترک و ستون‌بندی از موبایل هستند. همه فیلدها در DOM باقی می‌مانند تا اعتبارسنجی فرم حفظ شود.
- خوش‌آمدگویی، معرفی و ورودی حساب از هدر ثانویه و سطوح گرد استفاده می‌کنند؛ تصاویر خوش‌آمدگویی دارای گرادیانت و بلور پیشرونده در دو لبه هستند.
- مرور، نتیجه، رسید و عملیات رزرو از معرفی وضعیت مشترک استفاده می‌کنند. منطق پرداخت، لغو و APIها تغییر نکرده است.
- صفحات خطا و ۴۰۴ هماهنگ اضافه شدند؛ اسکلت هدر، هیرو و فرم ورود با ساختار جدید تطبیق داده شد.

اعتبارسنجی این مرحله: build تولیدی و TypeScript موفق؛ ESLint فایل‌های اصلی تغییرکرده موفق؛ تست مرورگر دو تم برای ۸ صفحه در عرض‌های ۳۷۵ و ۸۲۰ شامل کنترل overflow، تعویض نمای مدیریت و حفظ مقدار فرم موفق. تست جریان کشف تا رزرو، پرداخت آزمایشی، اعلان، لغو و بازپرداخت نیز موفق بود. پیش‌نمایش تصاویر واقعی با API آزمایشی: `docs/design/previews/consistency/index.html`.

## پوشش اپلیکیشن و پنل بیزینس — ۲۰۲۶/۰۹/۰۷

فهرست مسیرها از فایل‌های واقعی `app/**/page.tsx` استخراج شده است: ۹۱ مسیر اپلیکیشن و ۲۵ مسیر بیزینس، شامل مسیرهای پارامتری و انتقالی. منبع: `docs/design/route-inventory.json`.

### اجزای مشترک بیزینس

- `BusinessPageIntro`: هیروی تصویری با گرادیانت و ماسک بلور دوطرفه برای صفحات مرور؛ فرم‌ها و ابزارها هدر فشرده دارند.
- هدر ثانویهٔ پنل: عنوان مسیر، برگشت در مسیرهای داخلی، انتخاب تم و تنظیمات. منوی بخش‌ها جستجوی واقعی دارد؛ جستجو و اعلان نمایشیِ بدون عملکرد حذف شدند.
- ناوبری موبایل: داشبورد، باشگاه‌ها، کلاس‌ها، پرداخت‌ها و منوی بیشتر؛ ریل دسکتاپ در موبایل پنهان است. safe area و فضای پایین محتوا رعایت می‌شود.
- `DataTable`: زیر ۷۶۸ پیکسل، داده و عملیات هر ردیف در کارت دارای برچسب ارائه می‌شود؛ بالاتر از آن جدول. فقط نمای فعال رندر می‌شود. مرتب‌سازی و صفحه‌بندی بین این دو مشترک‌اند.
- فرم‌های پنل: حداقل ارتفاع کنترل ۴۴ پیکسل، متن ورودی ۱۶ پیکسل، پس‌زمینه و کادر قابل تشخیص در دو تم، چیدمان پایهٔ تک‌ستونه و فوکوس واضح.
- ورود، تنظیمات، فضای پرسنل، ۴۰۴ و خطای عمومی نیز از سطوح و مقیاس مشترک استفاده می‌کنند.

### محدودهٔ اعتبارسنجی

بررسی مسیرها با API آزمایشی انجام شده است. داده‌های عملیاتی نمونه برای پنل و جریان‌های اصلی اپ استفاده شده‌اند. برخی مسیرهای جزئیات اپ با شناسهٔ ناموجود، صفحهٔ عدم دسترسی را آزمایش می‌کنند؛ این بررسی جایگزین آزمایش تمام داده‌ها و مجوزهای سرور واقعی نیست. گالری‌های قبلی نمونه‌های دارای دادهٔ جزئیات باشگاه، کلاس و مربی را حفظ می‌کنند.

نتیجهٔ نهایی: همهٔ بررسی‌های مسیر اپ در دو تم پس از اصلاح و بازاجرای موارد مرتبط موفق شدند؛ تست‌های بیزینس شامل کارت موبایل، منوی جستجو، عضویت، زمین و مجوزهای پرسنل نیز موفق‌اند. build تولیدی هر دو محصول، TypeScript و lint فایل‌های اصلی تغییرکرده موفق بود. نتایج ترکیب‌شده در `docs/design/route-verification.json` و پیش‌نمایش ۱۱۷ مسیر/حالت در `docs/design/previews/all-pages/index.html` ثبت شده‌اند (۹۱ مسیر اپ، ۲۵ مسیر پنل و ۴۰۴ پنل).
