export type DiscoveryBannerAspectRatio = "16/9" | "9/16" | "3/4" | "4/3";

export type DiscoveryBannerSlidesPerView = 1 | 1.2 | "auto";

export type DiscoveryBannerItem = {
  id?: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  actionLabel?: string;
  actionUrl?: string;
};

export type DiscoveryBannersSectionProps = {
  skeletonCount?: number;
  isLoading?: boolean;
  id?: string;
  title?: string;
  subtitle?: string;
  viewAllLabel?: string;
  viewAllUrl?: string;
  items: DiscoveryBannerItem[];
  /** All slides in the carousel share this ratio. */
  aspectRatio?: DiscoveryBannerAspectRatio;
  slidesPerView?: DiscoveryBannerSlidesPerView;
  spaceBetween?: number;
  autoplay?: boolean;
  className?: string;
};

export type DiscoveryBannersLayoutConfig = {
  aspectRatio: DiscoveryBannerAspectRatio;
  slidesPerView: DiscoveryBannerSlidesPerView;
};
