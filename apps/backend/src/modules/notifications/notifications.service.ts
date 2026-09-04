import { Inject, Injectable, Logger } from "@nestjs/common";
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
import {
  SMS_PROVIDER,
  type SmsLookupTokens,
  type SmsProvider,
} from "../auth/providers/sms-provider.interface";
import { UsersRepository } from "../users/users.repository";
import { AppConfigService } from "../../config/app-config.service";
import { PushNotificationsService } from "./push-notifications.service";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(Notification.name)
    private readonly notifications: Model<NotificationDocument>,
    @InjectModel(Favorite.name)
    private readonly favorites: Model<FavoriteDocument>,
    @Inject(SMS_PROVIDER) private readonly sms: SmsProvider,
    private readonly users: UsersRepository,
    private readonly config: AppConfigService,
    private readonly push: PushNotificationsService,
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
      })),
    );
    await this.push.sendToUsers({
      userIds: followers,
      type: "class_published",
      title: "کلاس جدید منتشر شد",
      body: `کلاس «${input.title}» اکنون قابل مشاهده است.`,
      href: `/discovery/classes/${input.classId.toHexString()}`,
    });
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
    userId: string | Types.ObjectId;
    paymentId: string | Types.ObjectId;
    title: string;
  }) {
    return this.notifyUser({
      userId: input.userId,
      type: "payment_failed",
      title: "پرداخت ناموفق بود",
      body: `پرداخت «${input.title}» ناموفق بود و ظرفیت آزاد شد.`,
      href: "/athlete/reservations",
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
  }) {
    return this.notifyUser({
      userId: input.userId,
      type: "booking_reminder",
      title: "یادآوری رزرو",
      body: `رزرو «${input.title}» در ${formatTehran(input.startAt)} شروع می‌شود.`,
      href: "/athlete/reservations",
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

  private async notifyUser(input: {
    userId: string | Types.ObjectId;
    type: string;
    title: string;
    body: string;
    href: string;
    template: string;
    tokens: SmsLookupTokens;
  }) {
    const userId = new Types.ObjectId(String(input.userId));
    try {
      await this.notifications.create({
        userId,
        type: input.type,
        title: input.title,
        body: input.body,
        href: input.href,
        readAt: null,
      });
      await this.push.sendToUsers({
        userIds: [userId],
        type: input.type,
        title: input.title,
        body: input.body,
        href: input.href,
      });
    } catch (error) {
      this.logger.error(
        `In-app notification failed type=${input.type} userId=${String(userId)} error=${error instanceof Error ? error.message : "unknown"}`,
      );
    }
    try {
      const user = await this.users.findById(String(userId));
      await this.sms.sendTemplate(user.phone, input.template, input.tokens);
    } catch (error) {
      this.logger.error(
        `Transactional SMS failed type=${input.type} userId=${String(userId)} error=${error instanceof Error ? error.message : "unknown"}`,
      );
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
