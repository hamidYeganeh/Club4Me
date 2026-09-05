import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { AuthModule } from "../auth/auth.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { AppConfigModule } from "../../config/app-config.module";
import { UsersModule } from "../users/users.module";
import {
  AdminSupportController,
  SupportController,
} from "./support.controller";
import { SupportTicket, SupportTicketSchema } from "./support.schema";
import { SupportService } from "./support.service";
import { SupportSlaService } from "./support-sla.service";

@Module({
  imports: [
    AuthModule,
    AppConfigModule,
    NotificationsModule,
    UsersModule,
    MongooseModule.forFeature([
      { name: SupportTicket.name, schema: SupportTicketSchema },
    ]),
  ],
  controllers: [SupportController, AdminSupportController],
  providers: [SupportService, SupportSlaService],
})
export class SupportModule {}
