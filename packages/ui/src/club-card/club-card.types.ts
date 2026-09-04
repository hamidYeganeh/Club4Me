import type { IconName } from "@repo/theme/icon";

export type ClubCardVariant = "compact" | "editorial";

export type ClubCardAmenity = {
  id?: string;
  label: string;
  icon?: IconName;
};

export type ClubCardSport = {
  id?: string;
  label: string;
  icon: IconName;
};

export type ClubCardProps = {
  variant?: ClubCardVariant;
  title: string;
  imageUrl: string;
  imageAlt?: string;
  /** City and district only, e.g. "تهران، سعادت‌آباد" */
  location?: string;
  rating?: number;
  reviewsCount?: number;
  amenities?: ClubCardAmenity[];
  sports?: ClubCardSport[];
  price?: string;
  pricePrefix?: string;
  priceSuffix?: string;
  href?: string;
  onFavoritePress?: () => void;
  onSharePress?: () => void;
  favoriteAriaLabel?: string;
  shareAriaLabel?: string;
  className?: string;
};
