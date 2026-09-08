import { DiscoveryClubsDetailScreen } from "@modules/discovery/screens/DiscoveryClubsDetailScreen";
import { getDiscoverySlugParams } from "@/lib/discovery-static-params";
import { getDiscoveryEntity } from "@/lib/discovery-static-params";
import type { Metadata } from "next";
import { siteName, siteUrl } from "@/lib/site-metadata";

type PageProps = {
  params: Promise<{ clubId: string }>;
};

export function generateStaticParams() {
  return getDiscoverySlugParams("/discovery/catalog/clubs?limit=100", "clubId");
}
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { clubId } = await params;
  const club = await getDiscoveryEntity<{ name: string; shortDescription?: string; imageUrl?: string; reviewsCount?: number }>(`/discovery/catalog/clubs/${encodeURIComponent(clubId)}`);
  const canonical = new URL(`/discovery/clubs/${clubId}`, siteUrl).toString();
  if (!club) return { title: "باشگاه پیدا نشد", robots: { index: false, follow: false }, alternates: { canonical } };
  const title = `${club.name} | ${siteName}`;
  const description = club.shortDescription || `اطلاعات، کلاس‌ها، سانس‌ها و نظرهای معتبر ${club.name}`;
  return { title, description, alternates: { canonical }, openGraph: { title, description, url: canonical, images: club.imageUrl ? [club.imageUrl] : [] } };
}

export default async function ClubDiscoveryPage({ params }: PageProps) {
  const { clubId } = await params;
  const club = await getDiscoveryEntity<{ name: string; address?: string; averageRating?: number; reviewsCount?: number }>(`/discovery/catalog/clubs/${encodeURIComponent(clubId)}`);
  const jsonLd = club ? { "@context": "https://schema.org", "@type": "SportsActivityLocation", name: club.name, address: club.address, aggregateRating: club.reviewsCount ? { "@type": "AggregateRating", ratingValue: club.averageRating, reviewCount: club.reviewsCount } : undefined, url: new URL(`/discovery/clubs/${clubId}`, siteUrl).toString() } : null;
  return <>{jsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} /> : null}<DiscoveryClubsDetailScreen clubId={clubId} /></>;
}
