import type { IconName } from "@theme/icon";
import type { ReactNode } from "react";

import type { ProfileEditField } from "../../profile.types";

export type ProfileEditGeneralSectionProps = Record<string, never>;

export type ProfileEditFieldRowProps = {
  onPress: () => void;
  label: string;
  value: string | null;
  emptyLabel: string;
  prefixIcon?: IconName;
  suffix?: ReactNode;
  valueDir?: "ltr" | "rtl";
  field: ProfileEditField;
};
