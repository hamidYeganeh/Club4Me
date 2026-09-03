import type { Swiper as SwiperType } from "swiper";
import type { GeoPoint } from "@/components/maps/neshan-map";

export type DiscoveryClubsDetailBodySectionProps = {
  images: string[];
  about: string;
  location: GeoPoint & { address: string };
  onThumbsSwiper: (swiper: SwiperType) => void;
  onThumbClick: (index: number) => void;
  stats: Array<{
    icon: "clock" | "compass" | "star-full";
    label: string;
    value: string;
  }>;
};
