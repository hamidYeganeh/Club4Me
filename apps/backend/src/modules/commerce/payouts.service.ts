import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { randomUUID } from "node:crypto";
import { Model, Types } from "mongoose";

import { AppError } from "../../common/errors/app.exception";
import { ClubsService } from "../clubs/clubs.service";
import { NotificationsService } from "../notifications/notifications.service";
import type { CreatePayoutDto, ReviewPayoutDto } from "./commerce.dto";
import {
  LedgerEntry,
  type LedgerEntryDocument,
  PayoutRequest,
  type PayoutRequestDocument,
  SettlementAccount,
  type SettlementAccountDocument,
} from "./schemas/commerce.schema";

@Injectable()
export class PayoutsService {
  constructor(
    @InjectModel(PayoutRequest.name)
    private readonly payouts: Model<PayoutRequestDocument>,
    @InjectModel(LedgerEntry.name)
    private readonly ledger: Model<LedgerEntryDocument>,
    @InjectModel(SettlementAccount.name)
    private readonly accounts: Model<SettlementAccountDocument>,
    private readonly clubs: ClubsService,
    private readonly notifications: NotificationsService,
  ) {}

  async balance(
    userId: string,
    providerType: "club" | "coach",
    providerId?: string,
  ) {
    const resolvedId = await this.authorizeProvider(
      userId,
      providerType,
      providerId,
    );
    const account = await this.ensureAccount(resolvedId);
    const ledgerBalance = account.availableAmount + account.reservedAmount;
    return {
      providerType,
      providerId: String(resolvedId),
      ledgerBalance,
      reservedAmount: account.reservedAmount,
      availableAmount: account.availableAmount,
    };
  }

  async listMine(userId: string) {
    const items = await this.payouts
      .find({ requestedBy: oid(userId) })
      .sort({ createdAt: -1 });
    return { items: items.map((item) => payoutDto(item)) };
  }

  async request(userId: string, input: CreatePayoutDto) {
    const current = await this.balance(
      userId,
      input.providerType,
      input.providerId,
    );
    if (input.amount > current.availableAmount) {
      throw new AppError(
        409,
        "INSUFFICIENT_PAYOUT_BALANCE",
        "Insufficient available payout balance",
      );
    }
    const reserved = await this.accounts.findOneAndUpdate(
      {
        providerId: oid(current.providerId),
        availableAmount: { $gte: input.amount },
      },
      {
        $inc: { availableAmount: -input.amount, reservedAmount: input.amount },
      },
      { new: true },
    );
    if (!reserved) {
      throw new AppError(
        409,
        "PAYOUT_BALANCE_CHANGED",
        "Available payout balance changed; please retry",
      );
    }
    const item = await this.payouts.create({
      requestedBy: oid(userId),
      providerType: input.providerType,
      providerId: oid(current.providerId),
      amount: input.amount,
      iban: input.iban,
      status: "requested",
    });
    await this.notifications.notifyPayoutStatus({
      userId,
      payoutId: item._id,
      amount: item.amount,
      status: "requested",
    });
    return payoutDto(item);
  }

  async listAdmin(status?: string) {
    const filter = status ? { status } : {};
    const items = await this.payouts
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(500);
    return { items: items.map((item) => payoutDto(item, true)) };
  }

  async review(adminId: string, payoutId: string, input: ReviewPayoutDto) {
    const payout = await this.payouts.findOneAndUpdate(
      { _id: oid(payoutId), status: "requested" },
      {
        $set: {
          status: input.status,
          reviewedBy: oid(adminId),
          reviewedAt: new Date(),
          reviewNote: input.note,
          bankReference: input.bankReference ?? null,
          ...(input.status === "paid" ? { paidAt: new Date() } : {}),
        },
      },
      { new: true },
    );
    if (!payout) {
      throw new AppError(
        409,
        "PAYOUT_NOT_PENDING",
        "Payout request is not pending",
      );
    }
    if (input.status === "paid") {
      const transactionId = randomUUID();
      await this.ledger.insertMany([
        {
          transactionId,
          account: "provider_payable",
          ownerId: payout.providerId,
          direction: "debit",
          amount: payout.amount,
          sourceType: "payout",
          sourceId: payout._id,
          idempotencyKey: `payout-${String(payout._id)}`,
        },
        {
          transactionId,
          account: "platform_cash",
          ownerId: null,
          direction: "credit",
          amount: payout.amount,
          sourceType: "payout",
          sourceId: payout._id,
          idempotencyKey: `payout-${String(payout._id)}`,
        },
      ]);
      await this.accounts.updateOne(
        { providerId: payout.providerId },
        { $inc: { reservedAmount: -payout.amount } },
      );
    } else {
      await this.accounts.updateOne(
        { providerId: payout.providerId },
        {
          $inc: {
            reservedAmount: -payout.amount,
            availableAmount: payout.amount,
          },
        },
      );
    }
    await this.notifications.notifyPayoutStatus({
      userId: payout.requestedBy,
      payoutId: payout._id,
      amount: payout.amount,
      status: input.status,
    });
    return payoutDto(payout);
  }

  private async authorizeProvider(
    userId: string,
    providerType: "club" | "coach",
    providerId?: string,
  ) {
    if (providerType === "club") {
      if (!providerId)
        throw new AppError(400, "PROVIDER_ID_REQUIRED", "Club id is required");
      await this.clubs.get(userId, providerId);
      return oid(providerId);
    }
    if (providerId && providerId !== userId) {
      throw new AppError(
        403,
        "FORBIDDEN",
        "Coach can only withdraw their own balance",
      );
    }
    return oid(userId);
  }

  private async ensureAccount(providerId: Types.ObjectId) {
    const existing = await this.accounts.findOne({ providerId });
    if (existing) return existing;
    const posted = await this.ledger.aggregate<{ _id: null; balance: number }>([
      { $match: { account: "provider_payable", ownerId: providerId } },
      {
        $group: {
          _id: null,
          balance: {
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
    ]);
    return this.accounts.findOneAndUpdate(
      { providerId },
      {
        $setOnInsert: {
          availableAmount: Math.max(0, posted[0]?.balance ?? 0),
          reservedAmount: 0,
        },
      },
      { upsert: true, new: true },
    );
  }
}

function payoutDto(item: PayoutRequestDocument, revealIban = false) {
  return {
    id: String(item._id),
    providerType: item.providerType,
    providerId: String(item.providerId),
    amount: item.amount,
    iban: revealIban ? item.iban : maskIban(item.iban),
    status: item.status,
    reviewNote: item.reviewNote,
    bankReference: item.bankReference,
    reviewedAt: item.reviewedAt?.toISOString() ?? null,
    paidAt: item.paidAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
  };
}

function maskIban(value: string) {
  return `${value.slice(0, 6)}${"*".repeat(16)}${value.slice(-4)}`;
}

function oid(value: string) {
  if (!Types.ObjectId.isValid(value))
    throw new AppError(400, "INVALID_OBJECT_ID", "Invalid id");
  return new Types.ObjectId(value);
}
