import { JwtService } from "@nestjs/jwt";

import { AppConfigService } from "../../../config/app-config.service";
import type { Env } from "../../../config/env";
import { TokenService } from "./token.service";

function createTokenService() {
  const config = {
    env: {
      JWT_SECRET: "test-jwt-secret-value",
      JWT_EXPIRES_IN: "15m",
      JWT_REFRESH_EXPIRES_IN: "30d",
    } as Env,
  } as AppConfigService;

  return new TokenService(new JwtService(), config);
}

describe("TokenService", () => {
  const user = {
    id: "507f1f77bcf86cd799439011",
    phone: "+989121234567",
    roles: ["athlete" as const],
  };

  it("issues distinct access and refresh tokens with independent jtis", () => {
    const service = createTokenService();
    const tokens = service.signTokenPair(user);

    const access = service.verify(tokens.accessToken, "access");
    const refresh = service.verify(tokens.refreshToken, "refresh");

    expect(access.tokenUse).toBe("access");
    expect(refresh.tokenUse).toBe("refresh");
    expect(access.jti).not.toBe(refresh.jti);
    expect(tokens.accessExpiresIn).toBe(15 * 60);
    expect(tokens.refreshExpiresIn).toBe(30 * 24 * 60 * 60);
  });

  it("rejects using an access token as a refresh token and vice versa", () => {
    const service = createTokenService();
    const tokens = service.signTokenPair(user);

    expect(() => service.verify(tokens.accessToken, "refresh")).toThrow(
      "Invalid token payload",
    );
    expect(() => service.verify(tokens.refreshToken, "access")).toThrow(
      "Invalid token payload",
    );
  });
});
