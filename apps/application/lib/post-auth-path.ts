export const SET_PASSWORD_PATH = "/auth/set-password";
export const ROLES_PATH = "/auth/roles";

export function getPostAuthPath(user: { hasPassword: boolean }): string {
  return user.hasPassword ? ROLES_PATH : SET_PASSWORD_PATH;
}
