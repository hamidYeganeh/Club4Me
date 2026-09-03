import jwt, { type SignOptions } from "jsonwebtoken";

import type { Env } from "../config/env.js";
import { isUserRole, type UserRole } from "./roles.js";
import { expiresInToSeconds } from "./time.js";

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

function sign(
  env: Env,
  payload: AuthTokenPayload,
  expiresIn: string,
): string {
  const options: SignOptions = {
    expiresIn: expiresIn as SignOptions["expiresIn"],
  };

  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function signTokenPair(
  env: Env,
  user: { id: string; phone: string; roles: UserRole[] },
): TokenPair {
  const accessJti = crypto.randomUUID();
  const refreshJti = crypto.randomUUID();
  const accessExpiresIn = expiresInToSeconds(env.JWT_EXPIRES_IN);
  const refreshExpiresIn = expiresInToSeconds(env.JWT_REFRESH_EXPIRES_IN);
  const base = {
    sub: user.id,
    phone: user.phone,
    roles: user.roles,
  };

  return {
    accessToken: sign(
      env,
      { ...base, tokenUse: "access", jti: accessJti },
      env.JWT_EXPIRES_IN,
    ),
    refreshToken: sign(
      env,
      { ...base, tokenUse: "refresh", jti: refreshJti },
      env.JWT_REFRESH_EXPIRES_IN,
    ),
    refreshJti,
    accessExpiresIn,
    refreshExpiresIn,
  };
}

export function verifyToken(
  env: Env,
  token: string,
  tokenUse: TokenUse = "access",
): AuthTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);

  if (!isPayload(decoded) || decoded.tokenUse !== tokenUse) {
    throw new Error("Invalid token payload");
  }

  return decoded;
}
