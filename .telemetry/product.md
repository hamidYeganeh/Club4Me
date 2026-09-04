# Product: Gym4Me

**Last updated:** 2026-09-04  
**Method:** codebase scan + product direction supplied by the owner

## Product Identity

- **One-liner:** ورزشکاران باشگاه، مربی و کلاس مناسب را پیدا می‌کنند و زمان ورزشی خود را رزرو می‌کنند؛ مربیان و باشگاه‌ها نیز کلاس‌ها و رزروها را مدیریت می‌کنند.
- **Category:** marketplace / sports booking
- **Product type:** Hybrid B2C/B2B
- **Collaboration:** Multiplayer marketplace

## Business Model

- **Monetization:** Marketplace; payment processing is intentionally outside the current release scope.
- **Pricing tiers:** No subscription tiers are visible in the codebase.
- **Billing integration:** No production billing integration; mock reservation payment paths exist for demos/tests.

## Tech Stack

- **Primary language:** TypeScript (Android native bridge code in Java)
- **Framework:** Next.js/React/Capacitor clients and NestJS API
- **Database:** MongoDB through Mongoose; Redis is used by backend infrastructure
- **Background jobs:** No dedicated job queue detected
- **HTTP client patterns:** Shared fetch-based `@repo/api` client
- **Module organization:** Turborepo apps with domain-oriented NestJS and API packages

## Value Mapping

### Primary Value Action

**Reservation created** — an athlete reserves an available class, court, or coached session. If this drops to zero, the marketplace is not delivering its core value.

### Core Features (directly deliver value)

1. **Discovery and search** — athletes find clubs, coaches, classes, and nearby options.
2. **Reservation lifecycle** — athletes reserve/cancel and providers operate sessions and attendance.
3. **Supply publishing** — coaches and club owners create sessions/classes that athletes can book.

### Supporting Features (enable core actions)

1. **Authentication and roles** — OTP/login and athlete/coach/owner access control.
2. **Profiles, favorites, reviews, and locations** — improve trust, relevance, and return usage.
3. **Notifications and release controls** — keep users informed and the installed app operable.

## Entity Model

### Users

- **ID format:** MongoDB ObjectId string
- **Roles:** athlete, coach, owner, admin
- **Multi-account:** A user can have multiple roles and club memberships.

### Accounts

- **ID format:** MongoDB ObjectId string for clubs
- **Hierarchy:** Club is the commercial group; sessions and reservations belong to a club.

## Group Hierarchy

```
Club
└── Reservable session
```

| Group Type | Parent | Where Actions Happen                              |
| ---------- | ------ | ------------------------------------------------- |
| club       | none   | Provider configuration and aggregate operations   |
| session    | club   | Publishing, reservation, completion, cancellation |

**Default event level:** session  
**Admin actions at:** club or platform level

## Current State

- **Existing tracking:** None detected before this implementation
- **Documentation:** No analytics documentation existed
- **Known issues:** No event inventory, identity contract, or delivery path existed

## Integration Targets

| Destination                       | Purpose                                                              | Priority |
| --------------------------------- | -------------------------------------------------------------------- | -------- |
| Gym4Me first-party telemetry API | Privacy-preserving product analytics without a third-party token     | Primary  |
| Sentry                            | Crash and performance diagnostics, separately from product analytics | Primary  |

## Codebase Observations

- **Feature areas inferred:** auth, discovery, clubs/coaches/classes, reservations, favorites, reviews, notifications, profiles, release management, and administration
- **Entity model inferred:** users interact with clubs and reservable sessions; reservations connect users, sessions, and clubs
