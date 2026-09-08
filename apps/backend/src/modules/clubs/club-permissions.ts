export const CLUB_PERMISSIONS = [
  "club.read",
  "reception.read",
  "reservations.checkin",
  "students.read",
  "students.write",
  "coaches.read",
  "coaches.write",
  "classes.read",
  "classes.write",
  "enrollments.read",
  "enrollments.write",
  "attendance.read",
  "attendance.write",
  "payments.read",
  "payments.write",
  "reservations.read",
  "reservations.write",
  "courts.read",
  "courts.write",
  "memberships.read",
  "memberships.write",
  "branches.read",
  "branches.write",
  "reports.read",
] as const;
export type ClubPermission = (typeof CLUB_PERMISSIONS)[number];
export type StaffRole = "manager" | "receptionist" | "finance" | "coach";
export const STAFF_PERMISSIONS: Record<StaffRole, readonly ClubPermission[]> = {
  manager: CLUB_PERMISSIONS,
  receptionist: [
    "club.read",
    "reception.read",
    "reservations.checkin",
    "students.read",
    "students.write",
    "coaches.read",
    "classes.read",
    "enrollments.read",
    "enrollments.write",
    "attendance.read",
    "attendance.write",
    "reservations.read",
    "courts.read",
    "memberships.read",
  ],
  finance: [
    "club.read",
    "students.read",
    "payments.read",
    "payments.write",
    "memberships.read",
  ],
  coach: [
    "club.read",
    "classes.read",
    "enrollments.read",
    "attendance.read",
    "attendance.write",
  ],
};
export function effectiveClubPermissions(
  role: string,
  permissions: string[] = [],
): ClubPermission[] {
  const allowed = STAFF_PERMISSIONS[role as StaffRole] ?? [];
  // Empty means the documented role defaults. Custom grants can only reduce that role.
  return allowed.filter(
    (permission) => !permissions.length || permissions.includes(permission),
  );
}
