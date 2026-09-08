import type { Swiper as SwiperType } from "swiper";
import type { GeoPoint } from "@/components/maps/neshan-map";
import type {
  DiscoveryCoach,
  DiscoveryFacilityItem,
  DiscoverySport,
} from "@modules/discovery/discovery.types";

export type DiscoveryClubsDetailBodySectionProps = {
  name: string;
  images: string[];
  about: string;
  amenities: DiscoveryFacilityItem[];
  equipment: DiscoveryFacilityItem[];
  sports: DiscoverySport[];
  coaches: DiscoveryCoach[];
  location: (GeoPoint & { address: string }) | null;
  onThumbsSwiper: (swiper: SwiperType) => void;
  onThumbClick: (index: number) => void;
  stats: Array<{
    icon: "clock" | "compass" | "star-full";
    label: string;
    value: string;
  }>;
};
