import type { Env } from "../config/env.js";
import { AppError } from "../lib/errors.js";
import { signTokenPair, verifyToken, type TokenPair } from "../lib/jwt.js";
import type { PublicUser } from "./users.js";
import { consumeOtp, requestOtp } from "./otp.js";
import {
  replaceRefreshSession,
  revokeUserSessions,
  storeRefreshSession,
} from "./sessions.js";
import { sendOtpSms } from "./sms.js";
import {
  authenticateWithPassword,
  findOrCreateUserByPhone,
  findUserById,
  findUserDocumentByPhone,
  resetUserPassword,
  setUserPassword,
} from "./users.js";

export type AuthResult = TokenPair & {
  user: PublicUser;
};

async function issueAuth(env: Env, user: PublicUser): Promise<AuthResult> {
  const tokens = signTokenPair(env, {
    id: user.id,
    phone: user.phone,
    roles: user.roles,
  });

  await storeRefreshSession(user.id, tokens.refreshJti, tokens.refreshExpiresIn);

  return {
    ...tokens,
    user,
  };
}

function toClientAuth(result: AuthResult) {
  return {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    expiresIn: result.accessExpiresIn,
    user: result.user,
  };
}

export async function requestLoginOtp(env: Env, phone: string) {
  await findOrCreateUserByPhone(phone);
  const { result, code } = await requestOtp(phone, "login");
  await sendOtpSms(env, phone, code, "otp");
  return result;
}

export async function confirmLoginOtp(env: Env, phone: string, code: string) {
  await consumeOtp(phone, code, "login");
  const user = await findOrCreateUserByPhone(phone);
  return toClientAuth(await issueAuth(env, user));
}

export async function loginWithPassword(
  env: Env,
  phone: string,
  password: string,
) {
  const user = await authenticateWithPassword(phone, password);
  return toClientAuth(await issueAuth(env, user));
}

export async function setPassword(
  userId: string,
  password: string,
  currentPassword?: string,
) {
  return setUserPassword(userId, password, currentPassword);
}

export async function requestPasswordReset(env: Env, phone: string) {
  const user = await findUserDocumentByPhone(phone);

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found");
  }

  const { result, code } = await requestOtp(phone, "reset");
  await sendOtpSms(env, phone, code, "reset");
  return result;
}

export async function confirmPasswordReset(
  env: Env,
  phone: string,
  code: string,
  password: string,
) {
  await consumeOtp(phone, code, "reset");
  const user = await resetUserPassword(phone, password);
  return toClientAuth(await issueAuth(env, user));
}

export async function refreshAuth(env: Env, refreshToken: string) {
  let payload;

  try {
    payload = verifyToken(env, refreshToken, "refresh");
  } catch {
    throw new AppError(401, "UNAUTHORIZED", "Invalid or expired refresh token");
  }

  const user = await findUserById(payload.sub);
  const tokens = signTokenPair(env, {
    id: user.id,
    phone: user.phone,
    roles: user.roles,
  });
  const rotated = await replaceRefreshSession(
    user.id,
    payload.jti,
    tokens.refreshJti,
    tokens.refreshExpiresIn,
  );

  if (!rotated) {
    throw new AppError(401, "UNAUTHORIZED", "Invalid or expired refresh token");
  }

  return toClientAuth({
    ...tokens,
    user,
  });
}

export async function logoutUser(userId: string): Promise<{ success: true }> {
  await revokeUserSessions(userId);
  return { success: true };
}
