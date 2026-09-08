import {
  afterCommit,
  inAtomicOperation,
} from "../../infrastructure/database/atomic-operation";
import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import {
  Favorite,
  type FavoriteDocument,
} from "../favorites/schemas/favorite.schema";
import {
  Notification,
  type NotificationDocument,
} from "./schemas/notification.schema";
import { AppConfigService } from "../../config/app-config.service";
import type { SmsLookupTokens } from "../auth/providers/sms-provider.interface";
import { NotificationOutboxService } from "./notification-outbox.service";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(Notification.name)
    private readonly notifications: Model<NotificationDocument>,
    @InjectModel(Favorite.name)
    private readonly favorites: Model<FavoriteDocument>,
    private readonly config: AppConfigService,
    private readonly outbox: NotificationOutboxService,
  ) {}

  async list(userId: string) {
    const items = await this.notifications
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    return {
      items: items.map((item) => ({
        id: String(item._id),
        type: item.type,
        title: item.title,
        body: item.body,
        href: item.href ?? null,
        readAt: item.readAt?.toISOString() ?? null,
        createdAt: item.createdAt.toISOString(),
      })),
    };
  }

  async markRead(userId: string, notificationId: string) {
    if (!Types.ObjectId.isValid(notificationId)) return { success: true };
    await this.notifications.updateOne(
      {
        _id: new Types.ObjectId(notificationId),
        userId: new Types.ObjectId(userId),
      },
      { $set: { readAt: new Date() } },
    );
    return { success: true };
  }

  async notifyClassPublished(input: {
    classId: Types.ObjectId;
    title: string;
    coachId: Types.ObjectId;
    clubId?: Types.ObjectId;
  }) {
    const targets = [
      { entityType: "coach", entityId: input.coachId },
      ...(input.clubId ? [{ entityType: "club", entityId: input.clubId }] : []),
    ];
    const followers = await this.favorites.distinct("userId", { $or: targets });
    if (!followers.length) return;
    await this.notifications.insertMany(
      followers.map((userId) => ({
        userId,
        type: "class_published",
        title: "کلاس جدید منتشر شد",
        body: `کلاس «${input.title}» اکنون قابل مشاهده است.`,
        href: `/discovery/classes/${input.classId.toHexString()}`,
        readAt: null,
        pushDelivery: {},
      })),
    );
    await afterCommit(() => this.outbox.runSafely());
  }

  notifyBookingConfirmed(input: {
    userId: string | Types.ObjectId;
    bookingId: string | Types.ObjectId;
    title: string;
    href?: string;
  }) {
    return this.notifyUser({
      userId: input.userId,
      type: "booking_confirmed",
      title: "رزرو تأیید شد",
      body: `رزرو «${input.title}» با موفقیت تأیید شد.`,
      href: input.href ?? "/athlete/reservations",
      template: this.config.env.KAVENEGAR_BOOKING_CONFIRMED_TEMPLATE,
      tokens: { token: shortId(input.bookingId) },
    });
  }

  notifyMembershipExpiring(input: {
    userId: Types.ObjectId;
    entitlementId: Types.ObjectId;
    title: string;
    endsAt: Date;
  }) {
    return this.notifyUser({
      userId: input.userId,
      type: "membership_expiry_reminder",
      title: "اعتبار عضویت رو به پایان است",
      body: `اعتبار «${input.title}» در ${formatTehran(input.endsAt)} پایان می‌یابد.`,
      href: `/athlete/memberships/${input.entitlementId}`,
      tokens: { token: shortId(input.entitlementId) },
    });
  }

  notifyBookingCancelled(input: {
    userId: string | Types.ObjectId;
    bookingId: string | Types.ObjectId;
    title: string;
  }) {
    return this.notifyUser({
      userId: input.userId,
      type: "booking_cancelled",
      title: "رزرو لغو شد",
      body: `رزرو «${input.title}» لغو شد.`,
      href: "/athlete/reservations",
      template: this.config.env.KAVENEGAR_BOOKING_CANCELLED_TEMPLATE,
      tokens: { token: shortId(input.bookingId) },
    });
  }

  notifyPaymentFailed(input: {
    href?: string;
    userId: string | Types.ObjectId;
    paymentId: string | Types.ObjectId;
    title: string;
  }) {
    return this.notifyUser({
      userId: input.userId,
      type: "payment_failed",
      title: "پرداخت ناموفق بود",
      body: `پرداخت «${input.title}» ناموفق بود و ظرفیت آزاد شد.`,
      href: input.href ?? "/athlete/reservations",
      template: this.config.env.KAVENEGAR_PAYMENT_FAILED_TEMPLATE,
      tokens: { token: shortId(input.paymentId) },
    });
  }

  notifyBookingRescheduled(input: {
    userId: string | Types.ObjectId;
    bookingId: string | Types.ObjectId;
    title: string;
    startAt: Date;
  }) {
    return this.notifyUser({
      userId: input.userId,
      type: "booking_rescheduled",
      title: "زمان رزرو تغییر کرد",
      body: `زمان «${input.title}» به ${formatTehran(input.startAt)} تغییر کرد.`,
      href: "/athlete/reservations",
      template: this.config.env.KAVENEGAR_BOOKING_RESCHEDULED_TEMPLATE,
      tokens: {
        token: shortId(input.bookingId),
        token10: formatTehran(input.startAt),
      },
    });
  }

  notifyBookingReminder(input: {
    userId: string | Types.ObjectId;
    bookingId: string | Types.ObjectId;
    title: string;
    startAt: Date;
    href?: string;
  }) {
    return this.notifyUser({
      userId: input.userId,
      type: "booking_reminder",
      title: "یادآوری رزرو",
      body: `رزرو «${input.title}» در ${formatTehran(input.startAt)} شروع می‌شود.`,
      href: input.href ?? "/athlete/reservations",
      template: this.config.env.KAVENEGAR_BOOKING_REMINDER_TEMPLATE,
      tokens: {
        token: shortId(input.bookingId),
        token10: formatTehran(input.startAt),
      },
    });
  }

  notifyOwnerApproved(input: {
    userId: string | Types.ObjectId;
    clubId: string | Types.ObjectId;
    clubName: string;
  }) {
    return this.notifyUser({
      userId: input.userId,
      type: "club_owner_approved",
      title: "مالکیت باشگاه تأیید شد",
      body: `مالکیت شما برای «${input.clubName}» تأیید شد.`,
      href: `/clubs/${String(input.clubId)}`,
      template: this.config.env.KAVENEGAR_OWNER_APPROVED_TEMPLATE,
      tokens: { token: input.clubName.slice(0, 30) },
    });
  }

  notifyPayoutStatus(input: {
    userId: string | Types.ObjectId;
    payoutId: string | Types.ObjectId;
    amount: number;
    status: "requested" | "under_review" | "paid" | "rejected" | "cancelled";
  }) {
    const copy = {
      requested: {
        title: "درخواست تسویه ثبت شد",
        body: `درخواست برداشت ${input.amount.toLocaleString("fa-IR")} ریال ثبت شد.`,
      },
      under_review: {
        title: "درخواست تسویه در حال بررسی است",
        body: `درخواست برداشت ${input.amount.toLocaleString("fa-IR")} ریال در حال بررسی است.`,
      },
      paid: {
        title: "تسویه پرداخت شد",
        body: `مبلغ ${input.amount.toLocaleString("fa-IR")} ریال پرداخت شد.`,
      },
      rejected: {
        title: "درخواست تسویه رد شد",
        body: `درخواست برداشت ${input.amount.toLocaleString("fa-IR")} ریال رد شد.`,
      },
      cancelled: {
        title: "درخواست تسویه لغو شد",
        body: `درخواست برداشت ${input.amount.toLocaleString("fa-IR")} ریال لغو و موجودی آزاد شد.`,
      },
    }[input.status];
    return this.notifyUser({
      userId: input.userId,
      type: `payout_${input.status}`,
      title: copy.title,
      body: copy.body,
      href: "/payments",
      template: this.config.env.KAVENEGAR_PAYOUT_TEMPLATE,
      tokens: {
        token: shortId(input.payoutId),
        token10: input.amount.toLocaleString("fa-IR"),
      },
    });
  }

  notifyTicketUpdated(input: {
    userId: string | Types.ObjectId;
    ticketId: string | Types.ObjectId;
    status: string;
  }) {
    return this.notifyUser({
      userId: input.userId,
      type: "support_ticket_updated",
      title: "تیکت پشتیبانی به‌روزرسانی شد",
      body: `وضعیت تیکت شما به «${input.status}» تغییر کرد.`,
      href: `/athlete/support/tickets/${String(input.ticketId)}`,
      template: this.config.env.KAVENEGAR_SUPPORT_TEMPLATE,
      tokens: { token: shortId(input.ticketId), token10: input.status },
    });
  }

  async notifySupportEscalated(input: {
    userIds: Array<string | Types.ObjectId>;
    ticketId: string | Types.ObjectId;
    subject: string;
    level: number;
  }) {
    await Promise.all(
      input.userIds.map((userId) =>
        this.notifyUser({
          userId,
          type: "support_sla_escalated",
          title: `هشدار SLA پشتیبانی - سطح ${input.level}`,
          body: `پاسخ اولیه تیکت «${input.subject}» از SLA عبور کرده است.`,
          href: `/support/${String(input.ticketId)}`,
          tokens: {
            token: shortId(input.ticketId),
            token10: String(input.level),
          },
        }),
      ),
    );
  }

  notifyWaitlistSeatAvailable(input: {
    userId: string | Types.ObjectId;
    classId: string | Types.ObjectId;
    title: string;
  }) {
    return this.notifyUser({
      userId: input.userId,
      type: "waitlist_seat_available",
      title: "ظرفیت کلاس باز شد",
      body: `برای کلاس «${input.title}» ظرفیت باز شده؛ اولین تأیید، صندلی را می‌گیرد.`,
      href: `/discovery/business-classes/${String(input.classId)}`,
      template: this.config.env.KAVENEGAR_WAITLIST_TEMPLATE,
      tokens: {
        token: shortId(input.classId),
        token10: input.title.slice(0, 30),
      },
    });
  }

  private async notifyUser(input: {
    userId: string | Types.ObjectId;
    type: string;
    title: string;
    body: string;
    href: string;
    template?: string;
    tokens: SmsLookupTokens;
  }) {
    const userId = new Types.ObjectId(String(input.userId));
    try {
      const notification = await this.notifications.create({
        userId,
        type: input.type,
        title: input.title,
        body: input.body,
        href: input.href,
        readAt: null,
        pushDelivery: {},
        smsDelivery: {},
        smsTemplate: input.template ?? null,
        smsTokens: input.tokens,
      });
      await afterCommit(() => this.outbox.runSafely(notification._id));
    } catch (error) {
      if (inAtomicOperation()) throw error;
      this.logger.error(`Notification persistence failed type=${input.type}`);
      throw error;
    }
  }
}

function shortId(value: string | Types.ObjectId) {
  return String(value).slice(-8);
}

function formatTehran(value: Date) {
  return new Intl.DateTimeFormat("fa-IR", {
    timeZone: "Asia/Tehran",
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}
