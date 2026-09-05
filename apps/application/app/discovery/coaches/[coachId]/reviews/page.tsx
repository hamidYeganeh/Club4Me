import { DiscoveryReviewsScreen } from "@modules/discovery/screens/DiscoveryReviewsScreen";
import { getDiscoverySlugParams } from "@/lib/discovery-static-params";

type PageProps = { params: Promise<{ coachId: string }> };

export function generateStaticParams() {
  return getDiscoverySlugParams(
    "/discovery/catalog/coaches?limit=100",
    "coachId",
  );
}

export default async function CoachReviewsPage({ params }: PageProps) {
  const { coachId } = await params;
  return <DiscoveryReviewsScreen type="coach" id={coachId} />;
}
