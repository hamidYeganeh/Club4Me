import { DiscoveryReviewsScreen } from "@modules/discovery/screens/DiscoveryReviewsScreen";
import { getDiscoverySlugParams } from "@/lib/discovery-static-params";

type PageProps = { params: Promise<{ clubId: string }> };

export function generateStaticParams() {
  return getDiscoverySlugParams("/discovery/catalog/clubs?limit=100", "clubId");
}

export default async function ClubReviewsPage({ params }: PageProps) {
  const { clubId } = await params;
  return <DiscoveryReviewsScreen type="club" id={clubId} />;
}
