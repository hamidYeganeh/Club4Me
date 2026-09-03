import { z } from "zod";

import { iranianPhone } from "../../../common/utils/phone.util";

export const ForgotPasswordSchema = z.object({
  phone: iranianPhone,
});

export class ForgotPasswordDto {
  static schema = ForgotPasswordSchema;
  phone: string;
}
