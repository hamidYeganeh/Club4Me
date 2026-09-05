import { z } from "zod";

export class ResolveBusinessClassPaymentDto {
  static schema = z.object({ result: z.enum(["approve", "reject"]) }).strict();
  result: "approve" | "reject";
}

export class GenerateClassCheckInDto {
  static schema = z
    .object({ expiresInMinutes: z.number().int().min(5).max(120).default(15) })
    .strict();
  expiresInMinutes: number;
}

export class ClassCheckInDto {
  static schema = z
    .object({
      classId: z.string().length(24),
      sessionId: z.string().length(24),
      credential: z.string().trim().min(5).max(300),
    })
    .strict();
  classId: string;
  sessionId: string;
  credential: string;
}
