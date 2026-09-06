"use client";

import { Button, Typography } from "@heroui/react";
import { useClubReviews } from "@api";
import { useTranslations } from "next-intl";
import {
  ReviewEmptyState,
  ReviewSummary,
} from "@modules/discovery/components/reviews";

import { ReviewListSkeleton } from "@/components/loading-skeletons";
import { ButtonLink } from "@/components/button-link";

export function ClubReservationsAndReviewsSection({
  clubId,
}: {
  clubId: string;
}) {
  const t = useTranslations("discovery.clubBooking");
  const reviews = useClubReviews(clubId);
  const items = reviews.data?.items ?? [];
  const distribution = [5, 4, 3, 2, 1].map(
    (rating) =>
      items.filter((review) => Math.round(review.rating) === rating).length,
  );

  return (
    <section className="mx-auto w-full max-w-4xl space-y-8 px-4 pb-8">
      <div>
        {!reviews.isPending && reviews.data ? (
          <ReviewSummary
            type="club"
            average={reviews.data.averageRating}
            count={reviews.data.reviewsCount}
            distribution={distribution}
          />
        ) : null}
        <div className="mb-4 mt-4 grid gap-2 sm:grid-cols-2">
          {reviews.data?.criteriaSummary?.map((item) => (
            <div
              key={item.id}
              className="rounded-xl bg-surface-secondary p-3 text-sm"
            >
              {item.name}:{" "}
              {item.reviewsCount
                ? `${item.averageRating.toFixed(1)} از ۵ · ${item.reviewsCount} رأی`
                : "هنوز ارزیابی نشده"}
            </div>
          ))}
        </div>
        <Typography
          type="h4"
          className={reviews.data?.reviewsCount ? "mt-8" : undefined}
        >
          {t("reviews")}
        </Typography>
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
            <ReviewEmptyState
              title="هنوز نظری ثبت نشده است"
              description="پس از تجربه این باشگاه، نظر شما می‌تواند به انتخاب دیگران کمک کند."
            />
          ) : null}
          {!reviews.isPending &&
            items.map((review) => (
              <article
                key={review.id}
                className="rounded-2xl bg-surface-secondary p-4"
              >
                <Typography type="body-sm" weight="semibold">
                  {t("stars", { count: review.rating })}
                </Typography>
                {review.isVerifiedBooking && (
                  <p className="mt-1 text-xs text-muted">
                    دارای رزرو تکمیل‌شده
                  </p>
                )}
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
