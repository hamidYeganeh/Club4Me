import { z } from "zod";

export class RegisterPushDeviceDto {
  static schema = z.object({
    token: z.string().trim().min(16).max(4096),
    deviceId: z.string().trim().min(8).max(200),
    platform: z.literal("android"),
    appVersion: z
      .string()
      .trim()
      .regex(/^\d+\.\d+(?:\.\d+)?$/),
    locale: z.string().trim().min(2).max(20).default("fa-IR"),
  });

  token: string;
  deviceId: string;
  platform: "android";
  appVersion: string;
  locale: string;
}

export class UnregisterPushDeviceDto {
  static schema = z.object({
    deviceId: z.string().trim().min(8).max(200),
  });

  deviceId: string;
}

export class UpdateNotificationPreferencesDto {
  static schema = z
    .object({
      bookingUpdates: z.boolean().optional(),
      reminders: z.boolean().optional(),
      discovery: z.boolean().optional(),
      marketing: z.boolean().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, "No settings supplied");

  bookingUpdates?: boolean;
  reminders?: boolean;
  discovery?: boolean;
  marketing?: boolean;
}
