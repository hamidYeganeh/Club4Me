import { z } from "zod";

export class CreateClubReviewDto {
  static schema = z
    .object({
      rating: z.number().int().min(1).max(5),
      title: z.string().trim().min(2).max(120).optional(),
      body: z.string().trim().max(2000).default(""),
    })
    .strict();

  rating: number;
  title?: string;
  body: string;
}
