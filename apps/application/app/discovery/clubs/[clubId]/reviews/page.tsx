import { DiscoveryReviewsScreen } from "@modules/discovery/screens/DiscoveryReviewsScreen";

type PageProps = { params: Promise<{ clubId: string }> };

export function generateStaticParams() {
  return [{ clubId: "66d400000000000000000001" }];
}

export default async function ClubReviewsPage({ params }: PageProps) {
  const { clubId } = await params;
  return <DiscoveryReviewsScreen type="club" id={clubId} />;
}
