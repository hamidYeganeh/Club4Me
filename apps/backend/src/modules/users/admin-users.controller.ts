import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import { z } from "zod";

import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { UsersService } from "./users.service";

class UpdateUserStatusDto {
  static schema = z
    .object({ status: z.enum(["active", "suspended"]) })
    .strict();
  status: "active" | "suspended";
}

@Controller("api/v1/admin/users")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
export class AdminUsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  async list(@Query("q") query?: string) {
    return { items: await this.users.list(query) };
  }

  @Patch(":userId/status")
  updateStatus(
    @Param("userId") userId: string,
    @Body() body: UpdateUserStatusDto,
  ) {
    return this.users.updateStatus(userId, body.status);
  }
}
