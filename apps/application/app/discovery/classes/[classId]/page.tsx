import { DiscoveryProfileDetailScreen } from "@modules/discovery/screens/DiscoveryProfileDetailScreen";

type PageProps = { params: Promise<{ classId: string }> };

export function generateStaticParams() {
  return [{ classId: "66d500000000000000000004" }];
}

export default async function ClassPage({ params }: PageProps) {
  const { classId } = await params;
  return <DiscoveryProfileDetailScreen type="class" id={classId} />;
}
