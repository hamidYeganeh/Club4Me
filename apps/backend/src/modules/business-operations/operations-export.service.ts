import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { randomUUID } from "node:crypto";
import { Model, Types } from "mongoose";

import { AppError } from "../../common/errors/app.exception";
import { AppConfigService } from "../../config/app-config.service";
import { RedisService } from "../../infrastructure/redis/redis.service";
import {
  AuditLog,
  type AuditLogDocument,
} from "../audit/schemas/audit-log.schema";
import type { QueueOperationsExportDto } from "./business-operations.dto";
import { BusinessOperationsService } from "./business-operations.service";
import { ExportStorageService } from "./export-storage.service";
import {
  OperationsExportJob,
  type OperationsExportJobDocument,
} from "./schemas/operations-export.schema";

const LOCK = `
if redis.call('SET', KEYS[1], ARGV[1], 'NX', 'PX', ARGV[2]) then
  return 1
end
return 0
`.trim();
const UNLOCK = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
end
return 0
`.trim();

@Injectable()
export class OperationsExportService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OperationsExportService.name);
  private timer?: ReturnType<typeof setInterval>;

  constructor(
    @InjectModel(OperationsExportJob.name)
    private readonly jobs: Model<OperationsExportJobDocument>,
    @InjectModel(AuditLog.name)
    private readonly audit: Model<AuditLogDocument>,
    private readonly operations: BusinessOperationsService,
    private readonly storage: ExportStorageService,
    private readonly redis: RedisService,
    private readonly config: AppConfigService,
  ) {}

  onModuleInit() {
    if (this.config.env.NODE_ENV === "test") return;
    this.timer = setInterval(() => void this.runSafely(), 15_000);
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async queue(
    actorId: string,
    clubId: string,
    input: QueueOperationsExportDto,
  ) {
    await this.operations.authorizeExport(actorId, clubId);
    const job = await this.jobs.create({
      actorId: oid(actorId),
      clubId: oid(clubId),
      kind: input.kind,
      format: input.format,
      status: "queued",
    });
    void this.runSafely();
    return exportJobDto(job);
  }

  async get(actorId: string, clubId: string, jobId: string) {
    await this.operations.authorizeExport(actorId, clubId);
    const job = await this.findOwned(actorId, clubId, jobId);
    if (
      job.status === "ready" &&
      job.expiresAt &&
      job.expiresAt <= new Date()
    ) {
      job.status = "expired";
      await job.save();
    }
    return exportJobDto(job);
  }

  async download(actorId: string, clubId: string, jobId: string) {
    await this.operations.authorizeExport(actorId, clubId);
    const job = await this.findOwned(actorId, clubId, jobId);
    if (
      job.status !== "ready" ||
      !job.storageKey ||
      !job.filename ||
      !job.mimeType ||
      !job.expiresAt ||
      job.expiresAt <= new Date()
    ) {
      if (job.status === "ready") {
        job.status = "expired";
        await job.save();
      }
      throw new AppError(
        409,
        "EXPORT_NOT_READY",
        "Export is not ready for download",
      );
    }
    const file = await this.storage.download(job.storageKey);
    await Promise.all([
      this.jobs.updateOne({ _id: job._id }, { $inc: { downloadCount: 1 } }),
      this.audit.create({
        actorId: oid(actorId),
        action: "DOWNLOAD BUSINESS OPERATIONS EXPORT",
        method: "GET",
        path: `/api/v1/business/clubs/${clubId}/operations/exports/${jobId}/download`,
        statusCode: file.url ? 302 : 200,
        metadata: {
          clubId,
          jobId,
          kind: job.kind,
          format: job.format,
          sizeBytes: job.sizeBytes,
        },
      }),
    ]);
    return {
      ...file,
      filename: job.filename,
      mimeType: job.mimeType,
    };
  }

  async run() {
    const token = randomUUID();
    const acquired = await this.redis.eval(
      LOCK,
      1,
      "jobs:operations-export",
      token,
      2 * 60_000,
    );
    if (Number(acquired) !== 1) return { skipped: true, processed: 0 };
    await this.cleanupExpired();
    await this.jobs.updateMany(
      {
        status: "processing",
        startedAt: { $lte: new Date(Date.now() - 30 * 60_000) },
      },
      { $set: { status: "queued", startedAt: null } },
    );
    const job = await this.jobs.findOneAndUpdate(
      { status: "queued" },
      { $set: { status: "processing", startedAt: new Date(), error: "" } },
      { new: true, sort: { createdAt: 1 } },
    );
    if (!job) {
      await this.releaseLock(token);
      return { skipped: false, processed: 0 };
    }
    try {
      const result = await this.operations.exportData(
        String(job.actorId),
        String(job.clubId),
        job.kind,
        job.format,
      );
      const content = Buffer.from(result.content, result.encoding);
      const key = `${String(job.clubId)}/${randomUUID()}.${job.format}`;
      await this.storage.store(key, content, result.mimeType);
      job.status = "ready";
      job.storageKey = key;
      job.filename = result.filename;
      job.mimeType = result.mimeType;
      job.sizeBytes = content.byteLength;
      job.completedAt = new Date();
      job.expiresAt = new Date(
        Date.now() + this.config.env.EXPORT_TTL_HOURS * 60 * 60_000,
      );
      await job.save();
      await this.releaseLock(token);
      return { skipped: false, processed: 1 };
    } catch (error) {
      job.status = "failed";
      job.error =
        error instanceof Error ? error.message.slice(0, 1000) : "unknown";
      job.completedAt = new Date();
      await job.save();
      await this.releaseLock(token);
      return { skipped: false, processed: 1 };
    }
  }

  private async cleanupExpired() {
    const expired = await this.jobs
      .find({
        status: "ready",
        expiresAt: { $lte: new Date() },
        storageKey: { $ne: null },
      })
      .limit(50);
    for (const job of expired) {
      await this.storage.remove(job.storageKey!);
      await this.jobs.updateOne(
        { _id: job._id, status: "ready" },
        { $set: { status: "expired", storageKey: null } },
      );
    }
  }

  private async releaseLock(token: string) {
    try {
      await this.redis.eval(UNLOCK, 1, "jobs:operations-export", token);
    } catch (error) {
      this.logger.warn(
        `Operations export lock release failed: ${error instanceof Error ? error.message : "unknown"}`,
      );
    }
  }

  private async findOwned(actorId: string, clubId: string, jobId: string) {
    const job = await this.jobs.findOne({
      _id: oid(jobId),
      actorId: oid(actorId),
      clubId: oid(clubId),
    });
    if (!job) throw new AppError(404, "EXPORT_NOT_FOUND", "Export not found");
    return job;
  }

  private async runSafely() {
    try {
      await this.run();
    } catch (error) {
      this.logger.error(
        `Operations export job failed: ${error instanceof Error ? error.message : "unknown"}`,
      );
    }
  }
}

function exportJobDto(job: OperationsExportJobDocument) {
  return {
    id: String(job._id),
    clubId: String(job.clubId),
    kind: job.kind,
    format: job.format,
    status: job.status,
    filename: job.filename,
    mimeType: job.mimeType,
    sizeBytes: job.sizeBytes,
    error: job.status === "failed" ? job.error : "",
    downloadPath:
      job.status === "ready"
        ? `/business/clubs/${String(job.clubId)}/operations/exports/${String(job._id)}/download`
        : null,
    expiresAt: job.expiresAt?.toISOString() ?? null,
    createdAt: job.createdAt.toISOString(),
    completedAt: job.completedAt?.toISOString() ?? null,
  };
}

function oid(value: string) {
  if (!Types.ObjectId.isValid(value)) {
    throw new AppError(400, "INVALID_OBJECT_ID", "Invalid id");
  }
  return new Types.ObjectId(value);
}
