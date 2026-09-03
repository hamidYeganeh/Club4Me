import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { AuthModule } from "../auth/auth.module";
import { UsersModule } from "../users/users.module";
import {
  AdminRoleRequestsController,
  RoleRequestsController,
} from "./role-requests.controller";
import { RoleRequestsRepository } from "./role-requests.repository";
import { RoleRequestsService } from "./role-requests.service";
import { RoleRequest, RoleRequestSchema } from "./schemas/role-request.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RoleRequest.name, schema: RoleRequestSchema },
    ]),
    AuthModule,
    UsersModule,
  ],
  controllers: [RoleRequestsController, AdminRoleRequestsController],
  providers: [RoleRequestsRepository, RoleRequestsService],
})
export class RoleRequestsModule {}
