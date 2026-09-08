"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { http } from "../../http/client";
import { trackReviewSubmitted } from "../../tracking/tracking";
import type {
  ClubReview,
  ClubReviewsResponse,
  CreateClubReviewPayload,
  PublicClubDetails,
  CreateServiceReviewPayload,
  ServiceReview,
  ServiceReviewsResponse,
  ServiceReviewTarget,
} from "./clubs.dto";

export const publicClubsClient = {
  get: (clubId: string) =>
    http.get<PublicClubDetails>(`/public/clubs/${clubId}`),
  reviews: (clubId: string) =>
    http.get<ClubReviewsResponse>(`/public/clubs/${clubId}/reviews`),
  createReview: (clubId: string, payload: CreateClubReviewPayload) =>
    http.post<ClubReview>(`/clubs/${clubId}/reviews`, payload),
};

export function usePublicClub(clubId: string) {
  return useQuery({
    queryKey: ["public", "clubs", clubId],
    queryFn: () => publicClubsClient.get(clubId),
    enabled: /^[a-f\d]{24}$/i.test(clubId),
  });
}

export function useClubReviews(clubId: string) {
  return useQuery({
    queryKey: ["public", "clubs", clubId, "reviews"],
    queryFn: () => publicClubsClient.reviews(clubId),
    enabled: /^[a-f\d]{24}$/i.test(clubId),
  });
}

export function useCreateClubReview(clubId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateClubReviewPayload) =>
      publicClubsClient.createReview(clubId, payload),
    onSuccess: async (_review, payload) => {
      trackReviewSubmitted({
        review_target_type: "club",
        review_target_id: clubId,
        rating: payload.rating,
      });
      return queryClient.invalidateQueries({
        queryKey: ["public", "clubs", clubId, "reviews"],
      });
    },
  });
}

export function useRespondToClubReview(clubId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reviewId, body }: { reviewId: string; body: string }) =>
      http.patch<ClubReview>(
        `/business/clubs/${clubId}/reviews/${reviewId}/response`,
        { body },
      ),
    onSuccess: async () =>
      queryClient.invalidateQueries({
        queryKey: ["public", "clubs", clubId, "reviews"],
      }),
  });
}

export function useServiceReviews(type: ServiceReviewTarget, targetId: string) {
  return useQuery({
    queryKey: ["public", "reviews", type, targetId],
    queryFn: () =>
      http.get<ServiceReviewsResponse>(`/public/reviews/${type}/${targetId}`),
    enabled: /^[a-f\d]{24}$/i.test(targetId),
  });
}

export function useCreateServiceReview(
  type: ServiceReviewTarget,
  targetId: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateServiceReviewPayload) =>
      http.post<ServiceReview>(`/reviews/${type}/${targetId}`, payload),
    onSuccess: async (_review, payload) => {
      trackReviewSubmitted({
        review_target_type: type,
        review_target_id: targetId,
        rating: payload.rating,
      });
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["public", "reviews", type, targetId],
        }),
        queryClient.invalidateQueries({ queryKey: ["discovery"] }),
      ]);
    },
  });
}

export function useAdminServiceReviews(status?: ServiceReview["status"]) {
  return useQuery({
    queryKey: ["admin", "service-reviews", status],
    queryFn: () =>
      http.get<{ items: ServiceReview[] }>(
        `/admin/service-reviews${status ? `?status=${status}` : ""}`,
      ),
  });
}

export function useModerateServiceReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      reviewId,
      status,
      reason = "",
    }: {
      reviewId: string;
      status: "published" | "hidden";
      reason?: string;
    }) =>
      http.patch<ServiceReview>(`/admin/service-reviews/${reviewId}`, {
        status,
        reason,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "service-reviews"] }),
  });
}
