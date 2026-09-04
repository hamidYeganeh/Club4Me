import type { IconName } from "@repo/theme/icon";

export type ClubCardVariant = "compact" | "editorial";

export type ClubCardAmenity = {
  id?: string;
  label: string;
  icon?: IconName;
};

export type ClubCardProps = {
  variant?: ClubCardVariant;
  title: string;
  imageUrl: string;
  imageAlt?: string;
  location?: string;
  description?: string;
  rating?: number;
  reviewsCount?: number;
  amenities?: ClubCardAmenity[];
  price: string;
  pricePrefix?: string;
  priceSuffix?: string;
  actionLabel: string;
  href?: string;
  onActionPress?: () => void;
  onFavoritePress?: () => void;
  onSharePress?: () => void;
  favoriteAriaLabel?: string;
  shareAriaLabel?: string;
  className?: string;
};
