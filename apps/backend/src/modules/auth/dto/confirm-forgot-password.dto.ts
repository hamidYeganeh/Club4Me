import { z } from "zod";

import { iranianPhone } from "../../../common/utils/phone.util";

const otpCode = z.string().regex(/^\d{5}$/, "OTP must be 5 digits");
const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128);

export const ConfirmForgotPasswordSchema = z.object({
  phone: iranianPhone,
  code: otpCode,
  password,
});

export class ConfirmForgotPasswordDto {
  static schema = ConfirmForgotPasswordSchema;
  phone: string;
  code: string;
  password: string;
}
