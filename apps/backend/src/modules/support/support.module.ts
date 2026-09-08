import { SupportReferencesService } from "./support-references.service";
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
import { ContactLead, ContactLeadSchema } from "./contact-lead.schema";
import { ContactLeadsService } from "./contact-leads.service";
import {
  AdminContactLeadsController,
  PublicContactLeadsController,
} from "./contact-leads.controller";

@Module({
  imports: [
    AuthModule,
    AppConfigModule,
    NotificationsModule,
    UsersModule,
    MongooseModule.forFeature([
      { name: SupportTicket.name, schema: SupportTicketSchema },
      { name: ContactLead.name, schema: ContactLeadSchema },
    ]),
  ],
  controllers: [
    SupportController,
    AdminSupportController,
    PublicContactLeadsController,
    AdminContactLeadsController,
  ],
  providers: [
    SupportService,
    SupportSlaService,
    SupportReferencesService,
    ContactLeadsService,
  ],
})
export class SupportModule {}
