import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { AuditLog, type AuditLogDocument } from "./schemas/audit-log.schema";

@Controller("api/v1/admin/audit-logs")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
export class AuditController {
  constructor(
    @InjectModel(AuditLog.name) private readonly logs: Model<AuditLogDocument>,
  ) {}

  @Get()
  async list(@Query("limit") rawLimit?: string) {
    const limit = Math.min(Math.max(Number(rawLimit) || 100, 1), 500);
    const items = await this.logs
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return {
      items: items.map((item) => ({
        id: String(item._id),
        actorId: String(item.actorId),
        action: item.action,
        method: item.method,
        path: item.path,
        statusCode: item.statusCode,
        metadata: item.metadata,
        ip: item.ip ?? null,
        createdAt: item.createdAt.toISOString(),
      })),
    };
  }
}
