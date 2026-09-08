import { z } from "zod";

export class CreateServiceReviewDto {
  static schema = z
    .object({
      rating: z.number().int().min(1).max(5),
      title: z.string().trim().min(2).max(120).optional(),
      body: z.string().trim().max(2000).default(""),
      mediaIds: z
        .array(z.string().regex(/^[a-f\d]{24}$/i))
        .max(10)
        .default([]),
    })
    .strict();

  rating: number;
  title?: string;
  body: string;
  mediaIds: string[];
}

export class ModerateServiceReviewDto {
  static schema = z
    .object({
      status: z.enum(["published", "hidden"]),
      reason: z.string().trim().max(500).default(""),
    })
    .strict();

  status: "published" | "hidden";
  reason: string;
}
