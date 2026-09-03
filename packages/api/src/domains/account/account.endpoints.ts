export const accountEndpoints = {
  requestOtp: "/account/auth/otp",
  confirmOtp: "/account/auth/otp/confirm",
  login: "/account/auth/login",
  setPassword: "/account/auth/set-password",
  forgotPassword: "/account/auth/forgot-password",
  confirmForgotPassword: "/account/auth/forgot-password/confirm",
  refresh: "/account/auth/refresh",
  logout: "/account/auth/logout",
  me: "/account/me",
} as const;
