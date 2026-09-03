import { DiscoveryClubsDetailScreen } from "@modules/discovery/screens/DiscoveryClubsDetailScreen";
import { getDiscoveryClubParams } from "@modules/discovery/discovery.utils";

type PageProps = {
  params: Promise<{ clubId: string }>;
};

export function generateStaticParams() {
  return getDiscoveryClubParams();
}

export default async function ClubDiscoveryPage({ params }: PageProps) {
  const { clubId } = await params;

  return <DiscoveryClubsDetailScreen clubId={clubId} />;
}
