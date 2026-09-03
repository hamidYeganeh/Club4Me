import { z } from "zod";

import { iranianPhone } from "../../../common/utils/phone.util";

export const RequestOtpSchema = z.object({
  phone: iranianPhone,
});

export class RequestOtpDto {
  static schema = RequestOtpSchema;
  phone: string;
}
