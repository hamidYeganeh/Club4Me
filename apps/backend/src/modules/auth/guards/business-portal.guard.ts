import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { AppError } from "../../../common/errors/app.exception";
import { ClubAccessService } from "../../clubs/club-access.service";
import type { AuthTokenPayload } from "../services/token.service";
@Injectable()
export class BusinessPortalGuard implements CanActivate {
  constructor(private readonly access: ClubAccessService) {}
  async canActivate(context: ExecutionContext) {
    const user = context
      .switchToHttp()
      .getRequest<{ user?: AuthTokenPayload }>().user;
    if (!user)
      throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    if (!(await this.access.hasPortalAccess(user.sub, user.roles)))
      throw new AppError(403, "FORBIDDEN", "Business access is required");
    return true;
  }
}
