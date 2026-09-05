"use client";

import { useMemo, useState } from "react";
import { Button } from "@heroui/react";
import { useClubReviews, usePublicClub } from "@api";
import { useCatalogClass, useCatalogClub, useCatalogCoach } from "@api/discovery";
import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";
import { ReviewCard, ReviewersCard, ReviewSummary, type ReviewCardItem } from "@modules/discovery/components/reviews";
import { ReviewListSkeleton, ReviewsPageSkeleton } from "@/components/loading-skeletons";

type ReviewFilter = "recent" | "positive" | "negative";
type ReviewTarget = "club" | "coach" | "class";
const filters: Array<{ id: ReviewFilter; label: string }> = [
  { id: "recent", label: "جدیدترین" },
  { id: "positive", label: "مثبت" },
  { id: "negative", label: "منفی" },
];

export function DiscoveryReviewsScreen({ type, id }: { type: ReviewTarget; id: string }) {
  const catalogClub = useCatalogClub(type === "club" ? id : "");
  const coach = useCatalogCoach(type === "coach" ? id : "");
  const classItem = useCatalogClass(type === "class" ? id : "");
  const clubId = type === "club" ? (catalogClub.data?.id ?? "") : "";
  const clubReviews = useClubReviews(clubId);
  const club = usePublicClub(clubId);
  const [filter, setFilter] = useState<ReviewFilter>("recent");
  const entityName = type === "club" ? (club.data?.name ?? catalogClub.data?.name ?? "باشگاه") : type === "coach" ? (coach.data?.displayName ?? "مربی") : (classItem.data?.title ?? "کلاس");
  const reviews: ReviewCardItem[] = (clubReviews.data?.items ?? []).map((review) => ({
    id: review.id, author: "کاربر کلاب‌فورمی", rating: review.rating, title: review.title,
    body: review.body, createdAt: review.createdAt, verified: true,
  }));
  const average = type === "club" ? (clubReviews.data?.averageRating ?? 0) : type === "coach" ? (coach.data?.averageRating ?? 0) : 0;
  const reviewCount = type === "club" ? (clubReviews.data?.reviewsCount ?? 0) : type === "coach" ? (coach.data?.reviewsCount ?? 0) : 0;
  const distribution = [5, 4, 3, 2, 1].map((rating) => reviews.filter((review) => Math.round(review.rating) === rating).length);
  const visibleReviews = useMemo(() => {
    const sorted = [...reviews].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (filter === "positive") return sorted.filter((review) => review.rating >= 4);
    if (filter === "negative") return sorted.filter((review) => review.rating <= 2);
    return sorted;
  }, [filter, reviews]);
  const isPagePending = type === "club" ? catalogClub.isPending || (Boolean(clubId) && (clubReviews.isPending || club.isPending)) : type === "coach" ? coach.isPending : classItem.isPending;
  if (isPagePending) return <ReviewsPageSkeleton />;

  return (
    <main className="min-h-dvh w-full max-w-full overflow-x-hidden bg-transparent pb-[calc(2rem+env(safe-area-inset-bottom))]">
      <SecondaryHeader title={`نظر کاربران ${entityName}`} />
      <section className="space-y-5 px-4 pt-5">
        <ReviewSummary type={type} average={average} count={reviewCount} distribution={distribution} />
        <ReviewersCard count={reviewCount} href={`/discovery/${type === "class" ? "classes" : `${type}s`}/${id}/reviews/new`} />
        <div className="pt-2">
          <h2 className="text-lg font-black text-foreground">نظر کاربران</h2>
          <p className="mt-1 text-xs text-muted">تجربه‌های واقعی اعضای کلاب‌فورمی</p>
        </div>
        <div className="app-surface grid grid-cols-3 rounded-[1.2rem] p-1" role="group" aria-label="فیلتر نظرها">
          {filters.map((item) => <Button key={item.id} variant={filter === item.id ? "secondary" : "ghost"} size="sm" aria-pressed={filter === item.id} onPress={() => setFilter(item.id)} className={filter === item.id ? "bg-surface text-foreground shadow-sm" : "text-muted"}>{item.label}</Button>)}
        </div>
        {clubReviews.isPending && Boolean(clubId) ? <ReviewListSkeleton count={3} /> : (
          <div className="space-y-3">
            {visibleReviews.map((review) => <ReviewCard key={review.id} review={review} />)}
            {!visibleReviews.length ? <div className="rounded-3xl border border-dashed border-border px-6 py-12 text-center"><p className="font-bold text-foreground">هنوز نظری ثبت نشده</p><p className="mt-2 text-sm text-muted">اولین نفری باشید که تجربه‌اش را به اشتراک می‌گذارد.</p></div> : null}
          </div>
        )}
      </section>
    </main>
  );
}
