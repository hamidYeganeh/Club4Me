"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { http } from "../../http/client";

export type PaymentIntent = {
  id: string;
  provider: "mock";
  authority: string;
  referenceType: "reservation" | "benefit_purchase";
  referenceId: string;
  amount: number;
  grossAmount: number;
  discountAmount: number;
  walletAmount: number;
  platformFee: number;
  refundedAmount: number;
  refundedGatewayAmount: number;
  refundedWalletAmount: number;
  refundedDiscountAmount: number;
  status: "pending" | "paid" | "failed" | "partially_refunded" | "refunded";
  checkoutUrl: string;
  returnUrl: string;
  paidAt: string | null;
  reconciledAt: string | null;
  createdAt: string;
};

export type Payout = {
  id: string;
  providerType: "club" | "coach";
  providerId: string;
  amount: number;
  iban: string;
  status: "requested" | "paid" | "rejected" | "cancelled";
  reviewNote: string;
  bankReference: string | null;
  reviewedAt: string | null;
  paidAt: string | null;
  createdAt: string;
};

export type PayoutBalance = {
  providerType: "club" | "coach";
  providerId: string;
  ledgerBalance: number;
  reservedAmount: number;
  availableAmount: number;
};

export const commerceClient = {
  createIntent: (payload: {
    referenceType: "reservation" | "benefit_purchase";
    referenceId: string;
    idempotencyKey: string;
    returnUrl: string;
    couponCode?: string;
    walletAmount?: number;
  }) => http.post<PaymentIntent>("/payments/intents", payload),
  decideMockPayment: (intentId: string, status: "paid" | "failed") =>
    http.post<PaymentIntent>(`/payments/intents/${intentId}/mock/decision`, {
      status,
    }),
  payoutBalance: (payload: {
    providerType: "club" | "coach";
    providerId?: string;
  }) => http.post<PayoutBalance>("/payouts/balance", payload),
  listPayouts: () => http.get<{ items: Payout[] }>("/payouts/mine"),
  requestPayout: (payload: {
    providerType: "club" | "coach";
    providerId?: string;
    amount: number;
    iban: string;
  }) => http.post<Payout>("/payouts", payload),
  listAdminPayouts: (status?: string) =>
    http.get<{ items: Payout[] }>(
      `/admin/payments/payouts${status ? `?status=${encodeURIComponent(status)}` : ""}`,
    ),
  reviewPayout: (
    payoutId: string,
    payload: {
      status: "paid" | "rejected";
      note: string;
      bankReference?: string;
    },
  ) => http.post<Payout>(`/admin/payments/payouts/${payoutId}/review`, payload),
  reconcile: () =>
    http.post<{
      checked: number;
      matched: number;
      mismatches: unknown[];
    }>("/admin/payments/reconciliation/run", {}),
  creditWallet: (payload: {
    userId: string;
    amount: number;
    source: "refund" | "promotion" | "referral" | "admin";
    idempotencyKey: string;
    note: string;
    expiresAt: string | null;
  }) => http.post("/admin/benefits/wallet/credits", payload),
  createDiscount: (payload: {
    code: string;
    title: string;
    kind: "percent" | "fixed";
    value: number;
    maxDiscount: number | null;
    minOrderAmount: number;
    budget: number;
    perUserLimit: number;
    clubIds: string[];
    startsAt: string;
    endsAt: string;
  }) => http.post("/admin/benefits/discounts", payload),
};

export function useCreatePaymentIntent() {
  return useMutation({ mutationFn: commerceClient.createIntent });
}

export function useMockPaymentDecision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      intentId,
      status,
    }: {
      intentId: string;
      status: "paid" | "failed";
    }) => commerceClient.decideMockPayment(intentId, status),
    onSuccess: async () =>
      queryClient.invalidateQueries({ queryKey: ["reservations"] }),
  });
}

export function usePayoutBalance(
  providerType: "club" | "coach",
  providerId?: string,
) {
  return useQuery({
    queryKey: ["payouts", "balance", providerType, providerId],
    queryFn: () => commerceClient.payoutBalance({ providerType, providerId }),
    enabled: providerType === "coach" || Boolean(providerId),
  });
}

export function usePayouts() {
  return useQuery({
    queryKey: ["payouts", "mine"],
    queryFn: commerceClient.listPayouts,
  });
}

export function useRequestPayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: commerceClient.requestPayout,
    onSuccess: async () =>
      queryClient.invalidateQueries({ queryKey: ["payouts"] }),
  });
}

export function useAdminPayouts(status?: string) {
  return useQuery({
    queryKey: ["admin", "payouts", status],
    queryFn: () => commerceClient.listAdminPayouts(status),
  });
}

export function useReviewPayout() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      payoutId,
      ...payload
    }: {
      payoutId: string;
      status: "paid" | "rejected";
      note: string;
      bankReference?: string;
    }) => commerceClient.reviewPayout(payoutId, payload),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ["admin", "payouts"] }),
  });
}

export function useRunReconciliation() {
  return useMutation({ mutationFn: commerceClient.reconcile });
}

export function useCreditWallet() {
  return useMutation({ mutationFn: commerceClient.creditWallet });
}

export function useCreateDiscountCampaign() {
  return useMutation({ mutationFn: commerceClient.createDiscount });
}
