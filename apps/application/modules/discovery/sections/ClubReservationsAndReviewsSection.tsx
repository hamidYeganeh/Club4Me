"use client";

import { ClubEmptyState } from "@modules/discovery/components/ClubEmptyState";

import { Button, Typography } from "@heroui/react";
import { useClubReviews } from "@api";
import { useTranslations } from "next-intl";

import { ReviewListSkeleton } from "@/components/loading-skeletons";
import { ButtonLink } from "@/components/button-link";

export function ClubReservationsAndReviewsSection({
  clubId,
}: {
  clubId: string;
}) {
  const t = useTranslations("discovery.clubBooking");
  const reviews = useClubReviews(clubId);

  return (
    <section className="mx-auto w-full max-w-4xl space-y-8 px-4 pb-8">
      <div>
        <div className="flex items-end justify-between">
          <Typography type="h4">{t("reviews")}</Typography>
          <Typography type="body-sm" color="muted">
            {t("ratingSummary", {
              rating: (reviews.data?.averageRating ?? 0).toFixed(1),
              count: reviews.data?.reviewsCount ?? 0,
            })}
          </Typography>
        </div>
        <ButtonLink
          href={`/discovery/clubs/${clubId}/reviews`}
          variant="secondary"
          className="mt-4 w-full"
        >
          مشاهده خلاصه امتیازها و همه نظرها
        </ButtonLink>
        <div className="mt-3 space-y-2">
          {reviews.isPending ? <ReviewListSkeleton count={2} /> : null}
          {reviews.isError ? (
            <div className="app-surface rounded-3xl p-5 text-center text-sm text-muted">
              دریافت نظرها انجام نشد.
              <Button
                variant="secondary"
                size="sm"
                className="mt-3"
                onPress={() => void reviews.refetch()}
              >
                تلاش دوباره
              </Button>
            </div>
          ) : !reviews.isPending && !reviews.data?.items.length ? (
            <ClubEmptyState
              title="هنوز نظری ثبت نشده است"
              description="پس از تجربه این باشگاه، نظر شما می‌تواند به انتخاب دیگران کمک کند."
            />
          ) : null}
          {!reviews.isPending &&
            (reviews.data?.items ?? []).map((review) => (
              <article
                key={review.id}
                className="rounded-2xl bg-surface-secondary p-4"
              >
                <Typography type="body-sm" weight="semibold">
                  {t("stars", { count: review.rating })}
                </Typography>
                {review.title && (
                  <Typography type="h6" weight="medium" className="mt-2">
                    {review.title}
                  </Typography>
                )}
                {review.body && (
                  <Typography type="body-sm" color="muted" className="mt-1">
                    {review.body}
                  </Typography>
                )}
              </article>
            ))}
        </div>
      </div>
    </section>
  );
}
