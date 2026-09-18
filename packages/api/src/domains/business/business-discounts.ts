"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "../../http/client";

export type BusinessDiscount = {
  id: string;
  code: string;
  title: string;
  kind: "percent" | "fixed";
  value: number;
  maxDiscount: number | null;
  minOrderAmount: number;
  budgetRemaining: number;
  usageLimit: number | null;
  usageCount: number;
  perUserLimit: number;
  firstPurchaseOnly: boolean;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
};
export type CreateBusinessDiscount = {
  code: string;
  title: string;
  kind: "percent" | "fixed";
  value: number;
  maxDiscount: number | null;
  minOrderAmount: number;
  budget: number;
  perUserLimit: number;
  usageLimit: number | null;
  firstPurchaseOnly: boolean;
  startsAt: string;
  endsAt: string;
};
const path = (clubId: string) => `/business/clubs/${clubId}/discounts`;
export function useBusinessDiscounts(clubId: string) {
  return useQuery({
    queryKey: ["business", clubId, "discounts"],
    queryFn: () => http.get<{ items: BusinessDiscount[] }>(path(clubId)),
    enabled: Boolean(clubId),
  });
}
export function useCreateBusinessDiscount(clubId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBusinessDiscount) =>
      http.post<BusinessDiscount>(path(clubId), payload),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ["business", clubId, "discounts"] }),
  });
}
