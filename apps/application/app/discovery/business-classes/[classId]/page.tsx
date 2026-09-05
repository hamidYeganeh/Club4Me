import { BusinessClassDetailScreen } from "@modules/discovery/screens/BusinessClassDetailScreen";
import { getDiscoverySlugParams } from "@/lib/discovery-static-params";

type PageProps = { params: Promise<{ classId: string }> };

export function generateStaticParams() {
  return getDiscoverySlugParams("/discovery/business-classes", "classId");
}

export default async function BusinessClassPage({ params }: PageProps) {
  const { classId } = await params;
  return <BusinessClassDetailScreen classId={classId} />;
}
