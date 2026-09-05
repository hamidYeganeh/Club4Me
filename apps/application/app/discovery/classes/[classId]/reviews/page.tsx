import { DiscoveryReviewsScreen } from "@modules/discovery/screens/DiscoveryReviewsScreen";
import { getDiscoverySlugParams } from "@/lib/discovery-static-params";

type PageProps = { params: Promise<{ classId: string }> };
export function generateStaticParams() {
  return getDiscoverySlugParams("/discovery/catalog/classes?limit=100", "classId");
}
export default async function ClassReviewsPage({ params }: PageProps) {
  const { classId } = await params;
  return <DiscoveryReviewsScreen type="class" id={classId} />;
}
