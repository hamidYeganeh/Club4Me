import { z } from "zod";

export class CreateClubReviewDto {
  static schema = z
    .object({
      rating: z.number().int().min(1).max(5),
      title: z.string().trim().min(2).max(120).optional(),
      body: z.string().trim().max(2000).default(""),
      ratings: z
        .object({
          cleanliness: z.number().int().min(1).max(5).optional(),
          staff: z.number().int().min(1).max(5).optional(),
          equipment: z.number().int().min(1).max(5).optional(),
          value: z.number().int().min(1).max(5).optional(),
        })
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
