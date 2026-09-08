import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { Model } from "mongoose";

import { AppError } from "../../common/errors/app.exception";
import { AppConfigService } from "../../config/app-config.service";
import { RedisService } from "../../infrastructure/redis/redis.service";
import { AuthService } from "./auth.service";
import {
  SocialIdentity,
  type SocialIdentityDocument,
  type SocialProvider,
} from "./schemas/social-identity.schema";

type SocialProfile = {
  provider: SocialProvider;
  subject: string;
  email?: string;
  displayName?: string;
  returnTo: string;
};

@Injectable()
export class SocialAuthService {
  constructor(
    @InjectModel(SocialIdentity.name)
    private readonly identities: Model<SocialIdentityDocument>,
    private readonly config: AppConfigService,
    private readonly redis: RedisService,
    private readonly auth: AuthService,
  ) {}

  providers() {
    return {
      items: (["google", "facebook", "x"] as const).map((id) => ({
        id,
        enabled: Boolean(this.credentials(id)),
      })),
    };
  }

  async start(provider: SocialProvider, returnTo: string) {
    const credentials = this.credentials(provider);
    if (!credentials)
      throw new AppError(
        503,
        "SOCIAL_PROVIDER_UNAVAILABLE",
        "ورود با این سرویس پیکربندی نشده است",
      );
    const state = randomUUID();
    const verifier = randomBytes(48).toString("base64url");
    const challenge = createHash("sha256").update(verifier).digest("base64url");
    await this.redis.set(
      `social:state:${state}`,
      JSON.stringify({ provider, verifier, returnTo }),
      "EX",
      600,
    );
    const url = new URL(credentials.authorizeUrl);
    url.searchParams.set("client_id", credentials.clientId);
    url.searchParams.set("redirect_uri", this.callbackUrl(provider));
    url.searchParams.set("response_type", "code");
    url.searchParams.set("state", state);
    url.searchParams.set("scope", credentials.scope);
    if (provider !== "facebook") {
      url.searchParams.set("code_challenge", challenge);
      url.searchParams.set("code_challenge_method", "S256");
    }
    return { url: url.toString() };
  }

  async callback(provider: SocialProvider, state: string, code: string) {
    const key = `social:state:${state}`;
    const raw = await this.redis.get(key);
    await this.redis.del(key);
    if (!raw)
      throw new AppError(
        400,
        "SOCIAL_STATE_EXPIRED",
        "درخواست ورود منقضی یا قبلاً استفاده شده است",
      );
    const saved = JSON.parse(raw) as {
      provider: SocialProvider;
      verifier: string;
      returnTo: string;
    };
    if (saved.provider !== provider)
      throw new AppError(400, "SOCIAL_STATE_MISMATCH", "پاسخ ورود معتبر نیست");
    const profile = await this.fetchProfile(
      provider,
      code,
      saved.verifier,
      saved.returnTo,
    );
    const ticket = randomUUID();
    await this.redis.set(
      `social:ticket:${ticket}`,
      JSON.stringify(profile),
      "EX",
      300,
    );
    const redirect = new URL(this.config.env.SOCIAL_APP_CALLBACK_URL);
    redirect.searchParams.set("ticket", ticket);
    redirect.searchParams.set("returnTo", saved.returnTo);
    return redirect.toString();
  }

  async exchange(ticket: string) {
    const profile = await this.consumeProfile(`social:ticket:${ticket}`);
    const identity = await this.identities
      .findOne({ provider: profile.provider, subject: profile.subject })
      .select("+subject");
    if (identity) {
      identity.lastLoginAt = new Date();
      await identity.save();
      return {
        linked: true as const,
        session: await this.auth.loginUserById(String(identity.userId)),
        returnTo: profile.returnTo,
      };
    }
    const linkToken = randomUUID();
    await this.redis.set(
      `social:link:${linkToken}`,
      JSON.stringify(profile),
      "EX",
      600,
    );
    return {
      linked: false as const,
      linkToken,
      profile: {
        provider: profile.provider,
        email: profile.email,
        displayName: profile.displayName,
      },
      returnTo: profile.returnTo,
    };
  }

  async requestLinkOtp(linkToken: string, phone: string) {
    if (!(await this.redis.get(`social:link:${linkToken}`)))
      throw new AppError(
        410,
        "SOCIAL_LINK_EXPIRED",
        "مهلت اتصال حساب تمام شده است",
      );
    return this.auth.requestLoginOtp(phone);
  }

  async confirmLink(linkToken: string, phone: string, code: string) {
    const raw = await this.redis.get(`social:link:${linkToken}`);
    if (!raw)
      throw new AppError(
        410,
        "SOCIAL_LINK_EXPIRED",
        "مهلت اتصال حساب تمام شده است",
      );
    const profile = JSON.parse(raw) as SocialProfile;
    const session = await this.auth.confirmLoginOtp(phone, code);
    const conflict = await this.identities.exists({
      userId: session.user.id,
      provider: profile.provider,
    });
    if (conflict)
      throw new AppError(
        409,
        "SOCIAL_PROVIDER_ALREADY_LINKED",
        "این حساب قبلاً به شناسه دیگری از همین سرویس متصل شده است",
      );
    await this.identities.create({
      userId: session.user.id,
      provider: profile.provider,
      subject: profile.subject,
      email: profile.email ?? null,
      displayName: profile.displayName ?? "",
      lastLoginAt: new Date(),
    });
    await this.redis.del(`social:link:${linkToken}`);
    return { session, returnTo: profile.returnTo };
  }

  private async consumeProfile(key: string): Promise<SocialProfile> {
    const raw = await this.redis.get(key);
    await this.redis.del(key);
    if (!raw)
      throw new AppError(
        410,
        "SOCIAL_TICKET_EXPIRED",
        "مهلت ورود اجتماعی تمام شده است",
      );
    return JSON.parse(raw) as SocialProfile;
  }

  private callbackUrl(provider: SocialProvider) {
    return `${this.config.env.SOCIAL_CALLBACK_BASE_URL.replace(/\/$/, "")}/api/v1/account/auth/social/${provider}/callback`;
  }

  private credentials(provider: SocialProvider) {
    const env = this.config.env;
    const values =
      provider === "google"
        ? [
            env.GOOGLE_OAUTH_CLIENT_ID,
            env.GOOGLE_OAUTH_CLIENT_SECRET,
            "https://accounts.google.com/o/oauth2/v2/auth",
            "https://oauth2.googleapis.com/token",
            "openid email profile",
          ]
        : provider === "facebook"
          ? [
              env.FACEBOOK_OAUTH_CLIENT_ID,
              env.FACEBOOK_OAUTH_CLIENT_SECRET,
              "https://www.facebook.com/v23.0/dialog/oauth",
              "https://graph.facebook.com/v23.0/oauth/access_token",
              "email,public_profile",
            ]
          : [
              env.X_OAUTH_CLIENT_ID,
              env.X_OAUTH_CLIENT_SECRET,
              "https://twitter.com/i/oauth2/authorize",
              "https://api.x.com/2/oauth2/token",
              "users.read tweet.read offline.access",
            ];
    if (!values[0] || !values[1]) return null;
    return {
      clientId: values[0],
      clientSecret: values[1],
      authorizeUrl: values[2]!,
      tokenUrl: values[3]!,
      scope: values[4]!,
    };
  }

  private async fetchProfile(
    provider: SocialProvider,
    code: string,
    verifier: string,
    returnTo: string,
  ): Promise<SocialProfile> {
    const credentials = this.credentials(provider)!;
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: this.callbackUrl(provider),
      client_id: credentials.clientId,
    });
    if (provider !== "x") body.set("client_secret", credentials.clientSecret);
    if (provider !== "facebook") body.set("code_verifier", verifier);
    const headers: Record<string, string> = {
      "content-type": "application/x-www-form-urlencoded",
    };
    if (provider === "x")
      headers.Authorization = `Basic ${Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString("base64")}`;
    const tokenResponse = await fetch(credentials.tokenUrl, {
      method: "POST",
      headers,
      body,
    });
    const token = (await tokenResponse.json()) as { access_token?: string };
    if (!tokenResponse.ok || !token.access_token)
      throw new AppError(
        502,
        "SOCIAL_TOKEN_FAILED",
        "دریافت مجوز از سرویس ورود انجام نشد",
      );
    const profileUrl =
      provider === "google"
        ? "https://openidconnect.googleapis.com/v1/userinfo"
        : provider === "facebook"
          ? "https://graph.facebook.com/me?fields=id,name,email"
          : "https://api.x.com/2/users/me?user.fields=name";
    const response = await fetch(profileUrl, {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    const raw = (await response.json()) as Record<string, unknown>;
    const data =
      provider === "x" && raw.data && typeof raw.data === "object"
        ? (raw.data as Record<string, unknown>)
        : raw;
    const subject = String(data.sub ?? data.id ?? "");
    if (!response.ok || !subject)
      throw new AppError(
        502,
        "SOCIAL_PROFILE_FAILED",
        "دریافت پروفایل ورود انجام نشد",
      );
    return {
      provider,
      subject,
      email: typeof data.email === "string" ? data.email : undefined,
      displayName: typeof data.name === "string" ? data.name : undefined,
      returnTo,
    };
  }
}
