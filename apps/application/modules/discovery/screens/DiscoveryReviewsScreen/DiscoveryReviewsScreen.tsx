"use client";

import { useMemo, useState } from "react";
import { Button, Card, Spinner, Typography } from "@heroui/react";
import { useClubReviews, usePublicClub } from "@api";
import { Icon } from "@theme/icon";

import { DiscoveryPageHeader } from "@modules/discovery/components/DiscoveryPageHeader";

type ReviewFilter = "recent" | "positive" | "negative";

type ReviewItem = {
  id: string;
  author: string;
  rating: number;
  body: string;
  createdAt: string;
};

const filters: Array<{ id: ReviewFilter; label: string }> = [
  { id: "recent", label: "جدیدترین" },
  { id: "positive", label: "مثبت" },
  { id: "negative", label: "منفی" },
];

function formatRelativeDate(value: string) {
  const days = Math.max(
    1,
    Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000),
  );
  if (days < 7) return `${days.toLocaleString("fa-IR")} روز پیش`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks.toLocaleString("fa-IR")} هفته پیش`;
  const months = Math.floor(days / 30);
  return `${months.toLocaleString("fa-IR")} ماه پیش`;
}

function RatingDistribution({ reviews }: { reviews: ReviewItem[] }) {
  const counts = [5, 4, 3, 2, 1].map(
    (rating) =>
      reviews.filter((review) => Math.round(review.rating) === rating).length,
  );
  const max = Math.max(...counts, 1);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2" dir="ltr">
      {counts.map((count, index) => {
        const rating = 5 - index;
        return (
          <div
            key={rating}
            className="grid grid-cols-[12px_18px_1fr] items-center gap-2"
          >
            <span className="text-xs tabular-nums text-muted">{rating}</span>
            <Icon name="star-full" size={14} className="text-accent" />
            <div className="h-2 overflow-hidden rounded-full bg-surface-tertiary">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-500"
                style={{ width: `${(count / max) * 100}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DiscoveryReviewsScreen({
  type,
  id,
}: {
  type: "club" | "coach";
  id: string;
}) {
  const clubReviews = useClubReviews(type === "club" ? id : "");
  const club = usePublicClub(type === "club" ? id : "");
  const [filter, setFilter] = useState<ReviewFilter>("recent");
  const entityName = type === "club" ? (club.data?.name ?? "باشگاه") : "مربی";
  const apiItems: ReviewItem[] = (clubReviews.data?.items ?? []).map(
    (review) => ({
      id: review.id,
      author: "کاربر جیم‌فورمی",
      rating: review.rating,
      body: review.body,
      createdAt: review.createdAt,
    }),
  );
  const reviews = apiItems;
  const average = clubReviews.data?.averageRating ?? 0;
  const reviewCount = clubReviews.data?.reviewsCount ?? 0;

  const visibleReviews = useMemo(() => {
    const sorted = [...reviews].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    if (filter === "positive")
      return sorted.filter((review) => review.rating >= 4);
    if (filter === "negative")
      return sorted.filter((review) => review.rating <= 2);
    return sorted;
  }, [filter, reviews]);

  return (
    <main className="min-h-dvh w-full max-w-full overflow-x-hidden bg-transparent pb-[calc(2rem+env(safe-area-inset-bottom))]">
      <DiscoveryPageHeader title="نظر کاربران" description={entityName} />

      <section className="space-y-5 px-4 pt-5">
        <Card className="app-card app-reveal p-5 shadow-none">
          <div className="flex items-center gap-6">
            <div className="w-28 shrink-0 text-center">
              <Typography
                type="h1"
                weight="bold"
                className="leading-none tabular-nums"
              >
                {average.toLocaleString("fa-IR", {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}
              </Typography>
              <div
                className="mt-3 flex justify-center gap-0.5"
                dir="ltr"
                aria-label={`${average} از ۵`}
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <Icon
                    key={star}
                    name="star-full"
                    size={15}
                    className={
                      star <= Math.round(average)
                        ? "text-accent"
                        : "text-surface-tertiary"
                    }
                  />
                ))}
              </div>
              <Typography type="body-xs" color="muted" className="mt-2">
                {reviewCount.toLocaleString("fa-IR")} نظر
              </Typography>
            </div>
            <RatingDistribution reviews={reviews} />
          </div>
        </Card>

        <div
          className="app-surface app-reveal grid grid-flow-dense grid-cols-3 rounded-[1.2rem] p-1"
          role="group"
          aria-label="فیلتر نظرها"
        >
          {filters.map((item) => (
            <Button
              key={item.id}
              variant={filter === item.id ? "secondary" : "ghost"}
              size="sm"
              aria-pressed={filter === item.id}
              onPress={() => setFilter(item.id)}
              className={
                filter === item.id
                  ? "bg-surface text-foreground shadow-sm"
                  : "text-muted"
              }
            >
              {item.label}
            </Button>
          ))}
        </div>

        {clubReviews.isPending && /^[a-f\d]{24}$/i.test(id) ? (
          <div className="flex min-h-40 items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-3">
            {visibleReviews.map((review) => (
              <Card key={review.id} className="app-card app-stack-card p-5 shadow-none">
                <div className="flex items-start gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-base font-bold text-accent-foreground">
                    {review.author.slice(0, 1)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Typography
                      type="body-sm"
                      weight="bold"
                      className="truncate text-base"
                    >
                      {review.author}
                    </Typography>
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted">
                      <span className="inline-flex items-center gap-1 font-bold text-accent">
                        <Icon name="star-full" size={15} />
                        {review.rating.toLocaleString("fa-IR")}
                      </span>
                      <span aria-hidden>·</span>
                      <span>{formatRelativeDate(review.createdAt)}</span>
                    </div>
                  </div>
                  <Button
                    isIconOnly
                    variant="ghost"
                    size="sm"
                    aria-label="گزینه‌های نظر"
                  >
                    <Icon name="kebab" size={20} />
                  </Button>
                </div>
                <Typography
                  type="body-sm"
                  color="muted"
                  className="mt-4 leading-7"
                >
                  {review.body}
                </Typography>
              </Card>
            ))}
            {visibleReviews.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted">
                نظری در این دسته وجود ندارد.
              </div>
            ) : null}
          </div>
        )}
      </section>
    </main>
  );
}
