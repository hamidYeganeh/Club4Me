import { z } from "zod";

import { iranianPhone } from "../../../common/utils/phone.util";

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128);

export const LoginSchema = z.object({
  phone: iranianPhone,
  password,
});

export class LoginDto {
  static schema = LoginSchema;
  phone: string;
  password: string;
}
