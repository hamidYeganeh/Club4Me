import type { Ref } from "react";
import type { Swiper as SwiperType } from "swiper";

export type DiscoveryClubsDetailHeroSectionProps = {
  clubId: string;
  name: string;
  location: string;
  statusLabel: string;
  images: string[];
  thumbsSwiper: SwiperType | null;
  onMainSwiper: (swiper: SwiperType) => void;
  sectionRef?: Ref<HTMLElement>;
};
