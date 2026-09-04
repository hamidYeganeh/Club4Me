import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { AuthModule } from "../auth/auth.module";
import {
  AdminReportsController,
  ReportsController,
} from "./reports.controller";
import { ReportsService } from "./reports.service";
import {
  ContentReport,
  ContentReportSchema,
} from "./schemas/content-report.schema";

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: ContentReport.name, schema: ContentReportSchema },
    ]),
  ],
  controllers: [ReportsController, AdminReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
