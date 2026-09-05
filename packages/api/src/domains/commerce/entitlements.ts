"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "../../http/client";

export type BenefitProduct = {
  id: string;
  clubId: string;
  title: string;
  description: string;
  type: "session_pack" | "time_membership";
  price: number;
  sessionCount: number | null;
  validityDays: number;
  weeklyLimit: number | null;
  sessionTypes: Array<"court" | "class" | "coached_session">;
  status: "active" | "inactive";
};
export type UserEntitlement = {
  id: string;
  productId: string;
  clubId: string;
  title: string;
  type: BenefitProduct["type"];
  remainingSessions: number | null;
  weeklyLimit: number | null;
  weeklyUsed: number;
  sessionTypes: string[];
  startsAt: string;
  endsAt: string;
  status: "active" | "exhausted" | "expired" | "revoked";
};
export type BenefitProductPayload = Omit<
  BenefitProduct,
  "id" | "clubId" | "status"
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
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
      const purchase = await http.post<{ id: string }>(
        `/benefit-purchases/${productId}`,
        {},
      );
      const intent = await http.post<{ id: string }>("/payments/intents", {
        referenceType: "benefit_purchase",
        referenceId: purchase.id,
        idempotencyKey: `benefit-purchase-${purchase.id}`,
        returnUrl:
          typeof window === "undefined"
            ? "https://club4me.local/return"
            : window.location.href,
        walletAmount: 0,
      });
      return http.post(`/payments/intents/${intent.id}/mock/decision`, {
        status: "paid",
      });
    },
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ["benefits", "entitlements"] }),
  });
}
