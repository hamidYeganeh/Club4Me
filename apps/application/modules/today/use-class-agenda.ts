"use client";

import { useQuery } from "@tanstack/react-query";
import { http } from "@api/http/client";
import type { AgendaItem } from "./agenda";

export function useClassAgenda() {
  const coach = useQuery({
    queryKey: ["athlete", "class-agenda"],
    queryFn: () => http.get<{ items: AgendaItem[] }>("/athlete/class-agenda"),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
  });
  const business = useQuery({
    queryKey: ["athlete", "club-classes", "agenda"],
    queryFn: () =>
      http.get<{ items: AgendaItem[] }>("/athlete/club-classes/agenda"),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
  });
  return {
    coach,
    business,
    items: [...(coach.data?.items ?? []), ...(business.data?.items ?? [])],
  };
}
