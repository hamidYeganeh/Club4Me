import { DiscoveryClubsDetailScreen } from "@modules/discovery/screens/DiscoveryClubsDetailScreen";

type PageProps = {
  params: Promise<{ clubId: string }>;
};

export default async function ClubDiscoveryPage({ params }: PageProps) {
  const { clubId } = await params;

  return <DiscoveryClubsDetailScreen clubId={clubId} />;
}
