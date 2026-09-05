import type { RequestableRole } from "@api/account";
import type { IconName } from "@theme/icon";
import type { ApplicationRole } from "@/lib/post-auth-path";

export type AccountAuthRolesOptionsSectionProps = {
  athleteLabel: string;
  coachLabel: string;
  ownerLabel: string;
  availableRoles?: ApplicationRole[];
  onSelectRole: (role: ApplicationRole) => void;
};

export type AccountAuthRoleOption = {
  id: "athlete" | RequestableRole;
  label: string;
  icon: IconName;
  tone: "athlete" | "coach" | "owner";
};
