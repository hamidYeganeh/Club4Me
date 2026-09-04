import type { ExecutionContext } from "@nestjs/common";
import type { Request } from "express";

import type { UsersService } from "../../users/users.service";
import type { TokenService, AuthTokenPayload } from "../services/token.service";
import { JwtAuthGuard } from "./jwt-auth.guard";

const payload: AuthTokenPayload = {
  sub: "507f1f77bcf86cd799439011",
  phone: "+989121234567",
  roles: ["athlete"],
  tokenUse: "access",
  jti: "test-token",
};

function contextWithAuthorization(value?: string) {
  const request = { headers: { authorization: value } } as Request;
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, request };
}

describe("JwtAuthGuard", () => {
  const tokenService = { verify: jest.fn() } as unknown as TokenService;
  const usersService = { findById: jest.fn() } as unknown as UsersService;

  beforeEach(() => jest.clearAllMocks());

  it("accepts an active user and attaches the verified payload", async () => {
    jest.mocked(tokenService.verify).mockReturnValue(payload);
    jest.mocked(usersService.findById).mockResolvedValue({
      id: payload.sub,
      phone: payload.phone,
      roles: payload.roles,
      status: "active",
      hasPassword: false,
      createdAt: "2026-09-03T00:00:00.000Z",
      updatedAt: "2026-09-03T00:00:00.000Z",
    });
    const { context, request } = contextWithAuthorization("Bearer valid");

    await expect(
      new JwtAuthGuard(tokenService, usersService).canActivate(context),
    ).resolves.toBe(true);
    expect((request as Request & { user?: AuthTokenPayload }).user).toBe(
      payload,
    );
  });

  it("rejects a suspended user even when the token is valid", async () => {
    jest.mocked(tokenService.verify).mockReturnValue(payload);
    jest.mocked(usersService.findById).mockResolvedValue({
      id: payload.sub,
      phone: payload.phone,
      roles: payload.roles,
      status: "suspended",
      hasPassword: false,
      createdAt: "2026-09-03T00:00:00.000Z",
      updatedAt: "2026-09-03T00:00:00.000Z",
    });
    const { context } = contextWithAuthorization("Bearer valid");

    await expect(
      new JwtAuthGuard(tokenService, usersService).canActivate(context),
    ).rejects.toMatchObject({
      status: 403,
      code: "ACCOUNT_SUSPENDED",
    });
  });

  it("rejects a request without a bearer token", async () => {
    const { context } = contextWithAuthorization();

    await expect(
      new JwtAuthGuard(tokenService, usersService).canActivate(context),
    ).rejects.toMatchObject({ status: 401, code: "UNAUTHORIZED" });
  });
});
