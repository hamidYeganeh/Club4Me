import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { Model, Types } from "mongoose";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { AppConfigService } from "../../config/app-config.service";
import type {
  RegisterPushDeviceDto,
  UpdateNotificationPreferencesDto,
} from "./dto/push-device.dto";
import {
  NotificationPreferences,
  type NotificationPreferencesDocument,
} from "./schemas/notification-preferences.schema";
import {
  PushDevice,
  type PushDeviceDocument,
} from "./schemas/push-device.schema";

const DEFAULT_PREFERENCES = {
  bookingUpdates: true,
  reminders: true,
  discovery: true,
  marketing: false,
};

@Injectable()
export class PushNotificationsService {
  private readonly logger = new Logger(PushNotificationsService.name);
  private readonly configured: boolean;

  constructor(
    @InjectModel(PushDevice.name)
    private readonly devices: Model<PushDeviceDocument>,
    @InjectModel(NotificationPreferences.name)
    private readonly preferences: Model<NotificationPreferencesDocument>,
    config: AppConfigService,
  ) {
    const env = config.env;
    const localCredentialPath = [
      resolve(".secrets/firebase-service-account.json"),
      resolve("apps/backend/.secrets/firebase-service-account.json"),
    ].find((path) => existsSync(path));
    const configuredCredentialPath = env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
    if (
      configuredCredentialPath &&
      !existsSync(resolve(configuredCredentialPath))
    ) {
      throw new Error(
        `Firebase service account file does not exist: ${configuredCredentialPath}`,
      );
    }
    const serviceAccountPath = configuredCredentialPath || localCredentialPath;
    const fileCredential = serviceAccountPath
      ? readServiceAccount(serviceAccountPath)
      : null;
    this.configured = Boolean(
      fileCredential ||
      (env.FIREBASE_PROJECT_ID &&
        env.FIREBASE_CLIENT_EMAIL &&
        env.FIREBASE_PRIVATE_KEY),
    );
    if (this.configured && getApps().length === 0) {
      initializeApp({
        credential: cert(
          fileCredential ?? {
            projectId: env.FIREBASE_PROJECT_ID,
            clientEmail: env.FIREBASE_CLIENT_EMAIL,
            privateKey: env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
          },
        ),
      });
    }
    if (!this.configured) {
      this.logger.warn(
        "Firebase Admin is not configured; push delivery is disabled",
      );
    }
  }

  async register(userId: string, input: RegisterPushDeviceDto) {
    await this.devices.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), deviceId: input.deviceId },
      {
        $set: {
          ...input,
          userId: new Types.ObjectId(userId),
          enabled: true,
          lastSeenAt: new Date(),
        },
      },
      { upsert: true, new: true, runValidators: true },
    );
    return { success: true as const };
  }

  async unregister(userId: string, deviceId: string) {
    await this.devices.deleteOne({
      userId: new Types.ObjectId(userId),
      deviceId,
    });
    return { success: true as const };
  }

  async getPreferences(userId: string) {
    const item = await this.preferences
      .findOne({ userId: new Types.ObjectId(userId) })
      .lean();
    return item
      ? {
          bookingUpdates: item.bookingUpdates,
          reminders: item.reminders,
          discovery: item.discovery,
          marketing: item.marketing,
        }
      : DEFAULT_PREFERENCES;
  }

  async updatePreferences(
    userId: string,
    input: UpdateNotificationPreferencesDto,
  ) {
    const item = await this.preferences
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        { $set: input, $setOnInsert: { userId: new Types.ObjectId(userId) } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .lean();
    return {
      bookingUpdates: item!.bookingUpdates,
      reminders: item!.reminders,
      discovery: item!.discovery,
      marketing: item!.marketing,
    };
  }

  async sendToUsers(
    input: {
      userIds: Array<string | Types.ObjectId>;
      type: string;
      title: string;
      body: string;
      href?: string;
      deliveryId?: string;
    },
    strict = false,
  ) {
    if (!this.configured || input.userIds.length === 0)
      return "skipped" as const;
    try {
      const userIds = input.userIds.map((id) => new Types.ObjectId(String(id)));
      const allowed = await this.allowedUserIds(
        userIds,
        categoryFor(input.type),
      );
      if (allowed.length === 0) return "skipped" as const;
      const devices = await this.devices
        .find({ userId: { $in: allowed }, enabled: true })
        .select("token")
        .lean();

      if (!devices.length) return "skipped" as const;
      for (let offset = 0; offset < devices.length; offset += 500) {
        const batch = devices.slice(offset, offset + 500);
        const response = await getMessaging().sendEachForMulticast({
          tokens: batch.map((device) => device.token),
          notification: { title: input.title, body: input.body },
          data: {
            type: input.type,
            ...(input.deliveryId ? { notificationId: input.deliveryId } : {}),
            href: input.href ?? "/athlete/notifications",
          },
          android: {
            priority: "high",
            notification: {
              channelId: "gym4me_transactional",
              ...(input.deliveryId ? { tag: input.deliveryId } : {}),
              sound: "default",
            },
          },
        });
        const invalidTokens = response.responses.flatMap((result, index) =>
          !result.success && isInvalidTokenCode(result.error?.code)
            ? [batch[index]!.token]
            : [],
        );
        if (invalidTokens.length > 0) {
          await this.devices.deleteMany({ token: { $in: invalidTokens } });
        }
        if (response.failureCount > invalidTokens.length) {
          if (strict) throw new Error("PUSH_PARTIAL_FAILURE");
          this.logger.error(
            `Push batch partially failed failures=${response.failureCount} tokens=${batch.length}`,
          );
        }
      }
      return "accepted" as const;
    } catch (error) {
      if (strict) throw error;
      this.logger.error(
        `Push delivery failed type=${input.type} error=${error instanceof Error ? error.message : "unknown"}`,
      );
    }
  }

  private async allowedUserIds(
    userIds: Types.ObjectId[],
    category: keyof typeof DEFAULT_PREFERENCES,
  ) {
    const preferences = await this.preferences
      .find({ userId: { $in: userIds } })
      .lean();
    const byUser = new Map(
      preferences.map((item) => [String(item.userId), item]),
    );
    return userIds.filter((userId) => {
      const item = byUser.get(String(userId));
      return item ? item[category] : DEFAULT_PREFERENCES[category];
    });
  }
}

function readServiceAccount(path: string) {
  const value = JSON.parse(readFileSync(resolve(path), "utf8")) as {
    project_id?: string;
    client_email?: string;
    private_key?: string;
  };
  if (!value.project_id || !value.client_email || !value.private_key) {
    throw new Error("Firebase service account file is invalid");
  }
  return {
    projectId: value.project_id,
    clientEmail: value.client_email,
    privateKey: value.private_key,
  };
}

export function categoryFor(type: string): keyof typeof DEFAULT_PREFERENCES {
  if (type === "booking_reminder" || type === "membership_expiry_reminder")
    return "reminders";
  if (type === "class_published") return "discovery";
  if (type.startsWith("marketing_")) return "marketing";
  return "bookingUpdates";
}

function isInvalidTokenCode(code?: string) {
  return (
    code === "messaging/registration-token-not-registered" ||
    code === "messaging/invalid-registration-token"
  );
}
