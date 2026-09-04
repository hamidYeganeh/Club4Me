import { DiscoveryClubsDetailScreen } from "@modules/discovery/screens/DiscoveryClubsDetailScreen";

type PageProps = {
  params: Promise<{ clubId: string }>;
};

export function generateStaticParams() {
  return [{ clubId: "66d400000000000000000001" }];
}

export default async function ClubDiscoveryPage({ params }: PageProps) {
  const { clubId } = await params;

  return <DiscoveryClubsDetailScreen clubId={clubId} />;
}
