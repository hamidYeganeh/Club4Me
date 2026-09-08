import type { AccountUser, UserRole } from "@api/account";

export const SET_PASSWORD_PATH = "/auth/set-password";
export const ROLES_PATH = "/auth/roles";
export const FIRST_TIME_ROLES_PATH = `${ROLES_PATH}?firstTime=1`;

export type ApplicationRole = Extract<UserRole, "athlete" | "coach" | "owner">;

export function getApplicationRoles(roles: UserRole[]): ApplicationRole[] {
  return roles.filter(
    (role): role is ApplicationRole =>
      role === "athlete" || role === "coach" || role === "owner",
  );
}

export function getRolePath(role: ApplicationRole): string {
  if (role === "coach") {
    return "/coach";
  }

  if (role === "owner") {
    return process.env.NEXT_PUBLIC_BUSINESS_URL ?? "http://localhost:7083";
  }

  return "/athlete";
}

export function getPostAuthPath(
  user: Pick<AccountUser, "hasPassword" | "roles">,
): string {
  if (!user.hasPassword && !user.roles.includes("athlete")) {
    return SET_PASSWORD_PATH;
  }

  const roles = getApplicationRoles(user.roles);
  return roles.length === 1 ? getRolePath(roles[0]) : ROLES_PATH;
}
