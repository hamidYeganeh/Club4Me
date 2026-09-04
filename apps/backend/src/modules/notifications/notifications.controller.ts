import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthTokenPayload } from "../auth/services/token.service";
import { NotificationsService } from "./notifications.service";
import { PushNotificationsService } from "./push-notifications.service";
import {
  RegisterPushDeviceDto,
  UnregisterPushDeviceDto,
  UpdateNotificationPreferencesDto,
} from "./dto/push-device.dto";

@Controller("api/v1/notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly push: PushNotificationsService,
  ) {}

  @Get()
  list(@CurrentUser() user: AuthTokenPayload) {
    return this.notifications.list(user.sub);
  }

  @Patch(":notificationId/read")
  markRead(
    @CurrentUser() user: AuthTokenPayload,
    @Param("notificationId") notificationId: string,
  ) {
    return this.notifications.markRead(user.sub, notificationId);
  }

  @Post("devices")
  registerDevice(
    @CurrentUser() user: AuthTokenPayload,
    @Body() body: RegisterPushDeviceDto,
  ) {
    return this.push.register(user.sub, body);
  }

  @Delete("devices")
  unregisterDevice(
    @CurrentUser() user: AuthTokenPayload,
    @Body() body: UnregisterPushDeviceDto,
  ) {
    return this.push.unregister(user.sub, body.deviceId);
  }

  @Get("preferences")
  preferences(@CurrentUser() user: AuthTokenPayload) {
    return this.push.getPreferences(user.sub);
  }

  @Patch("preferences")
  updatePreferences(
    @CurrentUser() user: AuthTokenPayload,
    @Body() body: UpdateNotificationPreferencesDto,
  ) {
    return this.push.updatePreferences(user.sub, body);
  }
}
