import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import type { Request } from "express";

import { AppError } from "../../../common/errors/app.exception";
import { TokenService, type AuthTokenPayload } from "../services/token.service";

type AuthenticatedRequest = Request & { user?: AuthTokenPayload };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }

    try {
      request.user = this.tokenService.verify(header.slice(7), "access");
      return true;
    } catch {
      throw new AppError(401, "UNAUTHORIZED", "Invalid or expired token");
    }
  }
}
