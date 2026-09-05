import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import type { AuthTokenPayload } from "../auth/services/token.service";
import {
  CreateTicketDto,
  ReplyTicketDto,
  UpdateTicketDto,
} from "./support.dto";
import { SupportService } from "./support.service";

@Controller("api/v1/support/tickets")
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private readonly support: SupportService) {}
  @Post() create(
    @CurrentUser() user: AuthTokenPayload,
    @Body() body: CreateTicketDto,
  ) {
    return this.support.create(user.sub, body);
  }
  @Get() list(@CurrentUser() user: AuthTokenPayload) {
    return this.support.listMine(user.sub);
  }
  @Post(":ticketId/replies")
  reply(
    @CurrentUser() user: AuthTokenPayload,
    @Param("ticketId") ticketId: string,
    @Body() body: ReplyTicketDto,
  ) {
    return this.support.reply(user.sub, ticketId, body.message);
  }
}

@Controller("api/v1/admin/support/tickets")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
export class AdminSupportController {
  constructor(private readonly support: SupportService) {}
  @Get() list(@Query("status") status?: string) {
    return this.support.listAdmin(status);
  }
  @Patch(":ticketId")
  update(
    @CurrentUser() user: AuthTokenPayload,
    @Param("ticketId") ticketId: string,
    @Body() body: UpdateTicketDto,
  ) {
    return this.support.update(user.sub, ticketId, body);
  }
}
