import { DiscoveryEntityGalleryScreen } from "@modules/discovery/screens/DiscoveryEntityGalleryScreen";
import { getDiscoverySlugParams } from "@/lib/discovery-static-params";

type PageProps = { params: Promise<{ classId: string }> };
export function generateStaticParams() { return getDiscoverySlugParams("/discovery/catalog/classes?limit=100", "classId"); }
export default async function ClassGalleryPage({ params }: PageProps) {
  const { classId } = await params;
  return <DiscoveryEntityGalleryScreen type="class" id={classId} />;
}
