import { DiscoveryCategoryScreen } from "@modules/discovery/screens/DiscoveryCategoryScreen";
import { getDiscoverySlugParams } from "@/lib/discovery-static-params";
import { getDiscoveryEntity } from "@/lib/discovery-static-params";
import type { Metadata } from "next";
import { siteUrl } from "@/lib/site-metadata";

type PageProps = { params: Promise<{ sportId: string }> };
export function generateStaticParams() {
  return getDiscoverySlugParams(
    "/sports/sports?action=options&limit=100",
    "sportId",
  );
}
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { sportId } = await params;
  const canonical = new URL(`/discovery/sports/${sportId}`, siteUrl).toString();
  const supply = await getDiscoveryEntity<{ total: number }>(`/discovery/catalog/classes?sportId=${encodeURIComponent(sportId)}&limit=1`);
  return { title: "باشگاه، مربی و کلاس این رشته | Gym4Me", description: "عرضه فعال این رشته را در Gym4Me پیدا و مقایسه کنید.", alternates: { canonical }, ...(supply?.total ? {} : { robots: { index: false, follow: true } }) };
}
export default async function SportPage({ params }: PageProps) {
  const { sportId } = await params;
  return <DiscoveryCategoryScreen type="sports" id={sportId} />;
}
