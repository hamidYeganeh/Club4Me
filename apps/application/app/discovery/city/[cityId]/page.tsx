import { DiscoveryCityScreen } from "@modules/discovery/screens/DiscoveryCityScreen";
import { getDiscoverySlugParams } from "@/lib/discovery-static-params";
import { getDiscoveryEntity } from "@/lib/discovery-static-params";
import type { Metadata } from "next";
import { siteUrl } from "@/lib/site-metadata";

type PageProps = {
  params: Promise<{ cityId: string }>;
};

export function generateStaticParams() {
  return getDiscoverySlugParams(
    "/geography/cities?action=options&limit=100",
    "cityId",
  );
}
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { cityId } = await params;
  const canonical = new URL(`/discovery/city/${cityId}`, siteUrl).toString();
  const supply = await getDiscoveryEntity<{ total: number }>(`/discovery/catalog/clubs?cityId=${encodeURIComponent(cityId)}&limit=1`);
  return { title: `باشگاه‌ها و کلاس‌های ورزشی شهر | Gym4Me`, description: "گزینه‌های فعال ورزشی شهر را مقایسه و رزرو کنید.", alternates: { canonical }, ...(supply?.total ? {} : { robots: { index: false, follow: true } }) };
}

export default async function CityDiscoveryPage({ params }: PageProps) {
  const { cityId } = await params;

  return <DiscoveryCityScreen cityId={cityId} />;
}
