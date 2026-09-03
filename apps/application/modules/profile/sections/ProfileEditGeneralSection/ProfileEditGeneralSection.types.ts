import type { IconName } from "@theme/icon";
import type { ReactNode } from "react";

import type { ProfileEditField, ProfileRole } from "../../profile.types";

export type ProfileEditGeneralSectionProps = {
  role: ProfileRole;
};

export type ProfileEditFieldRowProps = {
  href: string;
  label: string;
  value: string | null;
  emptyLabel: string;
  prefixIcon?: IconName;
  suffix?: ReactNode;
  valueDir?: "ltr" | "rtl";
  field: ProfileEditField;
};
