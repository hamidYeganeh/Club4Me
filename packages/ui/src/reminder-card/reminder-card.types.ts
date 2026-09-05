import type { IconName } from "@repo/theme/icon";

export type ReminderCardProps = {
  date: string;
  time: string;
  meta: string;
  icon?: IconName;
  href?: string;
  onPress?: () => void;
  className?: string;
};
