import { DiscoveryClubSlotsScreen } from "@modules/discovery/screens/DiscoveryClubSlotsScreen";
import { getDiscoverySlugParams } from "@/lib/discovery-static-params";

type PageProps = {
  params: Promise<{ clubId: string }>;
};

export function generateStaticParams() {
  return getDiscoverySlugParams("/discovery/catalog/clubs?limit=100", "clubId");
}

export default async function ClubSlotsPage({ params }: PageProps) {
  const { clubId } = await params;

  return <DiscoveryClubSlotsScreen clubId={clubId} />;
}
