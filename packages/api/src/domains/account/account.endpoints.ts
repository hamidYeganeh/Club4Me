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
  profileChoices: "/account/me/choices",
  updateMe: "/account/me",
  deleteAccount: "/account",
  role: (role: "coach" | "owner") => `/account/roles/${role}` as const,
  adminRoleRequests: "/admin/role-requests",
  adminRoleRequest: (requestId: string) =>
    `/admin/role-requests/${requestId}` as const,
} as const;
