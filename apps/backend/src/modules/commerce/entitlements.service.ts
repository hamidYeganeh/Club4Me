import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { AppError } from "../../common/errors/app.exception";
import { ClubsService } from "../clubs/clubs.service";
import type { CreateBenefitProductDto } from "./entitlements.dto";
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
    await this.clubs.get(userId, clubId);
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
    await this.clubs.get(userId, clubId);
    return productDto(
      await this.products.create({
        ...input,
        clubId: oid(clubId),
        status: "active",
      }),
    );
  }

  async updateStatus(
    userId: string,
    clubId: string,
    productId: string,
    status: "active" | "inactive",
  ) {
    await this.clubs.get(userId, clubId);
    const item = await this.products.findOneAndUpdate(
      { _id: oid(productId), clubId: oid(clubId) },
      { $set: { status } },
      { new: true },
    );
    if (!item) throw notFound("BENEFIT_PRODUCT_NOT_FOUND");
    return productDto(item);
  }

  async listPublic(clubId: string) {
    const items = await this.products
      .find({ clubId: oid(clubId), status: "active" })
      .sort({ price: 1 });
    return { items: items.map(productDto) };
  }

  async createPurchase(userId: string, productId: string) {
    const product = await this.products.findOne({
      _id: oid(productId),
      status: "active",
    });
    if (!product) throw notFound("BENEFIT_PRODUCT_NOT_FOUND");
    const purchase = await this.purchases.create({
      productId: product._id,
      clubId: product.clubId,
      userId: oid(userId),
      amount: product.price,
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
    const product = await this.products.findById(purchase.productId);
    if (!product) throw notFound("BENEFIT_PRODUCT_NOT_FOUND");
    const startsAt = new Date();
    const endsAt = new Date(
      startsAt.getTime() + product.validityDays * 86_400_000,
    );
    const entitlement = await this.entitlements.findOneAndUpdate(
      { purchaseId: purchase._id },
      {
        $setOnInsert: {
          productId: product._id,
          purchaseId: purchase._id,
          clubId: product.clubId,
          userId: purchase.userId,
          title: product.title,
          type: product.type,
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
    purchase.entitlementId = entitlement._id;
    await purchase.save();
    return entitlement;
  }

  async refundPurchase(purchaseId: Types.ObjectId) {
    const purchase = await this.purchases.findOneAndUpdate(
      { _id: purchaseId, status: "paid" },
      { $set: { status: "refunded" } },
      { new: true },
    );
    if (purchase?.entitlementId) {
      await this.entitlements.updateOne(
        { _id: purchase.entitlementId },
        { $set: { status: "revoked" } },
      );
    }
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
      const weekKey = isoWeekKey(input.sessionStartsAt);
      reserved = await this.entitlements.findOneAndUpdate(
        {
          ...base,
          type: "time_membership",
          $or: [
            { usageWeekKey: { $ne: weekKey } },
            {
              usageWeekKey: weekKey,
              weeklyUsed: { $lt: entitlement.weeklyLimit },
            },
          ],
        },
        [
          {
            $set: {
              usageWeekKey: weekKey,
              weeklyUsed: {
                $cond: [
                  { $eq: ["$usageWeekKey", weekKey] },
                  { $add: ["$weeklyUsed", 1] },
                  1,
                ],
              },
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
      await this.entitlements.updateOne(
        { _id: entitlement._id },
        { $inc: { remainingSessions: 1 }, $set: { status: "active" } },
      );
    } else {
      await this.entitlements.updateOne(
        {
          _id: entitlement._id,
          usageWeekKey: isoWeekKey(startsAt),
          weeklyUsed: { $gte: 1 },
        },
        { $inc: { weeklyUsed: -1 } },
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
    weeklyLimit: item.weeklyLimit,
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
    remainingSessions: item.remainingSessions,
    weeklyLimit: item.weeklyLimit,
    weeklyUsed: item.weeklyUsed,
    sessionTypes: item.sessionTypes,
    startsAt: item.startsAt.toISOString(),
    endsAt: item.endsAt.toISOString(),
    status: item.status,
  };
}
function isoWeekKey(value: Date) {
  const date = new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
  );
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((date.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7,
  );
  return `${date.getUTCFullYear()}-${String(week).padStart(2, "0")}`;
}
function oid(value: string) {
  if (!Types.ObjectId.isValid(value))
    throw new AppError(400, "INVALID_OBJECT_ID", "Invalid id");
  return new Types.ObjectId(value);
}
function notFound(code: string) {
  return new AppError(404, code, "Resource not found");
}
