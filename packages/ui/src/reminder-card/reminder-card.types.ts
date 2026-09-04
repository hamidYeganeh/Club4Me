import type { IconName } from "@repo/theme/icon";

export type ReminderCardProps = {
  date: string;
  time: string;
  joinedCount: number;
  interestedCount: number;
  joinedLabel?: string;
  interestedLabel?: string;
  icon?: IconName;
  href?: string;
  onPress?: () => void;
  className?: string;
};
