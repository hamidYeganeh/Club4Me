import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";

import { AppError } from "../../../common/errors/app.exception";
import type { UserRole } from "../../../lib/roles";
import type { AuthTokenPayload } from "../services/token.service";
import { ROLES_KEY } from "../decorators/roles.decorator";

type AuthenticatedRequest = Request & { user?: AuthTokenPayload };

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.user) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }

    if (!roles.some((role) => request.user?.roles.includes(role))) {
      throw new AppError(403, "FORBIDDEN", "Access denied");
    }

    return true;
  }
}
