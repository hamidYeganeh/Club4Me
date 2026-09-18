import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { z } from "zod";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import type { AuthTokenPayload } from "../auth/services/token.service";
import {
  CrmCampaignsService,
  type AudienceFilter,
} from "./crm-campaigns.service";

const audienceFilterSchema = z
  .object({
    kind: z.enum([
      "all",
      "membership_expiring",
      "inactive",
      "reservation_date",
      "discount_unused",
    ]),
    days: z.number().int().min(1).max(365).optional(),
    date: z.iso.date().optional(),
    discountId: z
      .string()
      .regex(/^[a-f\d]{24}$/i)
      .optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.kind === "reservation_date" && !value.date)
      context.addIssue({
        code: "custom",
        path: ["date"],
        message: "Reservation date is required",
      });
    if (value.kind === "discount_unused" && !value.discountId)
      context.addIssue({
        code: "custom",
        path: ["discountId"],
        message: "Discount is required",
      });
  });
class AudienceFilterDto implements AudienceFilter {
  static schema = audienceFilterSchema;
  kind: AudienceFilter["kind"];
  days?: number;
  date?: string;
  discountId?: string;
}

class CreateCrmCampaignDto {
  static schema = z
    .object({
      title: z.string().trim().min(3).max(180),
      body: z.string().trim().min(3).max(1000),
      scheduledAt: z.iso.datetime(),
      kind: z.enum(["push", "news"]).default("push"),
      audience: z.enum(["all_students", "selected_students"]),
      studentIds: z.array(z.string().regex(/^[a-f\d]{24}$/i)).max(1000),
    })
    .strict();
  title: string;
  body: string;
  scheduledAt: string;
  kind: "push" | "news";
  audience: "all_students" | "selected_students";
  studentIds: string[];
}
class ReviewCrmCampaignDto {
  static schema = z.object({ approved: z.boolean() }).strict();
  approved: boolean;
}

@Controller("api/v1/business/clubs/:clubId/crm-campaigns")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("owner")
export class BusinessCrmCampaignsController {
  constructor(private readonly service: CrmCampaignsService) {}
  @Get() list(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
  ) {
    return this.service.listForClub(user.sub, clubId);
  }
  @Post("audience-preview") preview(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
    @Body() body: AudienceFilterDto,
  ) {
    return this.service.previewAudience(user.sub, clubId, body);
  }
  @Post() create(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
    @Body() body: CreateCrmCampaignDto,
  ) {
    return this.service.create(user.sub, clubId, body);
  }
  @Patch(":id") update(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
    @Param("id") id: string,
    @Body() body: CreateCrmCampaignDto,
  ) {
    return this.service.update(user.sub, clubId, id, body);
  }
}

@Controller("api/v1/public/clubs/:clubId/news")
export class PublicClubNewsController {
  constructor(private readonly service: CrmCampaignsService) {}
  @Get() list(@Param("clubId") clubId: string) {
    return this.service.publicNews(clubId);
  }
}
@Controller("api/v1/admin/crm-campaigns")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
export class AdminCrmCampaignsController {
  constructor(private readonly service: CrmCampaignsService) {}
  @Get() list() {
    return this.service.listForAdmin();
  }
  @Patch(":id/review") review(
    @CurrentUser() user: AuthTokenPayload,
    @Param("id") id: string,
    @Body() body: ReviewCrmCampaignDto,
  ) {
    return this.service.review(id, body.approved, user.sub);
  }
}
