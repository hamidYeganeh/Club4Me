import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";

import { AuthModule } from "../auth/auth.module";
import { AdminAuditInterceptor } from "./admin-audit.interceptor";
import { AuditController } from "./audit.controller";
import { AuditLog, AuditLogSchema } from "./schemas/audit-log.schema";

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
  ],
  controllers: [AuditController],
  providers: [{ provide: APP_INTERCEPTOR, useClass: AdminAuditInterceptor }],
})
export class AuditModule {}
