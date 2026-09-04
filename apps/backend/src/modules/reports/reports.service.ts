import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { AppError } from "../../common/errors/app.exception";
import {
  ContentReport,
  type ContentReportDocument,
} from "./schemas/content-report.schema";

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(ContentReport.name)
    private readonly reports: Model<ContentReportDocument>,
  ) {}

  async create(
    userId: string,
    input: {
      targetType: "club" | "coach" | "class";
      targetId: string;
      reason: string;
      details: string;
    },
  ) {
    if (!Types.ObjectId.isValid(input.targetId)) {
      throw new AppError(400, "REPORT_TARGET_INVALID", "Invalid report target");
    }
    const existing = await this.reports.findOne({
      reporterId: new Types.ObjectId(userId),
      targetType: input.targetType,
      targetId: new Types.ObjectId(input.targetId),
      status: "pending",
    });
    if (existing) return serialize(existing);
    return serialize(
      await this.reports.create({
        reporterId: new Types.ObjectId(userId),
        targetType: input.targetType,
        targetId: new Types.ObjectId(input.targetId),
        reason: input.reason,
        details: input.details,
      }),
    );
  }

  async list(status?: string) {
    const filter = status ? { status } : {};
    const items = await this.reports
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(500);
    return { items: items.map(serialize) };
  }

  async resolve(
    adminId: string,
    reportId: string,
    status: "resolved" | "rejected" | "closed",
    resolutionNote: string,
  ) {
    if (!Types.ObjectId.isValid(reportId)) {
      throw new AppError(404, "REPORT_NOT_FOUND", "Report not found");
    }
    const report = await this.reports.findByIdAndUpdate(
      reportId,
      {
        $set: {
          status,
          resolutionNote,
          handledBy: new Types.ObjectId(adminId),
        },
      },
      { new: true },
    );
    if (!report)
      throw new AppError(404, "REPORT_NOT_FOUND", "Report not found");
    return serialize(report);
  }
}

function serialize(report: ContentReportDocument) {
  return {
    id: String(report._id),
    reporterId: String(report.reporterId),
    targetType: report.targetType,
    targetId: String(report.targetId),
    reason: report.reason,
    details: report.details,
    status: report.status,
    resolutionNote: report.resolutionNote,
    handledBy: report.handledBy ? String(report.handledBy) : null,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
  };
}
