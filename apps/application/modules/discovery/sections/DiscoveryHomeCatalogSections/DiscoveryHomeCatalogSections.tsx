"use client";

import {
  useCatalogArticles,
  useCatalogCoaches,
  usePublicCatalogResource,
  type DiscoverySportItem,
} from "@api/discovery";
import { DiscoveryArticlesRailSection } from "@modules/discovery/sections/DiscoveryArticlesRailSection";
import { DiscoveryClubTypesSection } from "@modules/discovery/sections/DiscoveryClubTypesSection";
import { DiscoveryClubsCatalogSections } from "@modules/discovery/sections/DiscoveryClubsCatalogSections";
import { DiscoveryClubsLocationsSection } from "@modules/discovery/sections/DiscoveryClubsLocationsSection";
import { DiscoveryCoachesRailSection } from "@modules/discovery/sections/DiscoveryCoachesRailSection";
import { DiscoveryResourceBrowseSection } from "@modules/discovery/sections/DiscoveryResourceBrowseSection";
import { DiscoverySportsRailSection } from "@modules/discovery/sections/DiscoverySportsRailSection";

const LOCATION_IMAGES = [
  "/discovery/locations/city-modern.jpg",
  "/discovery/locations/city-caspian.jpg",
  "/discovery/locations/city-heritage.jpg",
  "/discovery/locations/city-south-coast.jpg",
] as const;

function imageFor(item: Record<string, unknown>, index: number) {
  return typeof item.imageUrl === "string" && item.imageUrl
    ? item.imageUrl
    : LOCATION_IMAGES[index % LOCATION_IMAGES.length]!;
}

function countFor(item: Record<string, unknown>) {
  return typeof item.clubsCount === "number" ? item.clubsCount : 0;
}

export function DiscoveryHomeCatalogSections() {
  const provinces = usePublicCatalogResource("location", "province");
  const cities = usePublicCatalogResource("location", "city");
  const districts = usePublicCatalogResource("location", "district");
  const regions = usePublicCatalogResource("location", "city-region");
  const sports = usePublicCatalogResource("sports", "sport");
  const amenities = usePublicCatalogResource("facilities", "amenity");
  const equipment = usePublicCatalogResource("facilities", "equipment");
  const specialties = usePublicCatalogResource("sports", "coach-specialty");
  const skillLevels = usePublicCatalogResource("sports", "skill-level");
  const coaches = useCatalogCoaches({ limit: 16 });
  const articles = useCatalogArticles({ limit: 16 });
  const cityById = new Map(
    (cities.data?.items ?? []).map((city) => [city.id, city] as const),
  );

  return (
    <>
      <DiscoveryCoachesRailSection
        id="home-coaches-featured"
        title="مربی‌های برتر"
        subtitle="مربی‌های محبوب با بالاترین امتیاز کاربران"
        icon="medal"
        isLoading={coaches.isPending}
        items={[...(coaches.data?.items ?? [])]
          .sort((a, b) => b.averageRating - a.averageRating)
          .slice(0, 8)}
      />
      <DiscoveryClubTypesSection />
      {!sports.isPending ? (
        <DiscoverySportsRailSection
          id="home-sports"
          title="رشته‌های ورزشی"
          subtitle="بر اساس ورزش مورد علاقه‌ات جست‌وجو کن"
          items={
            (sports.data?.items ?? []).slice(0, 16) as DiscoverySportItem[]
          }
        />
      ) : null}
      {!amenities.isPending ? (
        <DiscoveryResourceBrowseSection
          title="امکانات باشگاه"
          subtitle="باشگاه را بر اساس امکانات مورد نیازت انتخاب کن"
          variant="pills"
          items={(amenities.data?.items ?? []).slice(0, 16)}
          hrefFor={() => "/discovery/clubs"}
          seeAllHref="/discovery/clubs"
        />
      ) : null}
      <DiscoveryClubsLocationsSection
        title="شهرهای پرطرفدار"
        subtitle="باشگاه‌های ورزشی را در شهر خودت پیدا کن"
        isLoading={cities.isPending}
        items={(cities.data?.items ?? []).slice(0, 12).map((city, index) => ({
          id: city.id,
          name: city.name,
          clubsCount: countFor(city),
          imageUrl: imageFor(city, index),
          href: `/discovery/city/${String(city.slug ?? city.id)}`,
          kind: "city" as const,
        }))}
      />
      <DiscoveryClubsCatalogSections
        idPrefix="discovery-home"
        showClubTypes={false}
        showEditorialList
      />
      <DiscoveryArticlesRailSection
        id="home-articles-latest"
        title="تازه‌های مجله"
        subtitle="تازه‌ترین مطالب تمرین، تغذیه و تندرستی"
        icon="sparkle-1"
        isLoading={articles.isPending}
        items={(articles.data?.items ?? []).slice(0, 8)}
      />
      {!equipment.isPending ? (
        <DiscoveryResourceBrowseSection
          title="تجهیزات ورزشی"
          subtitle="مجموعه‌های دارای تجهیزات حرفه‌ای را کشف کن"
          variant="feature"
          items={(equipment.data?.items ?? []).slice(0, 12)}
          hrefFor={() => "/discovery/clubs"}
          seeAllHref="/discovery/clubs"
        />
      ) : null}
      <DiscoveryClubsLocationsSection
        title="محله‌ها و مناطق محبوب"
        subtitle="انتخاب‌های نزدیک‌تر در منطقه‌های مختلف شهر"
        isLoading={districts.isPending || cities.isPending}
        items={(districts.data?.items ?? [])
          .slice(0, 12)
          .flatMap((district, index) => {
            const city = cityById.get(String(district.cityId ?? ""));
            if (!city) return [];
            return [
              {
                id: district.id,
                name: district.name,
                clubsCount: countFor(district),
                imageUrl: imageFor(district, index + 1),
                href: `/discovery/city/${String(city.slug ?? city.id)}/district/${String(district.slug ?? district.id)}`,
                kind: "district" as const,
              },
            ];
          })}
        seeAllHref="/discovery/cities"
      />
      <DiscoveryResourceBrowseSection
        title="مناطق شهری"
        subtitle="باشگاه‌ها و کلاس‌های نزدیک هر منطقه"
        items={(regions.data?.items ?? []).slice(0, 16)}
        hrefFor={(region) =>
          `/discovery/regions/${String(region.slug ?? region.id)}`
        }
        seeAllHref="/discovery/cities"
      />
      <DiscoveryCoachesRailSection
        id="home-coaches-new"
        title="مربی‌های تازه‌وارد"
        subtitle="چهره‌های تازه‌ای که می‌توانی با آن‌ها تمرین کنی"
        icon="sparkle-1"
        cardType="compact"
        isLoading={coaches.isPending}
        items={(coaches.data?.items ?? []).slice(8, 16)}
      />
      {!specialties.isPending ? (
        <DiscoveryResourceBrowseSection
          title="تخصص‌های مربیگری"
          subtitle="مربی مناسب هدفت را بر اساس تخصص پیدا کن"
          items={(specialties.data?.items ?? []).slice(0, 16)}
          hrefFor={() => "/discovery/coaches"}
          seeAllHref="/discovery/coaches"
        />
      ) : null}
      {!skillLevels.isPending ? (
        <DiscoveryResourceBrowseSection
          title="سطح تمرین"
          subtitle="پیشنهادهای مناسب سطح آمادگی خودت"
          variant="pills"
          items={(skillLevels.data?.items ?? []).slice(0, 12)}
          hrefFor={() => "/discovery/classes"}
          seeAllHref="/discovery/classes"
        />
      ) : null}
      <DiscoveryClubsLocationsSection
        title="استان‌ها"
        subtitle="کشف مجموعه‌های ورزشی در سراسر ایران"
        isLoading={provinces.isPending}
        items={(provinces.data?.items ?? [])
          .slice(0, 12)
          .map((province, index) => ({
            id: province.id,
            name: province.name,
            clubsCount: countFor(province),
            imageUrl: imageFor(province, index + 2),
            href: `/discovery/province/${String(province.slug ?? province.id)}`,
            kind: "province" as const,
          }))}
        seeAllHref="/discovery/cities"
      />
      <DiscoveryArticlesRailSection
        id="home-articles-guides"
        title="راهنماهای پیشنهادی"
        subtitle="مطالب منتخب برای یک برنامه ورزشی بهتر"
        icon="academic-cap"
        isLoading={articles.isPending}
        cardVariant={{ orientation: "horizontal", outlined: true }}
        items={(articles.data?.items ?? []).slice(8, 16)}
      />
    </>
  );
}
