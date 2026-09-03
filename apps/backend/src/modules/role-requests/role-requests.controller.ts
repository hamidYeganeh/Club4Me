import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthTokenPayload } from "../auth/services/token.service";
import { ReviewRoleRequestDto } from "./dto/review-role-request.dto";
import { RoleRequestsService } from "./role-requests.service";

@Controller("api/v1/account")
export class RoleRequestsController {
  constructor(private readonly roleRequestsService: RoleRequestsService) {}

  @Post("roles/:role")
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  requestRole(
    @CurrentUser() user: AuthTokenPayload,
    @Param("role") role: string,
  ) {
    return this.roleRequestsService.requestRole(user.sub, role);
  }
}

@Controller("api/v1/admin")
export class AdminRoleRequestsController {
  constructor(private readonly roleRequestsService: RoleRequestsService) {}

  @Get("role-requests")
  @UseGuards(JwtAuthGuard)
  listRoleRequests(@CurrentUser() user: AuthTokenPayload) {
    return this.roleRequestsService.listForAdmin(user.roles);
  }

  @Patch("role-requests/:requestId")
  @UseGuards(JwtAuthGuard)
  reviewRoleRequest(
    @CurrentUser() user: AuthTokenPayload,
    @Param("requestId") requestId: string,
    @Body() body: ReviewRoleRequestDto,
  ) {
    return this.roleRequestsService.decideForAdmin(
      user.roles,
      requestId,
      body.status,
    );
  }
}
