"use client";
import { useQuery } from "@tanstack/react-query";
import { http } from "../../http/client";
export type ProductAnalytics = {
  days: number;
  start: string;
  end: string;
  generatedAt: string;
  clubId: string | null;
  metrics: Array<{
    key: string;
    label: string;
    value: number;
    previous: number;
    changePercent: number | null;
    unit: string;
  }>;
  activeUsers: number;
  dailyActiveUsers: number;
  views: number;
  searchCount: number;
  emptySearches: number;
  funnel: Array<{
    key: string;
    label: string;
    users: number;
    conversionPercent: number;
    stepConversionPercent: number | null;
  }>;
  cohorts: Array<{
    week: string;
    users: number;
    retention: Array<number | null>;
  }>;
  breakdowns: {
    acquisitionChannel: Array<{ key: string; count: number }>;
    sport: Array<{ key: string; count: number }>;
    serviceType: Array<{ key: string; count: number }>;
  };
  versions: Array<{ key: string; count: number }>;
  operations: {
    newCustomers: number;
    returningCustomers: number;
    repeatCustomers: number;
    repeatRate: number | null;
    upcomingCapacity: number;
    upcomingReserved: number;
    occupancyRate: number | null;
    expiringMemberships: number;
    averageRating: number | null;
    reviewCount: number;
    noShows: number;
  };
  renewals: number;
  peakHours: Array<{ day: number; hour: number; count: number }>;
  markets: Array<{ id: string; name: string; count: number }>;
  health: Array<{
    key: string;
    count: number;
    failed: number;
    errorRate: number | null;
    p95Ms: number;
  }>;
  trend: Array<{ label: string; value: number }>;
  classes: Array<{
    id: string;
    clubId: string;
    title: string;
    capacity: number;
    enrolled: number;
    pending: number;
    occupancyRate: number | null;
  }>;
  actions: Array<{ key: string; label: string; href: string }>;
  integration?: { configured: boolean; pending: number; retrying: number };
  paymentMode: string;
  definitions: Record<string, string>;
};
export function useProductAnalytics(days = 30, end?: string) {
  return useQuery({
    queryKey: ["admin", "analytics", "product", days, end],
    queryFn: () =>
      http.get<ProductAnalytics>("/admin/analytics/product", { days, end }),
  });
}
export function useBusinessAnalytics(clubId: string, days = 30, end?: string) {
  return useQuery({
    queryKey: ["business", "analytics", clubId, days, end],
    enabled: Boolean(clubId),
    queryFn: () =>
      http.get<ProductAnalytics>(`/business/clubs/${clubId}/analytics`, {
        days,
        end,
      }),
  });
}
