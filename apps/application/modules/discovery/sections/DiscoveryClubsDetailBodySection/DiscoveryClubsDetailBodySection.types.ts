import type { Swiper as SwiperType } from "swiper";

export type DiscoveryClubsDetailBodySectionProps = {
  images: string[];
  about: string;
  onThumbsSwiper: (swiper: SwiperType) => void;
  onThumbClick: (index: number) => void;
  stats: Array<{
    icon: "clock" | "compass" | "star-full";
    label: string;
    value: string;
  }>;
};
