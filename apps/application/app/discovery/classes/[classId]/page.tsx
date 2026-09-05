import { DiscoveryProfileDetailScreen } from "@modules/discovery/screens/DiscoveryProfileDetailScreen";
import { getDiscoverySlugParams } from "@/lib/discovery-static-params";

type PageProps = { params: Promise<{ classId: string }> };

export function generateStaticParams() {
  return getDiscoverySlugParams(
    "/discovery/catalog/classes?limit=100",
    "classId",
  );
}

export default async function ClassPage({ params }: PageProps) {
  const { classId } = await params;
  return <DiscoveryProfileDetailScreen type="class" id={classId} />;
}
