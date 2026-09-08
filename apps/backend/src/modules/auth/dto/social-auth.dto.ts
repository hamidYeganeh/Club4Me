import { z } from "zod";

const provider = z.enum(["google", "facebook", "x"]);
export class StartSocialAuthDto {
  static schema = z.object({ provider, returnTo: z.string().startsWith("/").max(500).default("/") }).strict();
  provider: z.infer<typeof provider>;
  returnTo: string;
}
export class ExchangeSocialTicketDto {
  static schema = z.object({ ticket: z.string().uuid() }).strict();
  ticket: string;
}
export class RequestSocialLinkOtpDto {
  static schema = z.object({ linkToken: z.string().uuid(), phone: z.string().trim().min(10).max(16) }).strict();
  linkToken: string;
  phone: string;
}
export class ConfirmSocialLinkDto {
  static schema = RequestSocialLinkOtpDto.schema.extend({ code: z.string().regex(/^\d{4,8}$/) }).strict();
  linkToken: string;
  phone: string;
  code: string;
}
