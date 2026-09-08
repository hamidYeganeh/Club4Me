import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import type { AuthTokenPayload } from "../auth/services/token.service";
import { ClubMembershipsService } from "./club-memberships.service";
import { InviteClubMemberDto } from "./dto/club-membership.dto";

@Controller("api/v1/business/clubs/:clubId/memberships")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("owner")
export class BusinessClubMembershipsController {
  constructor(private readonly service: ClubMembershipsService) {}
  @Get() list(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
  ) {
    return this.service.list(user.sub, clubId);
  }
  @Patch(":membershipId/revoke") revoke(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
    @Param("membershipId") id: string,
  ) {
    return this.service.revoke(user.sub, clubId, id);
  }
  @Post() invite(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
    @Body() body: InviteClubMemberDto,
  ) {
    return this.service.invite(user.sub, clubId, body);
  }
}

@Controller("api/v1/club-memberships")
@UseGuards(JwtAuthGuard)
export class ClubMembershipInvitationsController {
  constructor(private readonly service: ClubMembershipsService) {}
  @Get(":membershipId") get(
    @CurrentUser() user: AuthTokenPayload,
    @Param("membershipId") id: string,
  ) {
    return this.service.invitation(user.sub, id);
  }
  @Patch(":membershipId/accept") accept(
    @CurrentUser() user: AuthTokenPayload,
    @Param("membershipId") id: string,
  ) {
    return this.service.decide(user.sub, id, "accepted");
  }
  @Patch(":membershipId/reject") reject(
    @CurrentUser() user: AuthTokenPayload,
    @Param("membershipId") id: string,
  ) {
    return this.service.decide(user.sub, id, "rejected");
  }
}
