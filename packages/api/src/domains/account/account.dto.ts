export type UserRole = "athlete" | "coach" | "admin" | "owner";

export type RequestableRole = "coach" | "owner";

export type RoleRequestStatus = "pending" | "approved" | "rejected";

export type RoleRequestDetails = {
  displayName: string;
  city: string;
  experienceYears?: number;
  specialty?: string;
  credentials?: string;
  businessName?: string;
  businessType?: string;
  description: string;
};

export type RequestRolePayload = {
  details: RoleRequestDetails;
};

export type AccountGender = "female" | "male" | "other";

export type AccountActivityLevel = "very-active" | "normal" | "very-lazy";

export type AccountProfileChoice<T extends string> = {
  value: T;
  label: string;
  description?: string;
  requiresDescription?: boolean;
};

export type AccountProfileChoicesResponse = {
  genders: AccountProfileChoice<AccountGender>[];
  activityLevels: AccountProfileChoice<AccountActivityLevel>[];
};

export type AccountRoleRequest = {
  id: string;
  userId: string;
  phone: string;
  role: RequestableRole;
  details: RoleRequestDetails;
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
  gender?: AccountGender;
  genderDescription?: string;
  activityLevel?: AccountActivityLevel;
  idCard?: string;
  avatarUrl?: string;
  roles: UserRole[];
  hasPassword: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UpdateAccountMePayload = {
  firstName?: string;
  lastName?: string;
  birthdate?: string;
  gender?: AccountGender;
  genderDescription?: string;
  activityLevel?: AccountActivityLevel;
  idCard?: string;
  avatarUrl?: string;
};

export type VerifyIdCardPayload = {
  idCard: string;
};

export type VerifyIdCardResponse = {
  match: true;
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
export type PrivacyPurpose = "analytics" | "precise_location" | "training_results" | "marketing";
export type AccountPrivacyResponse = {
  policyVersion: string;
  purposes: Array<{ id: PrivacyPurpose; required: boolean; label: string }>;
  items: Array<{ purpose: PrivacyPurpose; version: string; granted: boolean; decidedAt: string }>;
};
