import { DiscoveryProfileDetailScreen } from "@modules/discovery/screens/DiscoveryProfileDetailScreen";
import { getDiscoverySlugParams } from "@/lib/discovery-static-params";
import { getDiscoveryEntity } from "@/lib/discovery-static-params";
import type { Metadata } from "next";
import { siteName, siteUrl } from "@/lib/site-metadata";

type PageProps = { params: Promise<{ classId: string }> };

export function generateStaticParams() {
  return getDiscoverySlugParams(
    "/discovery/catalog/classes?limit=100",
    "classId",
  );
}
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { classId } = await params;
  const item = await getDiscoveryEntity<{ title: string; description?: string; imageUrl?: string }>(`/discovery/catalog/classes/${encodeURIComponent(classId)}`);
  const canonical = new URL(`/discovery/classes/${classId}`, siteUrl).toString();
  return item ? { title: `${item.title} | ${siteName}`, description: item.description, alternates: { canonical }, openGraph: { url: canonical, images: item.imageUrl ? [item.imageUrl] : [] } } : { title: "کلاس پیدا نشد", robots: { index: false, follow: false }, alternates: { canonical } };
}

export default async function ClassPage({ params }: PageProps) {
  const { classId } = await params;
  return <DiscoveryProfileDetailScreen type="class" id={classId} />;
}
