import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import type { Request } from "express";

import { AppError } from "../../../common/errors/app.exception";
import { UsersService } from "../../users/users.service";
import { TokenService, type AuthTokenPayload } from "../services/token.service";

type AuthenticatedRequest = Request & { user?: AuthTokenPayload };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }

    let payload: AuthTokenPayload;
    try {
      payload = this.tokenService.verify(header.slice(7), "access");
    } catch {
      throw new AppError(401, "UNAUTHORIZED", "Invalid or expired token");
    }

    const user = await this.usersService.findById(payload.sub);
    if (user.status !== "active") {
      throw new AppError(403, "ACCOUNT_SUSPENDED", "Account is suspended");
    }

    request.user = payload;
    return true;
  }
}
