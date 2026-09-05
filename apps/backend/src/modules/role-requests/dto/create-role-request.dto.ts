import { z } from "zod";

export const RoleRequestDetailsSchema = z
  .object({
    displayName: z.string().trim().min(2).max(100),
    city: z.string().trim().min(2).max(100),
    experienceYears: z.number().int().min(0).max(80).optional(),
    specialty: z.string().trim().min(2).max(200).optional(),
    credentials: z.string().trim().max(500).optional(),
    businessName: z.string().trim().min(2).max(150).optional(),
    businessType: z.string().trim().min(2).max(100).optional(),
    description: z.string().trim().min(20).max(1000),
  })
  .strict();

const CreateRoleRequestSchema = z
  .object({ details: RoleRequestDetailsSchema })
  .strict();

export type RoleRequestDetails = z.infer<typeof RoleRequestDetailsSchema>;

export class CreateRoleRequestDto {
  static schema = CreateRoleRequestSchema;
  details: RoleRequestDetails;
}
