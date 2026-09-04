import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { z } from "zod";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import type { AuthTokenPayload } from "../auth/services/token.service";
import { ReportsService } from "./reports.service";

class CreateReportDto {
  static schema = z
    .object({
      targetType: z.enum(["club", "coach", "class"]),
      targetId: z.string().length(24),
      reason: z.string().trim().min(3).max(120),
      details: z.string().trim().max(2000).default(""),
    })
    .strict();
  targetType: "club" | "coach" | "class";
  targetId: string;
  reason: string;
  details: string;
}

class ResolveReportDto {
  static schema = z
    .object({
      status: z.enum(["resolved", "rejected", "closed"]),
      resolutionNote: z.string().trim().max(1000).default(""),
    })
    .strict();
  status: "resolved" | "rejected" | "closed";
  resolutionNote: string;
}

@Controller("api/v1/reports")
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}
  @Post()
  create(@CurrentUser() user: AuthTokenPayload, @Body() body: CreateReportDto) {
    return this.reports.create(user.sub, body);
  }
}

@Controller("api/v1/admin/reports")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
export class AdminReportsController {
  constructor(private readonly reports: ReportsService) {}
  @Get()
  list(@Query("status") status?: string) {
    return this.reports.list(status);
  }
  @Patch(":reportId")
  resolve(
    @CurrentUser() user: AuthTokenPayload,
    @Param("reportId") reportId: string,
    @Body() body: ResolveReportDto,
  ) {
    return this.reports.resolve(
      user.sub,
      reportId,
      body.status,
      body.resolutionNote,
    );
  }
}
