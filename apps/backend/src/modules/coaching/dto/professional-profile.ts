import { Types } from "mongoose";
import { z } from "zod";

const text = (max: number) => z.string().trim().max(max).default("");
const date = z.union([z.literal(""), z.iso.date()]).default("");
const secureUrl = z
  .union([
    z.literal(""),
    z
      .url()
      .max(1000)
      .refine((value) => {
        const url = new URL(value);
        return url.protocol === "https:" && !url.username && !url.password;
      }, "Use a public HTTPS URL"),
  ])
  .default("");

export const CoachProfessionalProfileSchema = z
  .object({
    audience: text(1500),
    goals: z.array(z.string().trim().min(2).max(100)).max(12).default([]),
    levels: z
      .array(z.enum(["beginner", "intermediate", "advanced", "competitive"]))
      .max(4)
      .refine(
        (items) => new Set(items).size === items.length,
        "Duplicate levels",
      )
      .default([]),
    prerequisites: text(1500),
    firstSession: text(1500),
    planning: text(1500),
    followUp: text(1500),
    progressTracking: text(1500),
    introductionVideoUrl: secureUrl,
    credentials: z
      .array(
        z
          .object({
            title: z.string().trim().min(2).max(160),
            issuer: z.string().trim().min(2).max(160),
            year: text(30),
            expiresOn: date,
            mediaId: z
              .string()
              .refine(
                (value) => Types.ObjectId.isValid(value),
                "Invalid media id",
              )
              .optional(),
          })
          .strict(),
      )
      .max(20)
      .default([]),
    achievements: z
      .array(
        z
          .object({
            title: z.string().trim().min(2).max(200),
            organization: text(160),
            year: text(30),
          })
          .strict(),
      )
      .max(20)
      .default([]),
    successStories: z
      .array(
        z
          .object({
            title: z.string().trim().min(2).max(160),
            goal: z.string().trim().min(2).max(500),
            duration: z.string().trim().min(2).max(100),
            outcome: z.string().trim().min(2).max(1500),
            consent: z.literal(true),
          })
          .strict(),
      )
      .max(12)
      .default([]),
  })
  .strict();

export type CoachProfessionalProfile = z.infer<
  typeof CoachProfessionalProfileSchema
>;

// Certificate attachments are omitted from public profiles; a profile approval is not a credential verification.
export function publicProfessionalProfile(
  value?: Partial<CoachProfessionalProfile> | null,
) {
  return {
    ...CoachProfessionalProfileSchema.parse({}),
    ...value,
    credentials: (value?.credentials ?? []).map(
      ({ mediaId: _mediaId, ...credential }) => credential,
    ),
    successStories: (value?.successStories ?? []).filter(
      (story) => story.consent === true,
    ),
  };
}
