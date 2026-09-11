"use client";

import { createContext, useContext } from "react";

export const SelectedClubScope = createContext<string | null>(null);

import { useBusinessClubs } from "@api/business";
import { useAccountPreference } from "@api/preferences";

export function useSelectedClub() {
  const source = useBusinessClubs();
  const scope = useContext(SelectedClubScope);
  const clubs = scope
    ? {
        ...source,
        data: source.data
          ? {
              ...source.data,
              items: source.data.items.filter((club) => club.id === scope),
            }
          : undefined,
      }
    : source;
  const [selected, save] = useAccountPreference("business-club");
  const items = clubs.data?.items ?? [];
  // A revoked or deleted club is never restored from a stale preference.
  const clubId =
    items.find((club) => club.id === selected)?.id ?? items[0]?.id ?? "";
  const setClubId = (id: string) => {
    if (items.some((club) => club.id === id)) save(id);
  };
  return { clubs, clubId, setClubId };
}
