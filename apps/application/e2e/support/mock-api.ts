import type { Page, Route } from "@playwright/test";

const CLUB_ID = "66d400000000000000000001";
const SESSION_ID = "66d600000000000000000001";
const RESERVATION_ID = "66d700000000000000000001";
const INTENT_ID = "66d800000000000000000001";

type SearchMode =
  "success" | "offline" | "server-error" | "permission-denied" | "timeout";

type MockUser = {
  id: string;
  phone: string;
  firstName: string;
  lastName: string;
  gender?: "female" | "male" | "other";
  genderDescription?: string;
  activityLevel?: "very-active" | "normal" | "very-lazy";
  idCard?: string;
  birthdate?: string;
  roles: string[];
  hasPassword: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MockApiState = ReturnType<typeof createMockApiState>;

export function createMockApiState(searchMode: SearchMode = "success") {
  const startsAt = new Date();
  startsAt.setHours(18, 0, 0, 0);
  const endsAt = new Date(startsAt);
  endsAt.setHours(19, 0, 0, 0);

  return {
    searchMode,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    reservation: null as ReturnType<typeof reservationFixture> | null,
    notifications: [] as Array<{
      id: string;
      type: string;
      title: string;
      body: string;
      href: string;
      readAt: string | null;
      createdAt: string;
    }>,
    accountDeleted: false,
    user: userFixture(),
  };
}

export async function installApiMock(page: Page, state: MockApiState) {
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/api\/v1/, "");
    const method = request.method();

    if (path === "/account/auth/login" && method === "POST") {
      return success(route, {
        accessToken: "e2e-access-token",
        refreshToken: "e2e-refresh-token",
        expiresIn: 900,
        user: userFixture(),
      });
    }

    if (path === "/account/me/choices" && method === "GET") {
      return success(route, profileChoicesFixture());
    }

    if (path === "/account/me" && method === "GET") {
      return success(route, state.user);
    }

    if (path === "/account/me" && method === "PATCH") {
      state.user = { ...state.user, ...(request.postDataJSON() as object) };
      return success(route, state.user);
    }

    if (path === "/account" && method === "DELETE") {
      state.accountDeleted = true;
      return success(route, { success: true });
    }

    if (path === "/notifications/preferences" && method === "GET") {
      return success(route, {
        bookingUpdates: true,
        reminders: true,
        discovery: true,
        marketing: false,
      });
    }

    if (path === "/notifications/preferences" && method === "PATCH") {
      return success(route, {
        bookingUpdates: true,
        reminders: true,
        discovery: true,
        marketing: false,
      });
    }

    if (path === "/notifications" && method === "GET") {
      return success(route, { items: state.notifications });
    }

    if (path === "/discovery/catalog/search" && method === "GET") {
      if (state.searchMode === "offline") {
        return route.abort("internetdisconnected");
      }
      if (state.searchMode === "timeout") {
        await new Promise((resolve) => setTimeout(resolve, 900));
      }
      if (state.searchMode === "server-error") {
        return failure(route, 503, "SERVICE_UNAVAILABLE", "Unavailable");
      }
      if (state.searchMode === "permission-denied") {
        return failure(route, 403, "FORBIDDEN", "Forbidden");
      }
      return success(route, { clubs: [], coaches: [], classes: [], total: 0 });
    }

    if (path === "/discovery/catalog/clubs" && method === "GET") {
      return success(route, {
        items: [catalogClubFixture()],
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
    }

    if (
      path === "/discovery/catalog/clubs/energy-plus-demo" &&
      method === "GET"
    ) {
      return success(route, catalogClubFixture());
    }

    if (path === `/public/clubs/${CLUB_ID}` && method === "GET") {
      return success(route, publicClubFixture());
    }

    if (
      path === `/public/clubs/${CLUB_ID}/reservable-sessions` &&
      method === "GET"
    ) {
      return success(route, {
        items: [sessionFixture(state.startsAt, state.endsAt)],
      });
    }

    if (path === "/benefit-purchases/mine/entitlements" && method === "GET") {
      return success(route, { items: [] });
    }

    if (path === "/reservations" && method === "POST") {
      state.reservation = reservationFixture(
        state.startsAt,
        state.endsAt,
        "reserved",
        "pending",
      );
      return success(route, state.reservation, 201);
    }

    if (path === "/reservations" && method === "GET") {
      return success(route, {
        items: state.reservation ? [state.reservation] : [],
      });
    }

    if (
      path === `/reservations/${RESERVATION_ID}/cancel` &&
      method === "PATCH"
    ) {
      state.reservation = reservationFixture(
        state.startsAt,
        state.endsAt,
        "cancelled",
        "refunded",
      );
      state.notifications.unshift({
        id: "notification-cancelled",
        type: "booking_cancelled",
        title: "رزرو لغو شد",
        body: "مبلغ رزرو بازپرداخت شد.",
        href: "/athlete/reservations",
        readAt: null,
        createdAt: new Date().toISOString(),
      });
      return success(route, state.reservation);
    }

    if (path === "/payments/intents" && method === "POST") {
      return success(route, { id: INTENT_ID, status: "pending" }, 201);
    }

    if (
      path === `/payments/intents/${INTENT_ID}/mock/decision` &&
      method === "POST"
    ) {
      if (state.reservation) {
        state.reservation = {
          ...state.reservation,
          paymentStatus: "paid",
        };
      }
      state.notifications.unshift({
        id: "notification-paid",
        type: "booking_confirmed",
        title: "رزرو شما قطعی شد",
        body: "پرداخت با موفقیت انجام شد.",
        href: "/athlete/reservations",
        readAt: null,
        createdAt: new Date().toISOString(),
      });
      return success(route, { id: INTENT_ID, status: "paid" });
    }

    if (path === "/athlete/bookings" || path === "/athlete/enrollments") {
      return success(route, { items: [] });
    }

    if (
      path === "/public/catalog/commerce/cancellation-reason" &&
      method === "GET"
    ) {
      return success(route, {
        items: [{ id: "reason-change", name: "تغییر برنامه" }],
        page: 1,
        limit: 100,
        total: 1,
      });
    }

    if (path === "/discovery/sections" && method === "GET") {
      return success(route, []);
    }

    if (path.startsWith("/discovery/catalog/") && method === "GET") {
      return success(route, {
        items: [],
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      });
    }

    if (method === "GET") {
      return success(route, { items: [] });
    }

    return success(route, { success: true });
  });
}

export async function setBrowserSession(page: Page, authenticated = false) {
  await page.addInitScript((isAuthenticated) => {
    window.localStorage.setItem("gym4me.welcome.seen", "1");
    if (isAuthenticated) {
      window.localStorage.setItem("gym4me.accessToken", "e2e-access-token");
      window.localStorage.setItem("gym4me.refreshToken", "e2e-refresh-token");
    }
  }, authenticated);
}

function userFixture(): MockUser {
  const timestamp = "2026-01-01T00:00:00.000Z";
  return {
    id: "66d100000000000000000001",
    phone: "+989120000001",
    firstName: "کاربر",
    lastName: "آزمایشی",
    roles: ["athlete"],
    hasPassword: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function profileChoicesFixture() {
  return {
    genders: [
      { value: "female", label: "زن" },
      { value: "male", label: "مرد" },
      {
        value: "other",
        label: "سایر",
        description: "هویت جنسیتی خود را بنویسید",
        requiresDescription: true,
      },
    ],
    activityLevels: [
      {
        value: "very-active",
        label: "بسیار فعال",
        description: "هر روز ورزش می‌کنم",
      },
      {
        value: "normal",
        label: "معمولی",
        description: "هفته‌ای یک یا دو بار ورزش می‌کنم",
      },
      {
        value: "very-lazy",
        label: "کم‌تحرک",
        description: "به‌ندرت ورزش می‌کنم",
      },
    ],
  };
}

function catalogClubFixture() {
  return {
    id: CLUB_ID,
    name: "باشگاه انرژی پلاس",
    slug: "energy-plus-demo",
    shortDescription: "باشگاه تست مسیر رزرو",
    logoMediaId: null,
    coverMediaId: null,
    imageUrl: null,
    address: "تهران، میدان تست",
    averageRating: 4.8,
    reviewsCount: 24,
    sportIds: [],
    tags: [],
    geo: null,
    location: { type: "Point", coordinates: [51.389, 35.6892] },
    clubTypeIds: [],
    amenityIds: [],
    equipmentIds: [],
    socialMedia: [],
    weeklyHours: [],
    operationalStatus: "active",
  };
}

function publicClubFixture() {
  const timestamp = "2026-01-01T00:00:00.000Z";
  return {
    id: CLUB_ID,
    ownerId: "66d200000000000000000001",
    name: "باشگاه انرژی پلاس",
    shortDescription: "باشگاه تست مسیر رزرو",
    slug: "energy-plus-demo",
    description: "فضای ورزشی مجهز برای آزمون مسیر اصلی محصول.",
    gallery: [],
    equipment: [],
    amenities: [],
    rules: [],
    location: {
      countryId: "ir",
      provinceId: "tehran",
      cityId: "tehran",
      address: "تهران، میدان تست",
      latitude: 35.6892,
      longitude: 51.389,
    },
    socialMedia: [],
    clubTypeIds: [],
    sportIds: [],
    tags: [],
    cancellationRules: [],
    weeklyHours: Array.from({ length: 7 }, (_, dayOfWeek) => ({
      dayOfWeek,
      periods: [{ opensAt: "08:00", closesAt: "22:00" }],
      isClosed: false,
    })),
    closures: [],
    audience: ["mixed"],
    currency: "IRR",
    taxPercent: 0,
    averageRating: 4.8,
    reviewsCount: 24,
    operationalStatus: "active",
    reviewStatus: "approved",
    visibility: "public",
    rejectionReason: null,
    publishedAt: timestamp,
    archivedAt: null,
    suspendedAt: null,
    schemaVersion: 2,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function sessionFixture(startsAt: string, endsAt: string) {
  return {
    id: SESSION_ID,
    clubId: CLUB_ID,
    courtId: "court-e2e",
    title: "سانس تست باشگاه",
    startsAt,
    endsAt,
    capacity: 10,
    reservedCount: 2,
    basePrice: 500_000,
    currency: "IRR",
    pricingUnit: "per_session",
    options: [],
    cancellationPolicy: {
      title: "بازپرداخت کامل تا شروع سانس",
      tiers: [{ hoursBefore: 0, refundPercent: 100 }],
    },
    status: "active",
  };
}

function reservationFixture(
  startsAt = new Date().toISOString(),
  endsAt = new Date().toISOString(),
  status: "reserved" | "cancelled" = "reserved",
  paymentStatus: "pending" | "paid" | "refunded" = "pending",
) {
  return {
    id: RESERVATION_ID,
    clubId: CLUB_ID,
    sessionId: SESSION_ID,
    userId: "66d100000000000000000001",
    sessionType: "court",
    sessionTitle: "سانس تست باشگاه",
    sessionStartsAt: startsAt,
    sessionEndsAt: endsAt,
    participantCount: 1,
    selectedOptions: [],
    totalPrice: 500_000,
    entitlementId: null,
    entitlementCoveredAmount: 0,
    paymentStatus,
    cancellationPolicy: {
      title: "بازپرداخت کامل تا شروع سانس",
      tiers: [{ hoursBefore: 0, refundPercent: 100 }],
    },
    refundPercent: status === "cancelled" ? 100 : null,
    refundAmount: status === "cancelled" ? 500_000 : null,
    status,
    createdAt: new Date().toISOString(),
    cancelledAt: status === "cancelled" ? new Date().toISOString() : null,
  };
}

function success(route: Route, data: unknown, status = 200) {
  return route.fulfill({
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data, meta: { version: "v1" } }),
  });
}

function failure(route: Route, status: number, code: string, message: string) {
  return route.fulfill({
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ error: { code, message } }),
  });
}
