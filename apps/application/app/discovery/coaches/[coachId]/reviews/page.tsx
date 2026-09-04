import { DiscoveryReviewsScreen } from "@modules/discovery/screens/DiscoveryReviewsScreen";

type PageProps = { params: Promise<{ coachId: string }> };

export function generateStaticParams() {
  return [{ coachId: "66d500000000000000000001" }];
}

export default async function CoachReviewsPage({ params }: PageProps) {
  const { coachId } = await params;
  return <DiscoveryReviewsScreen type="coach" id={coachId} />;
}
