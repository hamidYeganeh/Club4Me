import { Inject, Injectable } from "@nestjs/common";

import { AppError } from "../../common/errors/app.exception";
import { toLocalIranianPhone } from "../../common/utils/phone.util";
import type { UserRole } from "../../lib/roles";
import type { PublicUser } from "../users/mappers/user.mapper";
import type {
  UserActivityLevel,
  UserGender,
} from "../users/schemas/user.schema";
import { UsersService } from "../users/users.service";
import {
  SMS_PROVIDER,
  type SmsProvider,
} from "./providers/sms-provider.interface";
import { AuthSessionsService } from "./services/auth-sessions.service";
import { OtpService } from "./services/otp.service";
import { TokenService, type TokenPair } from "./services/token.service";
import { AppConfigService } from "../../config/app-config.service";

export type AuthResult = TokenPair & {
  user: PublicUser;
};

export type ClientAuthResult = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: PublicUser;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly otpService: OtpService,
    private readonly tokenService: TokenService,
    private readonly sessions: AuthSessionsService,
    private readonly config: AppConfigService,
    @Inject(SMS_PROVIDER) private readonly smsProvider: SmsProvider,
  ) {}

  async requestLoginOtp(
    phone: string,
    requiredRole?: UserRole,
  ): Promise<{ expiresIn: number }> {
    if (requiredRole) {
      await this.requirePortalUser(phone, requiredRole);
    } else {
      await this.usersService.findOrCreateByPhone(phone);
    }

    const { result, code } = await this.otpService.request(phone, "login");
    await this.smsProvider.sendOtp(phone, code, "otp");
    return result;
  }

  async confirmLoginOtp(
    phone: string,
    code: string,
    requiredRole?: UserRole,
  ): Promise<ClientAuthResult> {
    if (requiredRole) {
      await this.requirePortalUser(phone, requiredRole);
    }

    await this.otpService.consume(phone, code, "login");
    const user = requiredRole
      ? await this.usersService.requireByPhone(phone)
      : await this.usersService.findOrCreateByPhone(phone);

    if (requiredRole) {
      this.assertRole(user, requiredRole);
    }

    return this.toClientAuth(await this.issueAuth(user));
  }

  async loginWithPassword(
    phone: string,
    password: string,
    requiredRole?: UserRole,
  ): Promise<ClientAuthResult> {
    const user = await this.usersService.authenticate(phone, password);

    if (requiredRole) {
      this.assertRole(user, requiredRole);
    }

    return this.toClientAuth(await this.issueAuth(user));
  }

  setPassword(
    userId: string,
    password: string,
    currentPassword?: string,
  ): Promise<PublicUser> {
    return this.usersService.setPassword(userId, password, currentPassword);
  }

  async requestPasswordReset(
    phone: string,
    requiredRole?: UserRole,
  ): Promise<{ expiresIn: number }> {
    if (requiredRole) {
      await this.requirePortalUser(phone, requiredRole);
    } else {
      const user = await this.usersService.findDocumentByPhone(phone);

      if (!user) {
        throw new AppError(404, "USER_NOT_FOUND", "User not found");
      }
    }

    const { result, code } = await this.otpService.request(phone, "reset");
    await this.smsProvider.sendOtp(phone, code, "reset");
    return result;
  }

  async confirmPasswordReset(
    phone: string,
    code: string,
    password: string,
    requiredRole?: UserRole,
  ): Promise<ClientAuthResult> {
    if (requiredRole) {
      await this.requirePortalUser(phone, requiredRole);
    }

    await this.otpService.consume(phone, code, "reset");
    const user = await this.usersService.resetPassword(phone, password);

    if (requiredRole) {
      this.assertRole(user, requiredRole);
    }

    return this.toClientAuth(await this.issueAuth(user));
  }

  async refreshAuth(
    refreshToken: string,
    requiredRole?: UserRole,
  ): Promise<ClientAuthResult> {
    let payload;

    try {
      payload = this.tokenService.verify(refreshToken, "refresh");
    } catch {
      throw new AppError(
        401,
        "UNAUTHORIZED",
        "Invalid or expired refresh token",
      );
    }

    const user = await this.usersService.findById(payload.sub);

    if (requiredRole) {
      this.assertRole(user, requiredRole);
    }

    const tokens = this.tokenService.signTokenPair({
      id: user.id,
      phone: user.phone,
      roles: user.roles,
    });
    const rotated = await this.sessions.replaceRefreshSession(
      user.id,
      payload.jti,
      tokens.refreshJti,
      tokens.refreshExpiresIn,
    );

    if (!rotated) {
      throw new AppError(
        401,
        "UNAUTHORIZED",
        "Invalid or expired refresh token",
      );
    }

    return this.toClientAuth({
      ...tokens,
      user,
    });
  }

  async logoutUser(userId: string): Promise<{ success: true }> {
    await this.sessions.revokeUserSessions(userId);
    return { success: true };
  }

  async deleteAccount(userId: string): Promise<{ success: true }> {
    await this.sessions.revokeUserSessions(userId);
    await this.usersService.deleteAccount(userId);
    return { success: true };
  }

  getMe(userId: string): Promise<PublicUser> {
    return this.usersService.findById(userId);
  }

  getProfileChoices() {
    return {
      genders: [
        { value: "female", label: "زن" },
        { value: "male", label: "مرد" },
        {
          value: "other",
          label: "سایر",
          description: "هویت جنسیتی خود را بنویسید",
          requiresDescription: true,
        },
      ] satisfies Array<{
        value: UserGender;
        label: string;
        description?: string;
        requiresDescription?: boolean;
      }>,
      activityLevels: [
        {
          value: "very-active",
          label: "بسیار فعال",
          description: "هر روز ورزش می‌کنم",
        },
        {
          value: "normal",
          label: "معمولی",
          description: "هفته‌ای یک یا دو بار ورزش می‌کنم",
        },
        {
          value: "very-lazy",
          label: "کم‌تحرک",
          description: "به‌ندرت ورزش می‌کنم",
        },
      ] satisfies Array<{
        value: UserActivityLevel;
        label: string;
        description: string;
      }>,
    };
  }

  updateProfile(
    userId: string,
    profile: {
      firstName?: string;
      lastName?: string;
      birthdate?: string;
      gender?: UserGender;
      genderDescription?: string;
      activityLevel?: UserActivityLevel;
      idCard?: string;
      avatarUrl?: string;
    },
  ): Promise<PublicUser> {
    return this.usersService.updateProfile(userId, profile);
  }

  async verifyIdCard(phone: string, idCard: string): Promise<{ match: true }> {
    const match = await this.verifyIdCardWithApiIr(phone, idCard);
    if (!match) {
      throw new AppError(
        400,
        "ID_CARD_MISMATCH",
        "National ID does not match the provided phone number",
      );
    }
    return { match: true };
  }

  private async verifyIdCardWithApiIr(
    phone: string,
    idCard: string,
  ): Promise<boolean> {
    const apiKey = this.config.env.APIIR_KEY;
    if (!apiKey) {
      throw new AppError(
        500,
        "ID_CARD_VERIFICATION_KEY_MISSING",
        "APIIR_KEY is missing",
      );
    }

    let response: Response;
    const normalizedApiKey = apiKey.startsWith("Bearer ")
      ? apiKey.slice(7).trim()
      : apiKey;

    try {
      response = await fetch("https://s.api.ir/api/sw1/Shahkar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${normalizedApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nationalCode: idCard,
          mobile: toLocalIranianPhone(phone),
        }),
      });
    } catch {
      throw new AppError(
        502,
        "ID_CARD_VERIFICATION_FAILED",
        "ID card verification request failed",
      );
    }

    const payload: {
      success?: boolean;
      data?: unknown;
      message?: string;
      code?: string;
    } = await response.json().catch(() => {
      throw new AppError(
        502,
        "ID_CARD_VERIFICATION_FAILED",
        "Invalid response from verification service",
      );
    });

    if (!response.ok || payload.success !== true) {
      throw new AppError(
        502,
        "ID_CARD_VERIFICATION_FAILED",
        String(
          payload.message ?? payload.code ?? "ID card verification failed",
        ),
      );
    }

    if (typeof payload.data !== "boolean") {
      throw new AppError(
        502,
        "ID_CARD_VERIFICATION_FAILED",
        "Verification service returned unexpected data",
      );
    }

    return payload.data;
  }

  private async requirePortalUser(
    phone: string,
    role: UserRole,
  ): Promise<PublicUser> {
    const user = await this.usersService.requireByPhone(phone);
    this.assertRole(user, role);
    return user;
  }

  private assertRole(user: PublicUser, role: UserRole): void {
    if (!user.roles.includes(role)) {
      throw new AppError(403, "FORBIDDEN", "Access denied");
    }
  }

  private async issueAuth(user: PublicUser): Promise<AuthResult> {
    const tokens = this.tokenService.signTokenPair({
      id: user.id,
      phone: user.phone,
      roles: user.roles,
    });

    await this.sessions.storeRefreshSession(
      user.id,
      tokens.refreshJti,
      tokens.refreshExpiresIn,
    );

    return {
      ...tokens,
      user,
    };
  }

  private toClientAuth(result: AuthResult): ClientAuthResult {
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.accessExpiresIn,
      user: result.user,
    };
  }
}
