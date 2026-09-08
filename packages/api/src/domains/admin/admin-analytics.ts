"use client";

import { useQuery } from "@tanstack/react-query";

import { http } from "../../http/client";

export type ProductAnalytics = {
  days: number;
  funnel: Array<{
    key: string;
    label: string;
    users: number;
    conversionPercent: number;
  }>;
  cohorts: Array<{
    week: string;
    users: number;
    retention: number[];
  }>;
  breakdowns: {
    acquisitionChannel: Array<{ key: string; count: number }>;
    sport: Array<{ key: string; count: number }>;
    serviceType: Array<{ key: string; count: number }>;
  };
  definitions: Record<string, string>;
};

export function useProductAnalytics(days = 30) {
  return useQuery({
    queryKey: ["admin", "analytics", "product", days],
    queryFn: () =>
      http.get<ProductAnalytics>("/admin/analytics/product", { days }),
  });
}
