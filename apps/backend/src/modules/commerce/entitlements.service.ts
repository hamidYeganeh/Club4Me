import { membershipWeekKey } from "./membership-week";
import { Injectable } from "@nestjs/common";
import { Atomic } from "../../infrastructure/database/atomic-operation";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { AppError } from "../../common/errors/app.exception";
import { ClubsService } from "../clubs/clubs.service";
import type {
  CreateBenefitProductDto,
  BenefitPurchaseOptionsDto,
} from "./entitlements.dto";
import {
  BenefitProduct,
  type BenefitProductDocument,
  BenefitPurchase,
  type BenefitPurchaseDocument,
  EntitlementUsage,
  type EntitlementUsageDocument,
  UserEntitlement,
  type UserEntitlementDocument,
} from "./schemas/entitlement.schema";

@Injectable()
export class EntitlementsService {
  constructor(
    @InjectModel(BenefitProduct.name)
    private products: Model<BenefitProductDocument>,
    @InjectModel(BenefitPurchase.name)
    private purchases: Model<BenefitPurchaseDocument>,
    @InjectModel(UserEntitlement.name)
    private entitlements: Model<UserEntitlementDocument>,
    @InjectModel(EntitlementUsage.name)
    private usages: Model<EntitlementUsageDocument>,
    private clubs: ClubsService,
  ) {}

  async listOwner(userId: string, clubId: string) {
    await this.clubs.get(userId, clubId, "memberships.read");
    const items = await this.products
      .find({ clubId: oid(clubId) })
      .sort({ createdAt: -1 });
    return { items: items.map(productDto) };
  }

  async createProduct(
    userId: string,
    clubId: string,
    input: CreateBenefitProductDto,
  ) {
    await this.clubs.get(userId, clubId, "memberships.write");
    return productDto(
      await this.products.create({
        ...input,
        clubId: oid(clubId),
        status: "active",
        weekCalendar: "iran_saturday",
      }),
    );
  }

  async updateStatus(
    userId: string,
    clubId: string,
    productId: string,
    status: "active" | "inactive",
  ) {
    await this.clubs.get(userId, clubId, "memberships.write");
    const item = await this.products.findOneAndUpdate(
      { _id: oid(productId), clubId: oid(clubId) },
      { $set: { status } },
      { new: true },
    );
    if (!item) throw notFound("BENEFIT_PRODUCT_NOT_FOUND");
    return productDto(item);
  }

  async listPublic(clubId: string) {
    await this.clubs.getPublic(clubId);
    const items = await this.products
      .find({ clubId: oid(clubId), status: "active" })
      .sort({ price: 1 });
    return { items: items.map(productDto) };
  }

  async createPurchase(
    userId: string,
    productId: string,
    options?: BenefitPurchaseOptionsDto,
  ) {
    const product = await this.products.findOne({
      _id: oid(productId),
      status: "active",
    });
    if (!product) throw notFound("BENEFIT_PRODUCT_NOT_FOUND");
    await this.clubs.getPublic(String(product.clubId));
    if (options?.renewedFromId) {
      const prior = await this.entitlements.findOne({
        _id: oid(options.renewedFromId),
        userId: oid(userId),
        clubId: product.clubId,
        status: { $ne: "revoked" },
      });
      if (!prior) throw notFound("ENTITLEMENT_NOT_FOUND");
    }
    const purchase = await this.purchases.create({
      productId: product._id,
      clubId: product.clubId,
      userId: oid(userId),
      amount: product.price,
      productSnapshot: product.toObject(),
      renewedFromId: options?.renewedFromId ? oid(options.renewedFromId) : null,
      startMode: options?.startMode ?? "immediate",
      status: "pending",
      entitlementId: null,
    });
    return purchaseDto(purchase);
  }

  async payablePurchase(userId: string, purchaseId: string) {
    const item = await this.purchases.findOne({
      _id: oid(purchaseId),
      userId: oid(userId),
      status: "pending",
    });
    if (!item)
      throw new AppError(
        409,
        "REFERENCE_NOT_PAYABLE",
        "Purchase is not payable",
      );
    return item;
  }

  @Atomic("purchases")
  async finalizePurchase(purchaseId: Types.ObjectId, paid: boolean) {
    if (!paid) {
      await this.purchases.updateOne(
        { _id: purchaseId, status: "pending" },
        { $set: { status: "failed" } },
      );
      return null;
    }
    const purchase = await this.purchases.findOneAndUpdate(
      { _id: purchaseId, status: "pending" },
      { $set: { status: "paid" } },
      { new: true },
    );
    if (!purchase) return this.entitlements.findOne({ purchaseId });
    const product =
      purchase.productSnapshot ??
      (await this.products.findById(purchase.productId));
    if (!product) throw notFound("BENEFIT_PRODUCT_NOT_FOUND");
    let startsAt = new Date();
    let previous: UserEntitlementDocument | null = null;
    if (purchase.renewedFromId) {
      previous = await this.entitlements.findOneAndUpdate(
        {
          _id: purchase.renewedFromId,
          userId: purchase.userId,
          clubId: purchase.clubId,
          status: { $ne: "revoked" },
        },
        { $inc: { renewalRevision: 1 } },
        { new: true },
      );
      if (!previous) throw notFound("ENTITLEMENT_NOT_FOUND");
      if (purchase.startMode === "after_expiry") {
        const last = await this.entitlements
          .findOne({ renewedFromId: previous._id, status: { $ne: "revoked" } })
          .sort({ endsAt: -1 });
        startsAt = new Date(
          Math.max(
            Date.now(),
            previous.endsAt.getTime(),
            last?.endsAt.getTime() ?? 0,
          ),
        );
      }
    }
    const endsAt = new Date(
      startsAt.getTime() + product.validityDays * 86_400_000,
    );
    const entitlement = await this.entitlements.findOneAndUpdate(
      { purchaseId: purchase._id },
      {
        $setOnInsert: {
          productId: purchase.productId,
          purchaseId: purchase._id,
          clubId: product.clubId,
          userId: purchase.userId,
          title: product.title,
          type: product.type,
          maxPauseDays: product.maxPauseDays ?? 0,
          weekCalendar: product.weekCalendar ?? "iso_utc",
          renewedFromId: purchase.renewedFromId ?? null,
          remainingSessions:
            product.type === "session_pack" ? product.sessionCount : null,
          weeklyLimit:
            product.type === "time_membership" ? product.weeklyLimit : null,
          weeklyUsed: 0,
          usageWeekKey: null,
          sessionTypes: product.sessionTypes,
          startsAt,
          endsAt,
          status: "active",
        },
      },
      { upsert: true, new: true },
    );
    if (previous) {
      previous.changes.push({
        action: "renewal",
        actorId: String(purchase.userId),
        at: new Date(),
        beforeEndsAt: previous.endsAt,
        afterEndsAt: endsAt,
        purchaseId: String(purchase._id),
      });
      await previous.save();
    }
    purchase.entitlementId = entitlement._id;
    await purchase.save();
    return entitlement;
  }

  @Atomic("purchases")
  async refundPurchase(purchaseId: Types.ObjectId) {
    const purchase = await this.purchases.findOneAndUpdate(
      { _id: purchaseId, status: "paid" },
      { $set: { status: "refunded" } },
      { new: true },
    );
    if (purchase?.renewedFromId)
      await this.entitlements.updateOne(
        { _id: purchase.renewedFromId },
        { $set: { expiryRemindedFor: null } },
      );
    if (purchase?.entitlementId) {
      await this.entitlements.updateOne(
        { _id: purchase.entitlementId },
        { $set: { status: "revoked" } },
      );
    }
  }

  @Atomic("entitlements")
  async pause(userId: string, entitlementId: string, days: number) {
    if (!Number.isInteger(days) || days < 1 || days > 90)
      throw new AppError(400, "INVALID_PAUSE_DAYS", "مدت توقف نامعتبر است.");
    const now = new Date();
    const item = await this.entitlements.findOne({
      _id: oid(entitlementId),
      userId: oid(userId),
      status: "active",
      startsAt: { $lte: now },
      endsAt: { $gt: now },
    });
    if (!item) throw notFound("ENTITLEMENT_NOT_FOUND");
    if (item.pauseUntil && item.pauseUntil > now)
      throw new AppError(
        409,
        "MEMBERSHIP_ALREADY_PAUSED",
        "عضویت در توقف است.",
      );
    const duration = days * 86_400_000;
    if (
      (item.pauseUsedMs ?? 0) + duration >
      (item.maxPauseDays ?? 0) * 86_400_000
    )
      throw new AppError(
        409,
        "MEMBERSHIP_PAUSE_LIMIT",
        "این مدت توقف در قرارداد عضویت مجاز نیست.",
      );
    const until = new Date(now.getTime() + duration);
    if (
      await this.usages.exists({
        entitlementId: item._id,
        status: { $in: ["reserved", "consumed"] },
        sessionStartsAt: { $gte: now, $lt: until },
      })
    )
      throw new AppError(
        409,
        "PAUSE_HAS_RESERVATIONS",
        "ابتدا رزروهای بازه توقف را لغو کنید.",
      );
    if (
      await this.entitlements.exists({
        renewedFromId: item._id,
        status: { $ne: "revoked" },
        startsAt: { $gt: now },
      })
    )
      throw new AppError(
        409,
        "PAUSE_HAS_RENEWAL",
        "برای این عضویت تمدید آینده ثبت شده؛ توقف نیازمند هماهنگی پشتیبانی است.",
      );
    const beforeEndsAt = item.endsAt;
    item.endsAt = new Date(item.endsAt.getTime() + duration);
    item.pauseUsedMs = (item.pauseUsedMs ?? 0) + duration;
    item.pauseStartedAt = now;
    item.pauseUntil = until;
    item.changes.push({
      action: "pause",
      actorId: userId,
      at: now,
      beforeEndsAt,
      afterEndsAt: item.endsAt,
      pauseUntil: until,
    });
    await item.save();
    return entitlementDto(item);
  }

  @Atomic("entitlements")
  async resume(userId: string, entitlementId: string) {
    const item = await this.entitlements.findOne({
      _id: oid(entitlementId),
      userId: oid(userId),
      status: "active",
    });
    if (!item) throw notFound("ENTITLEMENT_NOT_FOUND");
    const now = new Date();
    if (!item.pauseUntil || item.pauseUntil <= now) return entitlementDto(item);
    const unused = item.pauseUntil.getTime() - now.getTime();
    if (
      await this.usages.exists({
        entitlementId: item._id,
        status: { $in: ["reserved", "consumed"] },
        sessionStartsAt: { $gt: new Date(item.endsAt.getTime() - unused) },
      })
    )
      throw new AppError(
        409,
        "RESUME_HAS_LATE_RESERVATIONS",
        "بازگشت زودتر پایان اعتبار را تغییر می‌دهد؛ ابتدا رزروهای پس از تاریخ جدید را لغو کنید.",
      );
    const beforeEndsAt = item.endsAt;
    item.endsAt = new Date(item.endsAt.getTime() - unused);
    item.pauseUsedMs = Math.max(0, item.pauseUsedMs - unused);
    item.pauseUntil = now;
    item.changes.push({
      action: "resume",
      actorId: userId,
      at: now,
      beforeEndsAt,
      afterEndsAt: item.endsAt,
    });
    await item.save();
    return entitlementDto(item);
  }

  async listMine(userId: string) {
    await this.entitlements.updateMany(
      { userId: oid(userId), status: "active", endsAt: { $lte: new Date() } },
      { $set: { status: "expired" } },
    );
    const items = await this.entitlements
      .find({ userId: oid(userId) })
      .sort({ endsAt: -1 });
    return { items: items.map(entitlementDto) };
  }

  async listUsage(userId: string, entitlementId: string, page = 1, limit = 20) {
    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      page > 100_000 ||
      !Number.isSafeInteger(limit) ||
      limit < 1 ||
      limit > 100
    )
      throw new AppError(400, "INVALID_PAGINATION", "صفحه‌بندی نامعتبر است.");
    const ownerId = oid(userId);
    const id = oid(entitlementId);
    const entitlement = await this.entitlements.findOne({
      _id: id,
      userId: ownerId,
    });
    if (!entitlement) throw notFound("ENTITLEMENT_NOT_FOUND");
    const filter = { entitlementId: id, userId: ownerId };
    const [items, total] = await Promise.all([
      this.usages
        .find(filter)
        .sort({ sessionStartsAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      this.usages.countDocuments(filter),
    ]);
    return {
      items: items.map((item) => ({
        id: String(item._id),
        reservationId: String(item.reservationId),
        sessionStartsAt: item.sessionStartsAt.toISOString(),
        status: item.status,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async assertEligibleForReservation(input: {
    entitlementId: string;
    userId: string;
    clubId: Types.ObjectId;
    sessionType: "court" | "class" | "coached_session";
    sessionStartsAt: Date;
  }) {
    const item = await this.entitlements.findOne({
      _id: oid(input.entitlementId),
      userId: oid(input.userId),
      clubId: input.clubId,
      status: "active",
      $or: [
        { pauseUntil: null },
        { pauseUntil: { $lte: input.sessionStartsAt } },
      ],
      startsAt: { $lte: input.sessionStartsAt },
      endsAt: { $gte: input.sessionStartsAt },
      sessionTypes: input.sessionType,
    });
    if (
      !item ||
      (item.type === "session_pack"
        ? (item.remainingSessions ?? 0) < 1
        : weeklyUsage(
            item,
            membershipWeekKey(input.sessionStartsAt, item.weekCalendar),
          ) >= (item.weeklyLimit ?? 0))
    ) {
      throw new AppError(
        409,
        "ENTITLEMENT_NOT_ELIGIBLE",
        "این عضویت برای سانس انتخاب‌شده قابل استفاده نیست.",
      );
    }
    return item;
  }

  async reserveForReservation(input: {
    entitlementId: string;
    reservationId: Types.ObjectId;
    userId: string;
    clubId: Types.ObjectId;
    sessionType: "court" | "class" | "coached_session";
    sessionStartsAt: Date;
  }) {
    const prior = await this.usages.findOne({
      reservationId: input.reservationId,
    });
    if (prior) return prior;
    const base = {
      _id: oid(input.entitlementId),
      userId: oid(input.userId),
      clubId: input.clubId,
      status: "active",
      $or: [
        { pauseUntil: null },
        { pauseUntil: { $lte: input.sessionStartsAt } },
      ],
      startsAt: { $lte: input.sessionStartsAt },
      endsAt: { $gte: input.sessionStartsAt },
      sessionTypes: input.sessionType,
    };
    const entitlement = await this.entitlements.findById(input.entitlementId);
    if (!entitlement) throw notFound("ENTITLEMENT_NOT_FOUND");
    let reserved: UserEntitlementDocument | null;
    if (entitlement.type === "session_pack") {
      reserved = await this.entitlements.findOneAndUpdate(
        { ...base, type: "session_pack", remainingSessions: { $gte: 1 } },
        [
          {
            $set: {
              remainingSessions: { $subtract: ["$remainingSessions", 1] },
              status: {
                $cond: [
                  { $lte: ["$remainingSessions", 1] },
                  "exhausted",
                  "active",
                ],
              },
            },
          },
        ],
        { new: true },
      );
    } else {
      const weekKey = membershipWeekKey(
        input.sessionStartsAt,
        entitlement.weekCalendar,
      );
      const count = {
        $ifNull: [
          `$weeklyReservations.${weekKey}`,
          { $cond: [{ $eq: ["$usageWeekKey", weekKey] }, "$weeklyUsed", 0] },
        ],
      };
      reserved = await this.entitlements.findOneAndUpdate(
        {
          ...base,
          type: "time_membership",
          $expr: { $lt: [count, "$weeklyLimit"] },
        },
        [
          {
            $set: {
              usageWeekKey: weekKey,
              weeklyReservations: {
                $mergeObjects: [
                  { $ifNull: ["$weeklyReservations", {}] },
                  {
                    $cond: [
                      { $ne: [{ $ifNull: ["$usageWeekKey", null] }, null] },
                      {
                        $arrayToObject: [
                          [{ k: "$usageWeekKey", v: "$weeklyUsed" }],
                        ],
                      },
                      {},
                    ],
                  },
                  { [weekKey]: { $add: [count, 1] } },
                ],
              },
              weeklyUsed: { $add: [count, 1] },
            },
          },
        ],
        { new: true },
      );
    }
    if (!reserved)
      throw new AppError(
        409,
        "ENTITLEMENT_LIMIT_REACHED",
        "Membership limit reached",
      );
    try {
      return await this.usages.create({
        entitlementId: reserved._id,
        reservationId: input.reservationId,
        userId: oid(input.userId),
        sessionStartsAt: input.sessionStartsAt,
        status: "reserved",
      });
    } catch (error) {
      await this.restoreReservation(reserved, input.sessionStartsAt);
      throw error;
    }
  }

  async finalizeReservation(reservationId: Types.ObjectId, consumed: boolean) {
    const usage = await this.usages.findOneAndUpdate(
      {
        reservationId,
        status: consumed ? "reserved" : { $in: ["reserved", "consumed"] },
      },
      { $set: { status: consumed ? "consumed" : "released" } },
      { new: true },
    );
    if (!usage || consumed) return usage;
    const entitlement = await this.entitlements.findById(usage.entitlementId);
    if (entitlement)
      await this.restoreReservation(entitlement, usage.sessionStartsAt);
    return usage;
  }

  private async restoreReservation(
    entitlement: UserEntitlementDocument,
    startsAt: Date,
  ) {
    if (entitlement.type === "session_pack") {
      await this.entitlements.updateOne({ _id: entitlement._id }, [
        {
          $set: {
            remainingSessions: { $add: ["$remainingSessions", 1] },
            status: {
              $cond: [
                { $eq: ["$status", "exhausted"] },
                {
                  $cond: [{ $lte: ["$endsAt", "$$NOW"] }, "expired", "active"],
                },
                "$status",
              ],
            },
          },
        },
      ]);
    } else {
      const weekKey = membershipWeekKey(startsAt, entitlement.weekCalendar);
      const count = {
        $ifNull: [
          `$weeklyReservations.${weekKey}`,
          { $cond: [{ $eq: ["$usageWeekKey", weekKey] }, "$weeklyUsed", 0] },
        ],
      };
      await this.entitlements.updateOne(
        {
          _id: entitlement._id,
          $expr: { $gte: [count, 1] },
        },
        [
          {
            $set: {
              [`weeklyReservations.${weekKey}`]: { $subtract: [count, 1] },
              weeklyUsed: {
                $cond: [
                  { $eq: ["$usageWeekKey", weekKey] },
                  { $subtract: [count, 1] },
                  "$weeklyUsed",
                ],
              },
            },
          },
        ],
      );
    }
  }
}

function productDto(item: BenefitProductDocument) {
  return {
    id: String(item._id),
    clubId: String(item.clubId),
    title: item.title,
    description: item.description,
    type: item.type,
    price: item.price,
    sessionCount: item.sessionCount,
    validityDays: item.validityDays,
    maxPauseDays: item.maxPauseDays ?? 0,
    weeklyLimit: item.weeklyLimit,
    weekCalendar: item.weekCalendar ?? "iso_utc",
    sessionTypes: item.sessionTypes,
    status: item.status,
  };
}
function purchaseDto(item: BenefitPurchaseDocument) {
  return {
    id: String(item._id),
    productId: String(item.productId),
    clubId: String(item.clubId),
    amount: item.amount,
    status: item.status,
    entitlementId: item.entitlementId ? String(item.entitlementId) : null,
  };
}
function entitlementDto(item: UserEntitlementDocument) {
  return {
    id: String(item._id),
    productId: String(item.productId),
    clubId: String(item.clubId),
    title: item.title,
    type: item.type,
    maxPauseDays: item.maxPauseDays ?? 0,
    remainingPauseDays: Math.max(
      0,
      (item.maxPauseDays ?? 0) - (item.pauseUsedMs ?? 0) / 86_400_000,
    ),
    pauseUntil: item.pauseUntil?.toISOString() ?? null,
    changes: (item.changes ?? []).map((c) => ({
      ...c,
      at: new Date(c.at).toISOString(),
      beforeEndsAt: new Date(c.beforeEndsAt).toISOString(),
      afterEndsAt: new Date(c.afterEndsAt).toISOString(),
    })),
    remainingSessions: item.remainingSessions,
    weeklyLimit: item.weeklyLimit,
    weekCalendar: item.weekCalendar ?? "iso_utc",
    weeklyUsed: weeklyUsage(
      item,
      membershipWeekKey(new Date(), item.weekCalendar),
    ),
    sessionTypes: item.sessionTypes,
    startsAt: item.startsAt.toISOString(),
    endsAt: item.endsAt.toISOString(),
    status: item.status,
  };
}
function weeklyUsage(item: UserEntitlementDocument, weekKey: string) {
  return (
    item.weeklyReservations?.get(weekKey) ??
    (item.usageWeekKey === weekKey ? item.weeklyUsed : 0)
  );
}
function oid(value: string) {
  if (!Types.ObjectId.isValid(value))
    throw new AppError(400, "INVALID_OBJECT_ID", "Invalid id");
  return new Types.ObjectId(value);
}
function notFound(code: string) {
  return new AppError(404, code, "Resource not found");
}
