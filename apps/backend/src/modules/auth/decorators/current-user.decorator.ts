import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { Request } from "express";

import { AppError } from "../../../common/errors/app.exception";
import type { AuthTokenPayload } from "../services/token.service";

type AuthenticatedRequest = Request & { user?: AuthTokenPayload };

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthTokenPayload => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.user) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }

    return request.user;
  },
);
