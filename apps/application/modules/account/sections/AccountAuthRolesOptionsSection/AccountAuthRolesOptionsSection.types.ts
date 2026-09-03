import type { RequestableRole } from "@api/account";
import type { IconName } from "@theme/icon";

export type AccountAuthRolesOptionsSectionProps = {
  athleteLabel: string;
  coachLabel: string;
  ownerLabel: string;
  onAthlete: () => void;
};

export type AccountAuthRoleOption = {
  id: "athlete" | RequestableRole;
  label: string;
  icon: IconName;
  tone: "athlete" | "coach" | "owner";
};
