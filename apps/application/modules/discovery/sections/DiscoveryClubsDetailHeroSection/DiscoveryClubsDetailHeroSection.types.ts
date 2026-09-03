import type { Ref } from "react";
import type { Swiper as SwiperType } from "swiper";

export type DiscoveryClubsDetailHeroSectionProps = {
  name: string;
  location: string;
  price: number;
  images: string[];
  thumbsSwiper: SwiperType | null;
  onMainSwiper: (swiper: SwiperType) => void;
  sectionRef?: Ref<HTMLElement>;
};
