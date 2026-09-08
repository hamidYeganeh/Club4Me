"use client";
import {
  getActiveCoordinates,
  useActiveLocation,
} from "@modules/locations/active-location";
import { DiscoveryClubsRailSection } from "./DiscoveryClubsRailSection";
import { DiscoveryClubTypesSection } from "./DiscoveryClubTypesSection";
export function DiscoveryNearbySection() {
  const { active } = useActiveLocation();
  const coordinates = getActiveCoordinates(active);
  return (
    <div className="-mx-5 flex flex-col">
      <DiscoveryClubsRailSection
        id="discovery-nearby"
        title={coordinates ? "نزدیک تو" : "باشگاه‌های پیشنهادی"}
        subtitle={
          coordinates
            ? "باشگاه‌های اطراف موقعیت فعال"
            : "برای دیدن باشگاه‌های نزدیک، موقعیت خودت را انتخاب کن"
        }
        icon="pin-1"
        seeAllHref="/discovery/clubs?nearby=1"
        params={{
          limit: 6,
          ...(coordinates
            ? {
                latitude: coordinates.latitude,
                longitude: coordinates.longitude,
                radiusKm: 25,
              }
            : {}),
        }}
        tone="accent"
        cardVariant="compact"
      />
      <div className="relative z-10 -mt-5 rounded-t-3xl bg-background px-5 pt-7 pb-3">
        <DiscoveryClubTypesSection />
      </div>
    </div>
  );
}
