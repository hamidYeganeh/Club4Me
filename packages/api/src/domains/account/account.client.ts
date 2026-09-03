import { http } from "../../http/client";
import { accountEndpoints } from "./account.endpoints";
import type {
  AccountMeResponse,
  ListRoleRequestsResponse,
  RequestableRole,
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
  SetPasswordPayload,
  SetPasswordResponse,
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

  requestRole: (role: RequestableRole) =>
    http.post<RequestRoleResponse>(accountEndpoints.role(role)),

  listRoleRequests: () =>
    http.get<ListRoleRequestsResponse>(accountEndpoints.adminRoleRequests),

  reviewRoleRequest: (requestId: string, payload: ReviewRoleRequestPayload) =>
    http.patch<ReviewRoleRequestResponse>(
      accountEndpoints.adminRoleRequest(requestId),
      payload,
    ),
};
