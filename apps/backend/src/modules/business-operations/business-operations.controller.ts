import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import type { AuthTokenPayload } from "../auth/services/token.service";
import {
  CreateBranchDto,
  CreateCoachDto,
  CreatePaymentDto,
  CreateStudentDto,
  UpdateBranchDto,
  UpdateCoachDto,
  UpdateStudentDto,
  UpsertAttendanceDto,
  ImportOperationsDto,
  QueueOperationsExportDto,
} from "./business-operations.dto";
import { BusinessOperationsService } from "./business-operations.service";
import { OperationsExportService } from "./operations-export.service";

@Controller("api/v1/business/clubs/:clubId/operations")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("owner")
export class BusinessOperationsController {
  constructor(
    private readonly service: BusinessOperationsService,
    private readonly exports: OperationsExportService,
  ) {}

  @Get("students") listStudents(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
  ) {
    return this.service.listStudents(user.sub, clubId);
  }
  @Post("students") createStudent(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
    @Body() body: CreateStudentDto,
  ) {
    return this.service.createStudent(user.sub, clubId, body);
  }
  @Patch("students/:itemId") updateStudent(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
    @Param("itemId") itemId: string,
    @Body() body: UpdateStudentDto,
  ) {
    return this.service.updateStudent(user.sub, clubId, itemId, body);
  }

  @Get("coaches") listCoaches(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
  ) {
    return this.service.listCoaches(user.sub, clubId);
  }
  @Post("coaches") createCoach(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
    @Body() body: CreateCoachDto,
  ) {
    return this.service.createCoach(user.sub, clubId, body);
  }
  @Patch("coaches/:itemId") updateCoach(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
    @Param("itemId") itemId: string,
    @Body() body: UpdateCoachDto,
  ) {
    return this.service.updateCoach(user.sub, clubId, itemId, body);
  }

  @Get("payments") listPayments(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
  ) {
    return this.service.listPayments(user.sub, clubId);
  }
  @Post("payments") createPayment(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
    @Body() body: CreatePaymentDto,
  ) {
    return this.service.createPayment(user.sub, clubId, user.sub, body);
  }

  @Get("attendance") listAttendance(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
    @Query("date") date?: string,
  ) {
    return this.service.listAttendance(user.sub, clubId, date);
  }
  @Post("attendance") upsertAttendance(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
    @Body() body: UpsertAttendanceDto,
  ) {
    return this.service.upsertAttendance(user.sub, clubId, user.sub, body);
  }

  @Get("branches") listBranches(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
  ) {
    return this.service.listBranches(user.sub, clubId);
  }
  @Post("branches") createBranch(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
    @Body() body: CreateBranchDto,
  ) {
    return this.service.createBranch(user.sub, clubId, body);
  }
  @Patch("branches/:itemId") updateBranch(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
    @Param("itemId") itemId: string,
    @Body() body: UpdateBranchDto,
  ) {
    return this.service.updateBranch(user.sub, clubId, itemId, body);
  }

  @Get("summary") summary(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
  ) {
    return this.service.summary(user.sub, clubId);
  }

  @Get("export")
  exportData(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
    @Query("kind") kind?: string,
    @Query("format") format?: string,
  ) {
    return this.service.exportData(user.sub, clubId, kind, format);
  }

  @Post("exports")
  queueExport(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
    @Body() body: QueueOperationsExportDto,
  ) {
    return this.exports.queue(user.sub, clubId, body);
  }

  @Get("exports/:jobId")
  getExport(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
    @Param("jobId") jobId: string,
  ) {
    return this.exports.get(user.sub, clubId, jobId);
  }

  @Get("exports/:jobId/download")
  async downloadExport(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
    @Param("jobId") jobId: string,
    @Res() response: Response,
  ) {
    const file = await this.exports.download(user.sub, clubId, jobId);
    if (file.url) return response.redirect(302, file.url);
    response.setHeader("Content-Type", file.mimeType);
    response.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
    );
    response.send(file.content);
  }

  @Post("import")
  importData(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
    @Body() body: ImportOperationsDto,
  ) {
    return this.service.importData(user.sub, clubId, user.sub, body);
  }
}
