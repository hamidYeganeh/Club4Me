import { Hono } from "hono";
import { z } from "zod";

import { ok } from "../../lib/http.js";
import { iranianPhone } from "../../lib/phone.js";
import { parse } from "../../lib/validate.js";
import { getAuthUser, requireAuth } from "../../middleware/auth.js";
import {
  confirmLoginOtp,
  confirmPasswordReset,
  loginWithPassword,
  logoutUser,
  refreshAuth,
  requestLoginOtp,
  requestPasswordReset,
  setPassword,
} from "../../services/auth.js";
import { findUserById } from "../../services/users.js";
import type { AppEnv } from "../../types.js";

const otpCode = z.string().regex(/^\d{5}$/, "OTP must be 5 digits");
const password = z.string().min(8, "Password must be at least 8 characters").max(128);

const requestOtpBody = z.object({
  phone: iranianPhone,
});

const confirmOtpBody = z.object({
  phone: iranianPhone,
  code: otpCode,
});

const loginBody = z.object({
  phone: iranianPhone,
  password,
});

const setPasswordBody = z.object({
  password,
  currentPassword: z.string().min(1).max(128).optional(),
});

const forgotPasswordBody = z.object({
  phone: iranianPhone,
});

const confirmForgotPasswordBody = z.object({
  phone: iranianPhone,
  code: otpCode,
  password,
});

const refreshBody = z.object({
  refreshToken: z.string().min(1),
});

function aliasPhoneFields(input: unknown): unknown {
  if (typeof input !== "object" || input === null) {
    return input;
  }

  const body = { ...(input as Record<string, unknown>) };

  if (body.phone === undefined && typeof body.phone_number === "string") {
    body.phone = body.phone_number;
  }

  if (body.code === undefined && typeof body.otp === "string") {
    body.code = body.otp;
  }

  if (body.refreshToken === undefined && typeof body.refresh_token === "string") {
    body.refreshToken = body.refresh_token;
  }

  if (
    body.currentPassword === undefined &&
    typeof body.current_password === "string"
  ) {
    body.currentPassword = body.current_password;
  }

  return body;
}

export function createAccountRouter() {
  const account = new Hono<AppEnv>();
  const auth = new Hono<AppEnv>();

  auth.post("/otp", async (c) => {
    const body = parse(requestOtpBody, aliasPhoneFields(await c.req.json()));
    const result = await requestLoginOtp(c.get("env"), body.phone);

    return ok(c, result, 201);
  });

  auth.post("/otp/confirm", async (c) => {
    const body = parse(confirmOtpBody, aliasPhoneFields(await c.req.json()));
    const result = await confirmLoginOtp(c.get("env"), body.phone, body.code);

    return ok(c, result);
  });

  auth.post("/login", async (c) => {
    const body = parse(loginBody, aliasPhoneFields(await c.req.json()));
    const result = await loginWithPassword(
      c.get("env"),
      body.phone,
      body.password,
    );

    return ok(c, result);
  });

  auth.post("/set-password", requireAuth, async (c) => {
    const authUser = getAuthUser(c);
    const body = parse(setPasswordBody, aliasPhoneFields(await c.req.json()));
    const user = await setPassword(
      authUser.sub,
      body.password,
      body.currentPassword,
    );

    return ok(c, user);
  });

  auth.post("/forgot-password", async (c) => {
    const body = parse(forgotPasswordBody, aliasPhoneFields(await c.req.json()));
    const result = await requestPasswordReset(c.get("env"), body.phone);

    return ok(c, result);
  });

  auth.post("/forgot-password/confirm", async (c) => {
    const body = parse(
      confirmForgotPasswordBody,
      aliasPhoneFields(await c.req.json()),
    );
    const result = await confirmPasswordReset(
      c.get("env"),
      body.phone,
      body.code,
      body.password,
    );

    return ok(c, result);
  });

  auth.post("/refresh", async (c) => {
    const body = parse(refreshBody, aliasPhoneFields(await c.req.json()));
    const result = await refreshAuth(c.get("env"), body.refreshToken);

    return ok(c, result);
  });

  auth.post("/logout", requireAuth, async (c) => {
    const authUser = getAuthUser(c);
    const result = await logoutUser(authUser.sub);

    return ok(c, result);
  });

  account.route("/auth", auth);

  account.get("/me", requireAuth, async (c) => {
    const authUser = getAuthUser(c);
    const user = await findUserById(authUser.sub);

    return ok(c, user);
  });

  return account;
}
