import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthTokenPayload } from "../auth/services/token.service";
import {
  GroupTelemetryDto,
  IdentifyTelemetryDto,
  TrackTelemetryDto,
} from "./dto/telemetry.dto";
import { TelemetryService } from "./telemetry.service";

@Controller("api/v1/telemetry")
@UseGuards(JwtAuthGuard)
@Throttle({ default: { limit: 60, ttl: 60_000 } })
export class TelemetryController {
  constructor(private readonly telemetry: TelemetryService) {}

  @Post("identify")
  @HttpCode(HttpStatus.ACCEPTED)
  identify(
    @CurrentUser() actor: AuthTokenPayload,
    @Body() body: IdentifyTelemetryDto,
  ) {
    return this.telemetry.identify(actor, body);
  }

  @Post("groups")
  @HttpCode(HttpStatus.ACCEPTED)
  group(
    @CurrentUser() actor: AuthTokenPayload,
    @Body() body: GroupTelemetryDto,
  ) {
    return this.telemetry.group(actor, body);
  }

  @Post("events")
  @HttpCode(HttpStatus.ACCEPTED)
  track(
    @CurrentUser() actor: AuthTokenPayload,
    @Body() body: TrackTelemetryDto,
  ) {
    return this.telemetry.track(actor, body);
  }
}
