import { http } from "../../http/client";
import { accountEndpoints } from "./account.endpoints";
import type {
  AccountMeResponse,
  AccountProfileChoicesResponse,
  ListRoleRequestsResponse,
  RequestableRole,
  RequestRolePayload,
  RequestRoleResponse,
  ReviewRoleRequestPayload,
  ReviewRoleRequestResponse,
  ConfirmForgotPasswordPayload,
  ConfirmForgotPasswordResponse,
  ConfirmOtpPayload,
  ConfirmOtpResponse,
  ForgotPasswordPayload,
  ForgotPasswordResponse,
  LoginPayload,
  LoginResponse,
  LogoutResponse,
  RefreshSessionPayload,
  RefreshSessionResponse,
  RequestOtpPayload,
  RequestOtpResponse,
  VerifyIdCardPayload,
  VerifyIdCardResponse,
  SetPasswordPayload,
  SetPasswordResponse,
  UpdateAccountMePayload,
  AccountPrivacyResponse,
  PrivacyPurpose,
} from "./account.dto";

export const accountClient = {
  requestOtp: (payload: RequestOtpPayload) =>
    http.post<RequestOtpResponse>(accountEndpoints.requestOtp, payload),

  confirmOtp: (payload: ConfirmOtpPayload) =>
    http.post<ConfirmOtpResponse>(accountEndpoints.confirmOtp, payload),

  login: (payload: LoginPayload) =>
    http.post<LoginResponse>(accountEndpoints.login, payload),

  setPassword: (payload: SetPasswordPayload) =>
    http.post<SetPasswordResponse>(accountEndpoints.setPassword, payload),

  forgotPassword: (payload: ForgotPasswordPayload) =>
    http.post<ForgotPasswordResponse>(accountEndpoints.forgotPassword, payload),

  confirmForgotPassword: (payload: ConfirmForgotPasswordPayload) =>
    http.post<ConfirmForgotPasswordResponse>(
      accountEndpoints.confirmForgotPassword,
      payload,
    ),

  refresh: (payload: RefreshSessionPayload) =>
    http.post<RefreshSessionResponse>(accountEndpoints.refresh, payload),

  logout: () => http.post<LogoutResponse>(accountEndpoints.logout),

  me: () => http.get<AccountMeResponse>(accountEndpoints.me),

  profileChoices: () =>
    http.get<AccountProfileChoicesResponse>(accountEndpoints.profileChoices),

  updateMe: (payload: UpdateAccountMePayload) =>
    http.patch<AccountMeResponse>(accountEndpoints.updateMe, payload),

  verifyIdCard: (payload: VerifyIdCardPayload) =>
    http.post<VerifyIdCardResponse>(accountEndpoints.verifyIdCard, payload),

  deleteAccount: () =>
    http.delete<{ success: true }>(accountEndpoints.deleteAccount, {
      confirmation: "DELETE",
    }),

  privacy: () => http.get<AccountPrivacyResponse>(accountEndpoints.privacy),
  updateConsent: (payload: { purpose: PrivacyPurpose; granted: boolean; version: string }) =>
    http.put(accountEndpoints.privacyConsent, payload),

  requestRole: (role: RequestableRole, payload: RequestRolePayload) =>
    http.post<RequestRoleResponse>(accountEndpoints.role(role), payload),

  myRoleRequests: () =>
    http.get<ListRoleRequestsResponse>(accountEndpoints.myRoleRequests),

  listRoleRequests: () =>
    http.get<ListRoleRequestsResponse>(accountEndpoints.adminRoleRequests),

  reviewRoleRequest: (requestId: string, payload: ReviewRoleRequestPayload) =>
    http.patch<ReviewRoleRequestResponse>(
      accountEndpoints.adminRoleRequest(requestId),
      payload,
    ),
};
