import { DiscoveryProfileDetailScreen } from "@modules/discovery/screens/DiscoveryProfileDetailScreen";
import { getDiscoverySlugParams } from "@/lib/discovery-static-params";
import { getDiscoveryEntity } from "@/lib/discovery-static-params";
import type { Metadata } from "next";
import { siteName, siteUrl } from "@/lib/site-metadata";

type PageProps = { params: Promise<{ coachId: string }> };

export function generateStaticParams() {
  return getDiscoverySlugParams(
    "/discovery/catalog/coaches?limit=100",
    "coachId",
  );
}
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { coachId } = await params;
  const item = await getDiscoveryEntity<{ displayName: string; shortBio?: string; imageUrl?: string }>(`/discovery/catalog/coaches/${encodeURIComponent(coachId)}`);
  const canonical = new URL(`/discovery/coaches/${coachId}`, siteUrl).toString();
  return item ? { title: `${item.displayName} | مربی در ${siteName}`, description: item.shortBio, alternates: { canonical }, openGraph: { url: canonical, images: item.imageUrl ? [item.imageUrl] : [] } } : { title: "مربی پیدا نشد", robots: { index: false, follow: false }, alternates: { canonical } };
}

export default async function CoachPage({ params }: PageProps) {
  const { coachId } = await params;
  return <DiscoveryProfileDetailScreen type="coach" id={coachId} />;
}
