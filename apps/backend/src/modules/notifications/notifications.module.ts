import { NotificationOutboxService } from "./notification-outbox.service";
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { AuthModule } from "../auth/auth.module";
import { UsersModule } from "../users/users.module";
import { AppConfigModule } from "../../config/app-config.module";
import { Favorite, FavoriteSchema } from "../favorites/schemas/favorite.schema";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
import { PushNotificationsService } from "./push-notifications.service";
import {
  Notification,
  NotificationSchema,
} from "./schemas/notification.schema";
import {
  NotificationPreferences,
  NotificationPreferencesSchema,
} from "./schemas/notification-preferences.schema";
import { PushDevice, PushDeviceSchema } from "./schemas/push-device.schema";

@Module({
  imports: [
    AuthModule,
    UsersModule,
    AppConfigModule,
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: Favorite.name, schema: FavoriteSchema },
      { name: PushDevice.name, schema: PushDeviceSchema },
      {
        name: NotificationPreferences.name,
        schema: NotificationPreferencesSchema,
      },
    ]),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    PushNotificationsService,
    NotificationOutboxService,
  ],
  exports: [NotificationsService, PushNotificationsService],
})
export class NotificationsModule {}
