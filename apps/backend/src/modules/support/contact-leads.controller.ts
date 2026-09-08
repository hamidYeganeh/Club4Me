import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { z } from "zod";

import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { ContactLeadsService } from "./contact-leads.service";

class CreateContactLeadDto {
  static schema = z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(254),
    note: z.string().trim().max(3000).default(""),
    consent: z.literal(true),
    website: z.string().max(200).optional(),
  }).strict();
  name: string;
  email: string;
  note: string;
  consent: true;
  website?: string;
}

class UpdateContactLeadDto {
  static schema = z.object({ status: z.enum(["new", "contacted", "closed"]) }).strict();
  status: "new" | "contacted" | "closed";
}

@Controller("api/v1/public/contact")
export class PublicContactLeadsController {
  constructor(private readonly leads: ContactLeadsService) {}
  @Post()
  @Throttle({ default: { limit: 5, ttl: 60 * 60_000 } })
  create(@Body() body: CreateContactLeadDto) { return this.leads.create(body); }
}

@Controller("api/v1/admin/contact-leads")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
export class AdminContactLeadsController {
  constructor(private readonly leads: ContactLeadsService) {}
  @Get() list(@Query("status") status?: string) { return this.leads.list(status); }
  @Patch(":id") update(@Param("id") id: string, @Body() body: UpdateContactLeadDto) {
    return this.leads.update(id, body.status);
  }
}
