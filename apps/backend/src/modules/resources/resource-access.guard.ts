import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AppError } from "../../common/errors/app.exception";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthTokenPayload } from "../auth/services/token.service";

export const RESOURCE_PUBLIC_OPTIONS = "resource:public-options";

@Injectable()
export class ResourceAccessGuard implements CanActivate {
  constructor(
    private readonly auth: JwtAuthGuard,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      method: string;
      query: Record<string, unknown>;
      headers: { authorization?: string };
      user?: AuthTokenPayload;
    }>();
    const optionsRead =
      request.method === "GET" && request.query.action === "options";
    const publicOptions = this.reflector.get<boolean>(
      RESOURCE_PUBLIC_OPTIONS,
      context.getClass(),
    );
    if (optionsRead && publicOptions) return true;
    await this.auth.canActivate(context);
    if (!request.user?.roles.includes("admin"))
      throw new AppError(
        403,
        "FORBIDDEN",
        "Only admins may manage resource data",
      );
    return true;
  }
}
