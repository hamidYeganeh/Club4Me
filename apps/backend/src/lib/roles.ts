export const USER_ROLES = ["athlete", "coach", "admin", "owner"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const REQUESTABLE_ROLES = ["coach", "owner"] as const;

export type RequestableRole = (typeof REQUESTABLE_ROLES)[number];

export function isUserRole(value: string): value is UserRole {
  return (USER_ROLES as readonly string[]).includes(value);
}

export function isRequestableRole(value: string): value is RequestableRole {
  return (REQUESTABLE_ROLES as readonly string[]).includes(value);
}
