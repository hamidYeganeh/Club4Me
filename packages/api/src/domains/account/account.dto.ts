export type UserRole = "athlete" | "coach" | "admin" | "owner";

export type RequestableRole = "coach" | "owner";

export type RoleRequestStatus = "pending" | "approved" | "rejected";

export type AccountRoleRequest = {
  id: string;
  userId: string;
  phone: string;
  role: RequestableRole;
  status: RoleRequestStatus;
  createdAt: string;
  updatedAt: string;
};

export type RequestRoleResponse = AccountRoleRequest;

export type ListRoleRequestsResponse = {
  items: AccountRoleRequest[];
};

export type ReviewRoleRequestPayload = {
  status: Exclude<RoleRequestStatus, "pending">;
};

export type ReviewRoleRequestResponse = AccountRoleRequest;

export type AccountUser = {
  id: string;
  phone: string;
  firstName?: string;
  lastName?: string;
  birthdate?: string;
  roles: UserRole[];
  hasPassword: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RequestOtpPayload = {
  phone: string;
};

export type RequestOtpResponse = {
  expiresIn: number;
};

export type ConfirmOtpPayload = {
  phone: string;
  code: string;
};

export type AuthSessionResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AccountUser;
};

export type ConfirmOtpResponse = AuthSessionResponse;

export type LoginPayload = {
  phone: string;
  password: string;
};

export type LoginResponse = AuthSessionResponse;

export type SetPasswordPayload = {
  password: string;
  currentPassword?: string;
};

export type SetPasswordResponse = AccountUser;

export type ForgotPasswordPayload = {
  phone: string;
};

export type ForgotPasswordResponse = {
  expiresIn: number;
};

export type ConfirmForgotPasswordPayload = {
  phone: string;
  code: string;
  password: string;
};

export type ConfirmForgotPasswordResponse = AuthSessionResponse;

export type RefreshSessionPayload = {
  refreshToken: string;
};

export type RefreshSessionResponse = AuthSessionResponse;

export type LogoutResponse = {
  success: true;
};

export type AccountMeResponse = AccountUser;
