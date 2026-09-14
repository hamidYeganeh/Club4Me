import { PRIVACY_POLICY_VERSION } from "../auth/privacy.service";
import { EVENTS } from "./events";
import { Injectable } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection, Types } from "mongoose";
import { AppConfigService } from "../../config/app-config.service";
import { AppError } from "../../common/errors/app.exception";
import { ClubAccessService } from "../clubs/club-access.service";
import {
  analyticsPeriod,
  buildBehavior,
  DAY,
  metric,
  percent,
  AnalyticsEvent,
} from "./analytics-math";

type Row = {
  key: string;
  label: string;
  value: number;
  previous: number;
  changePercent: number | null;
  unit: string;
};
@Injectable()
export class AnalyticsReportService {
  constructor(
    @InjectConnection() private readonly db: Connection,
    private readonly config: AppConfigService,
    private readonly access: ClubAccessService,
  ) {}
  async business(userId: string, clubId: string, days?: string, end?: string) {
    await this.access.assert(userId, clubId, "reports.read");
    const permissions = await this.access.permissions(userId, clubId);
    return this.report(
      days,
      end,
      clubId,
      permissions.includes("payments.read"),
    );
  }
  async report(
    daysInput?: string,
    endInput?: string,
    clubId?: string,
    includeFinance = true,
  ) {
    let range: ReturnType<typeof analyticsPeriod>;
    try {
      range = analyticsPeriod(daysInput, endInput);
    } catch {
      throw new AppError(
        400,
        "INVALID_ANALYTICS_DATE",
        "تاریخ پایان باید معتبر و در ۹۰ روز اخیر باشد.",
      );
    }
    const { start, end, previousStart, days } = range;
    const club = clubId ? { clubId: new Types.ObjectId(clubId) } : {};
    const telemetryScope = {
      environment: this.config.env.NODE_ENV,
      kind: "track",
      ...(clubId ? { "properties.club_id": clubId } : {}),
    };
    const events = (await this.db
      .collection("product_telemetry")
      .find(
        {
          ...telemetryScope,
          occurredAt: { $gte: new Date(end.getTime() - 180 * DAY), $lt: end },
          $or: [
            {
              event: {
                $nin: [
                  EVENTS.RESERVATION_CREATED,
                  EVENTS.RESERVATION_CANCELLED,
                  EVENTS.PAYMENT_SUCCEEDED,
                  EVENTS.PAYMENT_STARTED,
                  EVENTS.PAYMENT_FAILED,
                ],
              },
            },
            { source: "server" },
          ],
        },
        {
          projection: {
            actorId: 1,
            anonymousHash: 1,
            event: 1,
            occurredAt: 1,
            properties: 1,
            source: 1,
            appVersion: 1,
            platform: 1,
          },
        },
      )
      .toArray()) as unknown as AnalyticsEvent[];
    // Link only unambiguous install IDs, scoped to this report; shared devices remain separate.
    const anonymousHashes = [
      ...new Set(
        events
          .map((e) => e.anonymousHash)
          .filter((v): v is string => Boolean(v)),
      ),
    ];
    const links = anonymousHashes.length
      ? await this.db
          .collection("product_telemetry")
          .aggregate([
            {
              $match: {
                environment: this.config.env.NODE_ENV,
                kind: "identify",
                anonymousHash: { $in: anonymousHashes },
                actorId: { $ne: null },
              },
            },
            {
              $group: {
                _id: "$anonymousHash",
                actors: { $addToSet: "$actorId" },
              },
            },
          ])
          .toArray()
      : [];
    const aliases = new Map(
      links
        .filter((l) => l.actors.length === 1)
        .map((l) => [l._id, l.actors[0]]),
    );
    for (const event of events)
      if (!event.actorId && event.anonymousHash)
        event.actorId = aliases.get(event.anonymousHash);
    const behavior = buildBehavior(events, start, end),
      previousBehavior = buildBehavior(events, previousStart, start);
    const scoped = (from: Date, to: Date) => ({
      ...club,
      createdAt: { $gte: from, $lt: to },
    });
    const aggregate = async (collection: string, pipeline: object[]) =>
      this.db
        .collection(collection)
        .aggregate(pipeline, { maxTimeMS: 15000 })
        .toArray();
    const periodStats = async (from: Date, to: Date) => {
      const [reservationRows, users, paid, ledger] = await Promise.all([
        aggregate("session_reservations", [
          { $match: scoped(from, to) },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              confirmed: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        {
                          $in: [
                            "$status",
                            ["reserved", "completed", "no_show"],
                          ],
                        },
                        { $in: ["$paymentStatus", ["paid", "not_required"]] },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
              cancelled: {
                $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
              },
              noShow: {
                $sum: { $cond: [{ $eq: ["$status", "no_show"] }, 1, 0] },
              },
            },
          },
        ]),
        clubId
          ? this.db.collection("club_students").countDocuments(scoped(from, to))
          : this.db.collection("users").countDocuments({
              createdAt: { $gte: from, $lt: to },
              roles: { $nin: ["admin", "system"] },
            }),
        includeFinance
          ? aggregate("payment_intents", [
              {
                $match: {
                  ...club,
                  paidAt: { $gte: from, $lt: to },
                  status: { $in: ["paid", "partially_refunded", "refunded"] },
                },
              },
              {
                $group: {
                  _id: null,
                  paid: {
                    $sum: {
                      $add: ["$amount", { $ifNull: ["$walletAmount", 0] }],
                    },
                  },
                  refunds: {
                    $sum: {
                      $add: [
                        { $ifNull: ["$refundedGatewayAmount", 0] },
                        { $ifNull: ["$refundedWalletAmount", 0] },
                      ],
                    },
                  },
                  count: { $sum: 1 },
                  customers: { $addToSet: "$userId" },
                },
              },
            ])
          : [],
        includeFinance
          ? aggregate("ledger_entries", [
              {
                $match: {
                  createdAt: { $gte: from, $lt: to },
                  account: clubId ? "provider_payable" : "platform_revenue",
                  ...(clubId
                    ? {
                        ownerId: new Types.ObjectId(clubId),
                        sourceType: { $in: ["payment", "refund"] },
                      }
                    : {}),
                },
              },
              {
                $group: {
                  _id: null,
                  net: {
                    $sum: {
                      $cond: [
                        { $eq: ["$direction", "credit"] },
                        "$amount",
                        { $multiply: ["$amount", -1] },
                      ],
                    },
                  },
                },
              },
            ])
          : [],
      ]);
      return {
        reservations: reservationRows[0]?.total ?? 0,
        confirmed: reservationRows[0]?.confirmed ?? 0,
        cancelled: reservationRows[0]?.cancelled ?? 0,
        noShow: reservationRows[0]?.noShow ?? 0,
        newUsers: users,
        received: paid[0]?.paid ?? 0,
        refunded: paid[0]?.refunds ?? 0,
        customers: paid[0]?.customers?.length ?? 0,
        average: paid[0]?.count ? Math.round(paid[0].paid / paid[0].count) : 0,
        revenue: ledger[0]?.net ?? 0,
      };
    };
    const [
      current,
      previous,
      daily,
      reservationCustomers,
      capacity,
      classes,
      reviews,
      expiring,
      delivery,
    ] = await Promise.all([
      periodStats(start, end),
      periodStats(previousStart, start),
      aggregate("session_reservations", [
        { $match: scoped(start, end) },
        {
          $group: {
            _id: {
              $dateToString: {
                date: "$createdAt",
                format: "%Y-%m-%d",
                timezone: "Asia/Tehran",
              },
            },
            value: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      aggregate("session_reservations", [
        {
          $match: {
            ...club,
            createdAt: { $lt: end },
            paymentStatus: { $in: ["paid", "not_required"] },
            status: { $in: ["reserved", "completed", "no_show"] },
          },
        },
        {
          $group: {
            _id: "$userId",
            first: { $min: "$createdAt" },
            last: { $max: "$createdAt" },
            count: { $sum: { $cond: [{ $gte: ["$createdAt", start] }, 1, 0] } },
          },
        },
        { $match: { count: { $gt: 0 } } },
        {
          $group: {
            _id: null,
            new: { $sum: { $cond: [{ $gte: ["$first", start] }, 1, 0] } },
            returning: { $sum: { $cond: [{ $lt: ["$first", start] }, 1, 0] } },
            repeat: { $sum: { $cond: [{ $gte: ["$count", 2] }, 1, 0] } },
          },
        },
      ]),
      aggregate("reservable_sessions", [
        {
          $match: {
            ...club,
            startsAt: { $gte: new Date(), $lt: new Date(Date.now() + 7 * DAY) },
            status: "active",
          },
        },
        {
          $group: {
            _id: null,
            capacity: { $sum: "$capacity" },
            reserved: { $sum: "$reservedCount" },
          },
        },
      ]),
      aggregate("business_training_classes", [
        { $match: { ...club, status: "active", endDate: { $gt: new Date() } } },
        {
          $project: {
            title: 1,
            clubId: 1,
            capacity: 1,
            activeEnrollmentCount: 1,
            pendingEnrollmentCount: 1,
            branchId: 1,
          },
        },
        { $sort: { activeEnrollmentCount: -1 } },
        { $limit: 20 },
      ]),
      aggregate("club_reviews", [
        {
          $match: {
            ...club,
            status: "published",
            createdAt: { $gte: start, $lt: end },
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            rating: { $avg: "$rating" },
            unanswered: {
              $sum: {
                $cond: [
                  { $eq: [{ $ifNull: ["$ownerResponse", null] }, null] },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
      this.db.collection("user_entitlements").countDocuments({
        ...club,
        status: "active",
        endsAt: { $gte: new Date(), $lt: new Date(Date.now() + 7 * DAY) },
      }),
      clubId
        ? Promise.resolve([])
        : aggregate("product_telemetry", [
            {
              $match: {
                environment: this.config.env.NODE_ENV,
                posthogDeliveredAt: null,
                consentVersion: PRIVACY_POLICY_VERSION,
                expiresAt: { $gt: new Date() },
              },
            },
            {
              $group: {
                _id: null,
                pending: { $sum: 1 },
                retrying: {
                  $sum: { $cond: [{ $gt: ["$posthogAttempts", 0] }, 1, 0] },
                },
              },
            },
          ]),
    ]);
    const metrics: Row[] = [
      metric(
        "dailyActive",
        "فعال روزانه",
        behavior.dailyActiveUsers,
        previousBehavior.dailyActiveUsers,
        "نفر",
      ),
      metric(
        "weeklyActive",
        "فعال هفتگی",
        behavior.weeklyActiveUsers,
        previousBehavior.weeklyActiveUsers,
        "نفر",
      ),
      metric(
        "monthlyActive",
        "فعال ماهانه",
        behavior.monthlyActiveUsers,
        previousBehavior.monthlyActiveUsers,
        "نفر",
      ),
      metric(
        "activeUsers",
        "کاربر فعال در بازه",
        behavior.activeUsers,
        previousBehavior.activeUsers,
        "نفر",
      ),
      metric(
        "newUsers",
        clubId ? "شاگرد جدید" : "ثبت‌نام جدید",
        current.newUsers,
        previous.newUsers,
        "نفر",
      ),
      metric(
        "reservations",
        "رزرو ثبت‌شده",
        current.reservations,
        previous.reservations,
      ),
      metric("confirmed", "رزرو معتبر", current.confirmed, previous.confirmed),
      metric("views", "بازدید صفحه", behavior.views, previousBehavior.views),
      metric(
        "cancellations",
        "رزرو لغوشده",
        current.cancelled,
        previous.cancelled,
      ),
    ];
    if (includeFinance)
      metrics.push(
        metric(
          "received",
          "مبلغ خریدهای پرداخت‌شده",
          current.received,
          previous.received,
          "ریال",
        ),
        metric(
          "revenue",
          clubId ? "خالص سهم مجموعه" : "درآمد پلتفرم",
          current.revenue,
          previous.revenue,
          "ریال",
        ),
        metric(
          "refunds",
          "بازپرداخت خریدهای دوره تا امروز",
          current.refunded,
          previous.refunded,
          "ریال",
        ),
        metric(
          "payingCustomers",
          "مشتری پرداخت‌کننده",
          current.customers,
          previous.customers,
          "نفر",
        ),
      );
    const [peakHours, markets, renewals] = await Promise.all([
      aggregate("session_reservations", [
        {
          $match: {
            ...club,
            sessionStartsAt: { $gte: start, $lt: end },
            paymentStatus: { $in: ["paid", "not_required"] },
            status: { $in: ["reserved", "completed", "no_show"] },
          },
        },
        {
          $group: {
            _id: {
              day: {
                $dayOfWeek: {
                  date: "$sessionStartsAt",
                  timezone: "Asia/Tehran",
                },
              },
              hour: {
                $hour: { date: "$sessionStartsAt", timezone: "Asia/Tehran" },
              },
            },
            count: { $sum: "$participantCount" },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 14 },
      ]),
      clubId
        ? Promise.resolve([])
        : aggregate("session_reservations", [
            { $match: scoped(start, end) },
            { $group: { _id: "$clubId", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 15 },
            {
              $lookup: {
                from: "clubs",
                localField: "_id",
                foreignField: "_id",
                as: "club",
              },
            },
            { $unwind: "$club" },
            {
              $project: { count: 1, name: "$club.name", city: "$club.cityId" },
            },
          ]),
      this.db.collection("user_entitlements").countDocuments({
        ...club,
        createdAt: { $gte: start, $lt: end },
        renewedFromId: { $ne: null },
      }),
    ]);
    const requests = events.filter(
      (e) => e.event === EVENTS.REQUEST_COMPLETED && e.occurredAt >= start,
    );
    const health = [
      ...requests.reduce((map, e) => {
        const key = `${String(e.properties?.category)} / ${e.appVersion ?? "unknown"}`;
        const group = map.get(key) ?? {
          key,
          count: 0,
          failed: 0,
          durations: [] as number[],
        };
        group.count++;
        if (e.properties?.status === 0 || Number(e.properties?.status) >= 500)
          group.failed++;
        group.durations.push(Number(e.properties?.duration_ms) || 0);
        map.set(key, group);
        return map;
      }, new Map<string, { key: string; count: number; failed: number; durations: number[] }>()),
    ].map(([, g]) => ({
      key: g.key,
      count: g.count,
      failed: g.failed,
      errorRate: percent(g.failed, g.count),
      p95Ms:
        g.durations.sort((a, b) => a - b)[
          Math.max(0, Math.ceil(g.durations.length * 0.95) - 1)
        ] ?? 0,
    }));
    const actions: Array<{ key: string; label: string; href: string }> = [];
    if (expiring)
      actions.push({
        key: "renewals",
        label: `${expiring.toLocaleString("fa-IR")} عضویت در هفت روز آینده منقضی می‌شود.`,
        href: clubId ? "/memberships" : "/finance",
      });
    if (reviews[0]?.unanswered)
      actions.push({
        key: "reviews",
        label: `${reviews[0].unanswered.toLocaleString("fa-IR")} نظر منتشرشده بدون پاسخ است.`,
        href: clubId ? "/reviews" : "/reports",
      });
    if (!clubId && behavior.emptySearches)
      actions.push({
        key: "search",
        label: `${behavior.emptySearches.toLocaleString("fa-IR")} جست‌وجو بدون نتیجه ثبت شده است.`,
        href: "/discovery",
      });
    if (
      current.reservations >= 10 &&
      current.cancelled / current.reservations > 0.2
    )
      actions.push({
        key: "cancel",
        label:
          "بیش از ۲۰٪ رزروهای این دوره لغو شده‌اند؛ دلایل لغو را بررسی کنید.",
        href: clubId ? `/clubs/${clubId}/reservations` : "/reports",
      });
    const bookings = reservationCustomers[0];
    return {
      days,
      start: start.toISOString(),
      end: end.toISOString(),
      generatedAt: new Date().toISOString(),
      clubId: clubId ?? null,
      metrics,
      ...behavior,
      operations: {
        newCustomers: bookings?.new ?? 0,
        returningCustomers: bookings?.returning ?? 0,
        repeatCustomers: bookings?.repeat ?? 0,
        repeatRate: percent(
          bookings?.repeat ?? 0,
          (bookings?.new ?? 0) + (bookings?.returning ?? 0),
        ),
        upcomingCapacity: capacity[0]?.capacity ?? 0,
        upcomingReserved: capacity[0]?.reserved ?? 0,
        occupancyRate: percent(
          capacity[0]?.reserved ?? 0,
          capacity[0]?.capacity ?? 0,
        ),
        expiringMemberships: expiring,
        averageRating: reviews[0]?.rating ?? null,
        reviewCount: reviews[0]?.count ?? 0,
        noShows: current.noShow,
      },
      health,
      renewals,
      peakHours: peakHours.map((r) => ({
        day: r._id.day,
        hour: r._id.hour,
        count: r.count,
      })),
      markets: markets.map((r) => ({
        id: String(r._id),
        name: r.name ?? "باشگاه",
        count: r.count,
      })),
      trend: daily.map((r) => ({ label: r._id, value: r.value })),
      classes: classes.map((r) => ({
        id: String(r._id),
        clubId: String(r.clubId),
        title: r.title,
        capacity: r.capacity,
        enrolled: r.activeEnrollmentCount ?? 0,
        pending: r.pendingEnrollmentCount ?? 0,
        occupancyRate: percent(r.activeEnrollmentCount ?? 0, r.capacity),
      })),
      actions,
      integration: clubId
        ? undefined
        : {
            configured: Boolean(this.config.env.POSTHOG_PROJECT_TOKEN),
            pending: delivery[0]?.pending ?? 0,
            retrying: delivery[0]?.retrying ?? 0,
          },
      paymentMode:
        this.config.env.PAYMENT_MODE ??
        (this.config.env.NODE_ENV === "production" ? "disabled" : "simulation"),
      definitions: {
        health:
          "سلامت درخواست‌ها: خطای شبکه یا HTTP 5xx؛ صدک ۹۵ مدت درخواست‌ها از دید اپ. خطای ۴xx خطای اعتبارسنجی یا دسترسی است و خرابی سرور محسوب نمی‌شود.",
        activity:
          "فعال: هویت یکتای دارای رویداد با رضایت تحلیل؛ معادل همه کاربران اپ نیست.",
        conversion:
          "قیف رزرو سانس: مراحل به ترتیب زمانی برای یک هویت در همین بازه؛ پرداخت سایر محصولات در این قیف نیست.",
        retention:
          "بازگشت رزروکنندگان بر اساس اولین رزرو مشاهده‌شده در تاریخچه نگهداری‌شده؛ هفته‌های کامل‌نشده خط تیره دارند.",
        financial:
          "خریدها بر اساس paidAt، سهم درآمد از دفتر کل؛ مبالغ ریال و دریافت حضوری جداست. بازپرداخت خریدهای دوره تا امروز محاسبه می‌شود.",
        capacity:
          "ظرفیت سانس‌ها برای هفت روز آینده و کلاس‌ها وضعیت فعلی است؛ شامل صندلی موقت پرداخت نیز می‌شود.",
        comparison:
          "مقایسه با بازه قبلی هم‌اندازه؛ در صورت صفر بودن مبنا درصد تغییر نمایش داده نمی‌شود.",
      },
    };
  }
}
