"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { http } from "../../http/client";
import type {
  ClubReview,
  ClubReviewsResponse,
  CreateClubReviewPayload,
  PublicClubDetails,
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
    onSuccess: async () =>
      queryClient.invalidateQueries({
        queryKey: ["public", "clubs", clubId, "reviews"],
      }),
  });
}
