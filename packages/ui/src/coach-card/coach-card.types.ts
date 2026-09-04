import type { IconName } from "@repo/theme/icon";

export type CoachCardType = "compact" | "normal";

export type CoachCardStat = {
  id?: string;
  label: string;
  icon?: IconName;
};

export type CoachCardProps = {
  type?: CoachCardType;
  title: string;
  imageUrl?: string | null;
  imageAlt?: string;
  badge?: string;
  href?: string;
  actionAriaLabel?: string;
  onActionPress?: () => void;
  supportingText?: string;
  rating?: number;
  reviewsCount?: number;
  stats?: CoachCardStat[];
  meta?: string[];
  authorName?: string;
  authorAvatarUrl?: string | null;
  className?: string;
};
