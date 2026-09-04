import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { Request, Response } from "express";
import { Model, Types } from "mongoose";
import { tap } from "rxjs/operators";

import type { AuthTokenPayload } from "../auth/services/token.service";
import { AuditLog, type AuditLogDocument } from "./schemas/audit-log.schema";

type AuthenticatedRequest = Request & { user?: AuthTokenPayload };

@Injectable()
export class AdminAuditInterceptor implements NestInterceptor {
  constructor(
    @InjectModel(AuditLog.name) private readonly logs: Model<AuditLogDocument>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (
      !request.path.startsWith("/api/v1/admin") ||
      ["GET", "HEAD", "OPTIONS"].includes(request.method) ||
      !request.user?.roles.includes("admin")
    ) {
      return next.handle();
    }
    const response = context.switchToHttp().getResponse<Response>();
    return next.handle().pipe(
      tap(() => {
        void this.logs.create({
          actorId: new Types.ObjectId(request.user!.sub),
          action: `${request.method} ${request.route?.path ?? request.path}`,
          method: request.method,
          path: request.originalUrl.split("?")[0],
          statusCode: response.statusCode,
          metadata: { params: request.params },
          ip: request.ip,
        });
      }),
    );
  }
}
