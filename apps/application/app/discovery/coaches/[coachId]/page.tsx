import { DiscoveryProfileDetailScreen } from "@modules/discovery/screens/DiscoveryProfileDetailScreen";
import { getDiscoverySlugParams } from "@/lib/discovery-static-params";

type PageProps = { params: Promise<{ coachId: string }> };

export function generateStaticParams() {
  return getDiscoverySlugParams(
    "/discovery/catalog/coaches?limit=100",
    "coachId",
  );
}

export default async function CoachPage({ params }: PageProps) {
  const { coachId } = await params;
  return <DiscoveryProfileDetailScreen type="coach" id={coachId} />;
}
