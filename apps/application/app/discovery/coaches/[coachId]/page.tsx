import { DiscoveryProfileDetailScreen } from "@modules/discovery/screens/DiscoveryProfileDetailScreen";

type PageProps = { params: Promise<{ coachId: string }> };

export function generateStaticParams() {
  return [{ coachId: "66d500000000000000000001" }];
}

export default async function CoachPage({ params }: PageProps) {
  const { coachId } = await params;
  return <DiscoveryProfileDetailScreen type="coach" id={coachId} />;
}
