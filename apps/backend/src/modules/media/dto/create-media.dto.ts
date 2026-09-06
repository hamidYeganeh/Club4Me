import { z } from "zod";

import { MAX_INLINE_IMAGE_URL_LENGTH } from "../media.constants";

const CreateMediaSchema = z
  .object({
    url: z
      .string()
      .trim()
      .refine((value) => {
        if (/^data:(?:image|video)\//i.test(value)) {
          return value.length <= MAX_INLINE_IMAGE_URL_LENGTH;
        }
        const result = z.url().max(2000).safeParse(value);
        return result.success;
      }, "url must be a valid external URL or base64 image/video payload"),
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
