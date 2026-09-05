import { DiscoveryEntityGalleryScreen } from "@modules/discovery/screens/DiscoveryEntityGalleryScreen";
import { getDiscoverySlugParams } from "@/lib/discovery-static-params";

type PageProps = { params: Promise<{ coachId: string }> };
export function generateStaticParams() { return getDiscoverySlugParams("/discovery/catalog/coaches?limit=100", "coachId"); }
export default async function CoachGalleryPage({ params }: PageProps) {
  const { coachId } = await params;
  return <DiscoveryEntityGalleryScreen type="coach" id={coachId} />;
}
