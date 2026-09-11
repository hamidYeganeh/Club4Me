import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  UseGuards,
  Res,
  NotFoundException,
} from "@nestjs/common";
import type { Response } from "express";
import { trainingAnimation } from "./vital-catalog";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthTokenPayload } from "../auth/services/token.service";
import { TrainingService } from "./training.service";

@Controller("api/v1/training")
@UseGuards(JwtAuthGuard)
export class TrainingController {
  constructor(private readonly training: TrainingService) {}
  @Get("exercises") exercises() {
    return this.training.exercises();
  }
  @Get("exercises/:id/animation") animation(
    @Param("id") id: string,
    @Res() response: Response,
  ) {
    const file = trainingAnimation(id);
    if (!file) throw new NotFoundException();
    response.setHeader("Content-Type", "video/mp4");
    response.setHeader("Cache-Control", "private, no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.sendFile(file);
  }
  @Get("coach/follow-ups") followUps(@CurrentUser() u: AuthTokenPayload) {
    return this.training.followUps(u.sub);
  }
  @Put("coach/assignments/:id/sessions/:clientId/review") review(
    @CurrentUser() u: AuthTokenPayload,
    @Param("id") id: string,
    @Param("clientId") clientId: string,
    @Body() body: unknown,
  ) {
    return this.training.reviewSession(u.sub, id, clientId, body);
  }
  @Get("coach/clients") clients(@CurrentUser() u: AuthTokenPayload) {
    return this.training.clients(u.sub);
  }
  @Get("coach/plans") plans(@CurrentUser() u: AuthTokenPayload) {
    return this.training.listPlans(u.sub);
  }
  @Put("coach/plans/:id") savePlan(
    @CurrentUser() u: AuthTokenPayload,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    return this.training.savePlan(u.sub, id, body);
  }
  @Put("coach/assignments") assign(
    @CurrentUser() u: AuthTokenPayload,
    @Body() body: unknown,
  ) {
    return this.training.assign(u.sub, body);
  }
  @Get("coach/assignments") coachAssignments(
    @CurrentUser() u: AuthTokenPayload,
  ) {
    return this.training.listAssignments(u.sub, true);
  }
  @Put("coach/assignments/:id/revoke") revoke(
    @CurrentUser() u: AuthTokenPayload,
    @Param("id") id: string,
  ) {
    return this.training.revoke(u.sub, id);
  }
  @Get("coach/assignments/:id/sessions") coachSessions(
    @CurrentUser() u: AuthTokenPayload,
    @Param("id") id: string,
  ) {
    return this.training.coachSessions(u.sub, id);
  }
  @Get("assignments") assignments(@CurrentUser() u: AuthTokenPayload) {
    return this.training.listAssignments(u.sub);
  }
  @Put("assignments/:id/consent") consent(
    @CurrentUser() u: AuthTokenPayload,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    return this.training.consent(u.sub, id, body);
  }
  @Get("sessions") sessions(@CurrentUser() u: AuthTokenPayload) {
    return this.training.listSessions(u.sub);
  }
  @Put("sessions/:id") saveSession(
    @CurrentUser() u: AuthTokenPayload,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    return this.training.saveSession(u.sub, id, body);
  }
}
