import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { SignOptions } from "jsonwebtoken";

import { AppConfigService } from "../../../config/app-config.service";
import { isUserRole, type UserRole } from "../../../lib/roles";
import { expiresInToSeconds } from "../../../lib/time";

export type TokenUse = "access" | "refresh";

export type AuthTokenPayload = {
  sub: string;
  phone: string;
  roles: UserRole[];
  tokenUse: TokenUse;
  jti: string;
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
  refreshJti: string;
  accessExpiresIn: number;
  refreshExpiresIn: number;
};

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: AppConfigService,
  ) {}

  signTokenPair(user: {
    id: string;
    phone: string;
    roles: UserRole[];
  }): TokenPair {
    const accessJti = crypto.randomUUID();
    const refreshJti = crypto.randomUUID();
    const { JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN } = this.config.env;
    const accessExpiresIn = expiresInToSeconds(JWT_EXPIRES_IN);
    const refreshExpiresIn = expiresInToSeconds(JWT_REFRESH_EXPIRES_IN);
    const base = {
      sub: user.id,
      phone: user.phone,
      roles: user.roles,
    };

    return {
      accessToken: this.sign(
        { ...base, tokenUse: "access", jti: accessJti },
        JWT_EXPIRES_IN,
      ),
      refreshToken: this.sign(
        { ...base, tokenUse: "refresh", jti: refreshJti },
        JWT_REFRESH_EXPIRES_IN,
      ),
      refreshJti,
      accessExpiresIn,
      refreshExpiresIn,
    };
  }

  verify(token: string, tokenUse: TokenUse = "access"): AuthTokenPayload {
    const decoded: unknown = this.jwtService.verify(token, {
      secret: this.config.env.JWT_SECRET,
    });

    if (!isPayload(decoded) || decoded.tokenUse !== tokenUse) {
      throw new Error("Invalid token payload");
    }

    return decoded;
  }

  private sign(payload: AuthTokenPayload, expiresIn: string): string {
    return this.jwtService.sign(payload, {
      secret: this.config.env.JWT_SECRET,
      expiresIn: expiresIn as SignOptions["expiresIn"],
    });
  }
}

function isPayload(value: unknown): value is AuthTokenPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const payload = value as Record<string, unknown>;

  return (
    typeof payload.sub === "string" &&
    typeof payload.phone === "string" &&
    typeof payload.jti === "string" &&
    (payload.tokenUse === "access" || payload.tokenUse === "refresh") &&
    Array.isArray(payload.roles) &&
    payload.roles.every((role) => typeof role === "string" && isUserRole(role))
  );
}
