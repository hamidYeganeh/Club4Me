import { DiscoveryReviewFormScreen } from "@modules/discovery/screens/DiscoveryReviewFormScreen";
import { getDiscoverySlugParams } from "@/lib/discovery-static-params";

type PageProps = { params: Promise<{ coachId: string }> };
export function generateStaticParams() { return getDiscoverySlugParams("/discovery/catalog/coaches?limit=100", "coachId"); }
export default async function CoachReviewFormPage({ params }: PageProps) {
  const { coachId } = await params;
  return <DiscoveryReviewFormScreen type="coach" id={coachId} />;
}
