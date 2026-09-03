import { z } from "zod";

const CreateMediaSchema = z
  .object({
    url: z.url().max(2000),
    mimeType: z
      .string()
      .trim()
      .regex(/^(image|video)\/[a-z0-9.+-]+$/i),
  })
  .strict();

export class CreateMediaDto {
  static schema = CreateMediaSchema;
  url: string;
  mimeType: string;
}
