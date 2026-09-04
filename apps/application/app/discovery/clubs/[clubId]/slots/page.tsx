import { DiscoveryClubSlotsScreen } from "@modules/discovery/screens/DiscoveryClubSlotsScreen";

type PageProps = {
  params: Promise<{ clubId: string }>;
};

export function generateStaticParams() {
  return [{ clubId: "66d400000000000000000001" }];
}

export default async function ClubSlotsPage({ params }: PageProps) {
  const { clubId } = await params;

  return <DiscoveryClubSlotsScreen clubId={clubId} />;
}
