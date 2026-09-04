import { DiscoveryClubsScreen } from "@modules/discovery/screens/DiscoveryClubsScreen";
import type { DiscoveryClubsBrowse } from "@modules/discovery/screens/DiscoveryClubsScreen";

type ClubsPageProps = {
  searchParams: Promise<{
    sort?: string;
    sportId?: string;
    clubTypeId?: string;
    nearby?: string;
  }>;
};

export default async function ClubsPage({ searchParams }: ClubsPageProps) {
  const params = await searchParams;
  return <DiscoveryClubsScreen browse={toBrowse(params)} />;
}

function toBrowse(params: {
  sort?: string;
  sportId?: string;
  clubTypeId?: string;
  nearby?: string;
}): DiscoveryClubsBrowse {
  return {
    sort:
      params.sort === "rating" || params.sort === "newest"
        ? params.sort
        : undefined,
    sportId: params.sportId,
    clubTypeId: params.clubTypeId,
    nearby: params.nearby === "1",
  };
}
