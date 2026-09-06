import { z } from "zod";

export class CreateClubTagDto {
  static schema = z.object({ name: z.string().trim().min(1).max(50) }).strict();

  name!: string;
}
