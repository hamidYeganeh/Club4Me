import { DiscoveryReviewFormScreen } from "@modules/discovery/screens/DiscoveryReviewFormScreen";
import { getDiscoverySlugParams } from "@/lib/discovery-static-params";

type PageProps = { params: Promise<{ classId: string }> };
export function generateStaticParams() { return getDiscoverySlugParams("/discovery/catalog/classes?limit=100", "classId"); }
export default async function ClassReviewFormPage({ params }: PageProps) {
  const { classId } = await params;
  return <DiscoveryReviewFormScreen type="class" id={classId} />;
}
