import { z } from "zod";

import { isAppVersion } from "../app-version";

const version = z.string().trim().refine(isAppVersion, {
  message: "Version must use x.y or x.y.z format",
});

export class SaveAppReleaseDto {
  static schema = z
    .object({
      latestVersion: version,
      minimumSupportedVersion: version,
      title: z.string().trim().min(1).max(160),
      releaseNotes: z.array(z.string().trim().min(1).max(300)).max(20),
      storeUrl: z.string().trim().url().max(1000),
      active: z.boolean(),
      maintenanceEnabled: z.boolean().default(false),
      maintenanceTitle: z
        .string()
        .trim()
        .min(1)
        .max(160)
        .default("در حال به‌روزرسانی سرویس"),
      maintenanceMessage: z
        .string()
        .trim()
        .min(1)
        .max(1000)
        .default("چند دقیقه دیگر دوباره تلاش کنید."),
      featureFlags: z
        .record(z.string().regex(/^[a-z][a-zA-Z0-9._-]{0,63}$/), z.boolean())
        .default({}),
    })
    .superRefine((value, context) => {
      const latest = value.latestVersion.split(".").map(Number);
      const minimum = value.minimumSupportedVersion.split(".").map(Number);
      for (let index = 0; index < 3; index += 1) {
        const difference = (minimum[index] ?? 0) - (latest[index] ?? 0);
        if (difference > 0) {
          context.addIssue({
            code: "custom",
            path: ["minimumSupportedVersion"],
            message: "Minimum supported version cannot exceed latest version",
          });
          break;
        }
        if (difference < 0) break;
      }
    });

  latestVersion: string;
  minimumSupportedVersion: string;
  title: string;
  releaseNotes: string[];
  storeUrl: string;
  active: boolean;
  maintenanceEnabled: boolean;
  maintenanceTitle: string;
  maintenanceMessage: string;
  featureFlags: Record<string, boolean>;
}
