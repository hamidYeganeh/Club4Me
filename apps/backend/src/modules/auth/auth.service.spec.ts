import { AppError } from "../../common/errors/app.exception";
import { PublicUser } from "../users/mappers/user.mapper";
import { AuthService } from "./auth.service";

const user = (roles: PublicUser["roles"]): PublicUser => ({
  id: "user-1",
  phone: "+989121000001",
  roles,
  status: "active",
  hasPassword: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
});

describe("AuthService portal access", () => {
  const usersService = {
    findOrCreateByPhone: jest.fn(),
    requireByPhone: jest.fn(),
    findDocumentByPhone: jest.fn(),
    authenticate: jest.fn(),
    resetPassword: jest.fn(),
    findById: jest.fn(),
    setPassword: jest.fn(),
  };
  const otpService = {
    request: jest.fn(),
    consume: jest.fn(),
  };
  const tokenService = {
    signTokenPair: jest.fn(),
    verify: jest.fn(),
  };
  const sessions = {
    storeRefreshSession: jest.fn(),
    replaceRefreshSession: jest.fn(),
    revokeUserSessions: jest.fn(),
  };
  const smsProvider = {
    sendOtp: jest.fn(),
  };
  const config = {
    env: {
      APIIR_KEY: "api-ir-key",
    },
  };

  let authService: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    tokenService.signTokenPair.mockReturnValue({
      accessToken: "access",
      refreshToken: "refresh",
      refreshJti: "jti",
      accessExpiresIn: 900,
      refreshExpiresIn: 3600,
    });
    otpService.request.mockResolvedValue({
      result: { expiresIn: 300 },
      code: "12345",
    });
    authService = new AuthService(
      usersService as never,
      otpService as never,
      tokenService as never,
      sessions as never,
      config as never,
      smsProvider as never,
    );
  });

  it("does not create a user when requesting an admin OTP", async () => {
    usersService.requireByPhone.mockResolvedValue(user(["admin"]));

    await authService.requestLoginOtp("+989121000001", "admin");

    expect(usersService.findOrCreateByPhone).not.toHaveBeenCalled();
    expect(smsProvider.sendOtp).toHaveBeenCalled();
  });

  it("rejects an admin OTP request when the user lacks the role", async () => {
    usersService.requireByPhone.mockResolvedValue(user(["athlete"]));

    await expect(
      authService.requestLoginOtp("+989121000001", "admin"),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });
    expect(smsProvider.sendOtp).not.toHaveBeenCalled();
  });

  it("rejects password login for a business portal without the owner role", async () => {
    usersService.authenticate.mockResolvedValue(user(["athlete"]));

    await expect(
      authService.loginWithPassword("+989121000001", "password1", "owner"),
    ).rejects.toBeInstanceOf(AppError);

    await expect(
      authService.loginWithPassword("+989121000001", "password1", "owner"),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("issues tokens when an owner logs into the business portal", async () => {
    usersService.authenticate.mockResolvedValue(user(["owner"]));

    const result = await authService.loginWithPassword(
      "+989121000001",
      "password1",
      "owner",
    );

    expect(result.user.roles).toContain("owner");
    expect(result.accessToken).toBe("access");
  });
});
