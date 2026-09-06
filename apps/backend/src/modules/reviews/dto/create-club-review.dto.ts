import { z } from "zod";

export class CreateClubReviewDto {
  static schema = z
    .object({
      rating: z.number().int().min(1).max(5),
      title: z.string().trim().min(2).max(120).optional(),
      body: z.string().trim().max(2000).default(""),
      ratings: z
        .record(
          z.string().regex(/^[a-f\d]{24}$/i),
          z.number().int().min(1).max(5),
        )
        .refine((value) => Object.keys(value).length <= 30, "Too many criteria")
        .optional(),
      mediaIds: z.array(z.string()).max(10).default([]),
    })
    .strict();

  rating: number;
  title?: string;
  body: string;
  ratings?: Record<string, number>;
  mediaIds: string[];
}

export class RespondToClubReviewDto {
  static schema = z
    .object({ body: z.string().trim().min(2).max(2000) })
    .strict();

  body: string;
}
