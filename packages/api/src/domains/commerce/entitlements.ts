"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "../../http/client";
import type { PaymentIntent } from "./commerce";

export type BenefitProduct = {
  id: string;
  clubId: string;
  title: string;
  description: string;
  type: "session_pack" | "time_membership";
  price: number;
  sessionCount: number | null;
  validityDays: number;
  maxPauseDays?: number;
  weeklyLimit: number | null;
  weekCalendar?: "iso_utc" | "iran_saturday";
  sessionTypes: Array<"court" | "class" | "coached_session">;
  status: "active" | "inactive";
};
export type UserEntitlement = {
  id: string;
  productId: string;
  clubId: string;
  title: string;
  type: BenefitProduct["type"];
  maxPauseDays?: number;
  remainingPauseDays?: number;
  pauseUntil?: string | null;
  changes?: Array<{
    action: "pause" | "resume" | "renewal";
    at: string;
    beforeEndsAt: string;
    afterEndsAt: string;
  }>;
  remainingSessions: number | null;
  weeklyLimit: number | null;
  weekCalendar?: "iso_utc" | "iran_saturday";
  weeklyUsed: number;
  sessionTypes: string[];
  startsAt: string;
  endsAt: string;
  status: "active" | "exhausted" | "expired" | "revoked";
};
export type EntitlementUsage = {
  id: string;
  reservationId: string;
  sessionStartsAt: string;
  status: "reserved" | "consumed" | "released";
  createdAt: string;
  updatedAt: string;
};

export function useEntitlementUsage(entitlementId: string, page = 1) {
  return useQuery({
    queryKey: ["benefits", "entitlements", "usage", entitlementId, page],
    queryFn: () =>
      http.get<{
        items: EntitlementUsage[];
        total: number;
        page: number;
        totalPages: number;
      }>(`/benefit-purchases/mine/entitlements/${entitlementId}/usage`, {
        page,
        limit: 10,
      }),
    enabled: Boolean(entitlementId),
  });
}
export type BenefitProductPayload = Omit<
  BenefitProduct,
  "id" | "clubId" | "status" | "weekCalendar"
>;

export function useBusinessBenefitProducts(clubId: string) {
  return useQuery({
    queryKey: ["business", clubId, "benefit-products"],
    queryFn: () =>
      http.get<{ items: BenefitProduct[] }>(
        `/business/clubs/${clubId}/benefit-products`,
      ),
    enabled: Boolean(clubId),
  });
}
export function useCreateBenefitProduct(clubId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: BenefitProductPayload) =>
      http.post<BenefitProduct>(
        `/business/clubs/${clubId}/benefit-products`,
        payload,
      ),
    onSuccess: () =>
      client.invalidateQueries({
        queryKey: ["business", clubId, "benefit-products"],
      }),
  });
}
export function useUpdateBenefitProduct(clubId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      status,
    }: {
      productId: string;
      status: "active" | "inactive";
    }) =>
      http.patch<BenefitProduct>(
        `/business/clubs/${clubId}/benefit-products/${productId}`,
        { status },
      ),
    onSuccess: () =>
      client.invalidateQueries({
        queryKey: ["business", clubId, "benefit-products"],
      }),
  });
}
export function usePublicBenefitProducts(clubId: string) {
  return useQuery({
    queryKey: ["public", clubId, "benefit-products"],
    queryFn: () =>
      http.get<{ items: BenefitProduct[] }>(
        `/public/clubs/${clubId}/benefit-products`,
      ),
    enabled: Boolean(clubId),
  });
}
export function useMyEntitlements(enabled = true) {
  return useQuery({
    queryKey: ["benefits", "entitlements", "mine"],
    queryFn: () =>
      http.get<{ items: UserEntitlement[] }>(
        "/benefit-purchases/mine/entitlements",
      ),
    enabled,
  });
}
export function usePurchaseBenefitProduct() {
  return useMutation({
    mutationFn: async (productId: string) => {
      const purchase = await http.post<{ id: string }>(
        `/benefit-purchases/${productId}`,
        {},
      );
      return http.post<PaymentIntent>("/payments/intents", {
        referenceType: "benefit_purchase",
        referenceId: purchase.id,
        idempotencyKey: `benefit-purchase-${purchase.id}`,
        returnUrl:
          typeof window === "undefined"
            ? "https://club4me.local/return"
            : window.location.href,
        walletAmount: 0,
      });
    },
  });
}

export function useCreateBenefitPurchase() {
  return useMutation({
    mutationFn: (
      input:
        | string
        | {
            productId: string;
            renewedFromId: string;
            startMode: "immediate" | "after_expiry";
          },
    ) => {
      const { productId, ...options } =
        typeof input === "string" ? { productId: input } : input;
      return http.post<{ id: string; amount: number; status: string }>(
        `/benefit-purchases/${productId}`,
        options,
      );
    },
  });
}

export function usePauseEntitlement() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, days }: { id: string; days: number }) =>
      http.post<UserEntitlement>(
        `/benefit-purchases/mine/entitlements/${id}/pause`,
        { days },
      ),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ["benefits", "entitlements"] }),
  });
}
export function useResumeEntitlement() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      http.post<UserEntitlement>(
        `/benefit-purchases/mine/entitlements/${id}/resume`,
        {},
      ),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ["benefits", "entitlements"] }),
  });
}
