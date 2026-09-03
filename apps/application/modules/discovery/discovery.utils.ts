import { DISCOVERY_CLUBS } from "./discovery.constants";
import type { DiscoveryClub } from "./discovery.types";

export function getDiscoveryClub(clubId: string): DiscoveryClub {
  return (
    DISCOVERY_CLUBS.find((club) => club.id === clubId) ?? DISCOVERY_CLUBS[0]!
  );
}

export function getDiscoveryClubParams() {
  return DISCOVERY_CLUBS.map((club) => ({ clubId: club.id }));
}
