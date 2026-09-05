import { DiscoveryReviewFormScreen } from "@modules/discovery/screens/DiscoveryReviewFormScreen";
import { getDiscoverySlugParams } from "@/lib/discovery-static-params";

type PageProps = { params: Promise<{ clubId: string }> };
export function generateStaticParams() { return getDiscoverySlugParams("/discovery/catalog/clubs?limit=100", "clubId"); }
export default async function ClubReviewFormPage({ params }: PageProps) {
  const { clubId } = await params;
  return <DiscoveryReviewFormScreen type="club" id={clubId} />;
}
