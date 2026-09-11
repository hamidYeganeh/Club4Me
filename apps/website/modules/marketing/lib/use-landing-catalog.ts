"use client";
import { useCatalogClubs } from "@api/discovery";
export function useLandingClubs(limit = 4) {
  const query = useCatalogClubs({ limit });
  return {
    ...query,
    clubs: (query.data?.items ?? []).map((club) => ({
      id: club.id,
      slug: club.slug,
      title: club.name,
      subtitle: club.address || club.shortDescription,
      image: club.imageUrl ?? "",
      rating: club.reviewsCount > 0 ? club.averageRating : undefined,
      ratingCount: club.reviewsCount || undefined,
      features: club.tags.map((label) => ({ label })),
    })),
  };
}
