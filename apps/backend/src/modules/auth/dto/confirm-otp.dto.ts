import { z } from "zod";

import { iranianPhone } from "../../../common/utils/phone.util";

const otpCode = z.string().regex(/^\d{5}$/, "OTP must be 5 digits");

export const ConfirmOtpSchema = z.object({
  phone: iranianPhone,
  code: otpCode,
});

export class ConfirmOtpDto {
  static schema = ConfirmOtpSchema;
  phone: string;
  code: string;
}
