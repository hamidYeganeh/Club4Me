"use client";
import { Button, Input } from "@heroui/react";
import { FormSelect, FormOption } from "@repo/ui/form-select";
import { RequestFailureState } from "@/components/request-failure-state";
import { useState } from "react";
import { useRecordBrowser } from "@/components/record-browser";
import { DiscoveryVirtualItems } from "../../components/DiscoveryViewport";
import { DiscoveryPagination } from "../../components/DiscoveryPagination";
import { ResourceIcon } from "@/components/resource-icon";
import { DiscoveryQueryPage } from "../../components/DiscoveryQueryPage";
import { getQueryFailure } from "@/lib/request-failure";

import { useClubReviews, usePublicClub, useServiceReviews } from "@api";
import {
  useCatalogClass,
  useCatalogClub,
  useCatalogCoach,
} from "@api/discovery";
import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";
import {
  ReviewCard,
  ReviewEmptyState,
  ReviewersCard,
  ReviewSummary,
  type ReviewCardItem,
} from "@modules/discovery/components/reviews";
import {
  ReviewListSkeleton,
  ReviewsPageSkeleton,
} from "@/components/loading-skeletons";

type ReviewTarget = "club" | "coach" | "class";

export function DiscoveryReviewsScreen({
  type,
  id,
}: {
  type: ReviewTarget;
  id: string;
}) {
  const catalogClub = useCatalogClub(type === "club" ? id : "");
  const coach = useCatalogCoach(type === "coach" ? id : "");
  const classItem = useCatalogClass(type === "class" ? id : "");
  const clubId = type === "club" ? (catalogClub.data?.id ?? "") : "";
  const [page, setPage] = useState(1);
  const [reviewQuery, setReviewQuery] = useState("");
  const [rating, setRating] = useState("");
  const clubReviews = useClubReviews(clubId, { page, limit: 20, q: reviewQuery, rating });
  const serviceReviews = useServiceReviews(
    type === "club" ? "coach" : type,
    type === "club" ? "" : id,
  );
  const club = usePublicClub(clubId);
  const entityName =
    type === "club"
      ? (club.data?.name ?? catalogClub.data?.name ?? "باشگاه")
      : type === "coach"
        ? (coach.data?.displayName ?? "مربی")
        : (classItem.data?.title ?? "کلاس");
  const sourceReviews =
    type === "club" ? clubReviews.data?.items : serviceReviews.data?.items;
  const reviews: ReviewCardItem[] = (sourceReviews ?? []).map((review) => ({
    id: review.id,
    author: "کاربر کلاب‌فورمی",
    rating: review.rating,
    title: review.title,
    body: review.body,
    createdAt: review.createdAt,
    verified:
      "isVerifiedAttendance" in review
        ? review.isVerifiedAttendance === true
        : review.isVerifiedBooking === true,
    ownerResponse: review.ownerResponse,
    mediaUrls: "mediaUrls" in review ? review.mediaUrls : undefined,
    criteria:
      "ratings" in review
        ? Object.entries(review.ratings ?? {}).flatMap(([id, value]) =>
            review.criterionLabels?.[id]
              ? [{ name: review.criterionLabels[id]!, value }]
              : [],
          )
        : [],
  }));
  const average =
    type === "club"
      ? (clubReviews.data?.averageRating ?? 0)
      : (serviceReviews.data?.averageRating ?? 0);
  const reviewCount =
    type === "club"
      ? (clubReviews.data?.reviewsCount ?? 0)
      : (serviceReviews.data?.reviewsCount ?? 0);
  const distribution = [5, 4, 3, 2, 1].map(
    (rating) =>
      reviews.filter((review) => Math.round(review.rating) === rating).length,
  );
  const browser = useRecordBrowser(reviews, {
    label: "نظرها",
    text: (item) => `${item.title ?? ""} ${item.body ?? ""}`,
    status: (item) => `${item.rating} ستاره`,
  });
  const visibleReviews = [...browser.items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const entityQuery = type === "club" ? catalogClub : type === "coach" ? coach : classItem;
  if (getQueryFailure(entityQuery.error, entityQuery.fetchStatus) && !entityQuery.data)
    return <DiscoveryQueryPage title={`نظر کاربران ${entityName}`} query={entityQuery} />;
  const isPagePending =
    type === "club"
      ? catalogClub.isPending ||
        (Boolean(clubId) && club.isPending)
      : type === "coach"
        ? coach.isPending || serviceReviews.isPending
        : classItem.isPending || serviceReviews.isPending;
  if (isPagePending) return <ReviewsPageSkeleton />;

  return (
    <main className="min-h-dvh w-full max-w-full overflow-x-hidden bg-transparent pb-[calc(2rem+env(safe-area-inset-bottom))]">
      <SecondaryHeader title={`نظر کاربران ${entityName}`} showFilter={false} />
      <div className="px-4 pt-4">{type === "club" ? <div className="grid gap-3">
        <Input aria-label="جست‌وجو در همه نظرها" placeholder="جست‌وجو در همه نظرها" value={reviewQuery} onChange={(event) => { setReviewQuery(event.target.value); setPage(1); }} />
        <FormSelect aria-label="فیلتر امتیاز نظرها" value={rating} onChange={(value) => { setRating(value); setPage(1); }}><FormOption value="">همه امتیازها</FormOption>{[5,4,3,2,1].map((value) => <FormOption key={value} value={value}>{value} ستاره</FormOption>)}</FormSelect>
      </div> : browser.controls}</div>
      <section className="space-y-5 px-4 pt-5">
        <ReviewSummary
          type={type}
          average={average}
          count={reviewCount}
          distribution={type === "club" ? (clubReviews.data?.distribution ?? distribution) : distribution}
        />
        <ReviewersCard
          count={reviewCount}
          href={`/discovery/${type === "class" ? "classes" : `${type}s`}/${id}/reviews/new`}
        />
        {type === "club" && (
          <div className="grid gap-2 sm:grid-cols-2">
            {clubReviews.data?.criteriaSummary?.map((item) => (
              <div
                key={item.id}
                className="rounded-xl bg-surface-secondary p-3 text-sm"
              >
                <ResourceIcon icon={item.icon} /> {item.name}:{" "}
                {item.reviewsCount
                  ? `${item.averageRating.toFixed(1)} از ۵ · ${item.reviewsCount} رأی`
                  : "هنوز ارزیابی نشده"}
              </div>
            ))}
          </div>
        )}
        <div className="pt-2">
          <h2 className="text-lg font-black text-foreground">نظر کاربران</h2>
          <p className="mt-1 text-xs text-muted">
            تجربه‌های واقعی اعضای کلاب‌فورمی
          </p>
        </div>
        {(type === "club" ? clubReviews.isError : serviceReviews.isError) ? <RequestFailureState error={type === "club" ? clubReviews.error : serviceReviews.error} onRetry={() => { if (type === "club") void clubReviews.refetch(); else void serviceReviews.refetch(); }} /> : (
          type === "club" ? clubReviews.isPending : serviceReviews.isPending
        ) ? (
          <ReviewListSkeleton count={3} />
        ) : (
          <div className="space-y-3">
            <DiscoveryVirtualItems>
              {visibleReviews.slice(0, page * 20).map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </DiscoveryVirtualItems>
            {type === "club" ? <nav aria-label="صفحه‌های نظرها" className="flex items-center justify-between gap-3"><Button variant="secondary" isDisabled={page === 1 || clubReviews.isFetching} onPress={() => setPage(page - 1)}>صفحه قبل</Button><span className="text-xs">{page.toLocaleString("fa-IR")} از {Math.max(1, clubReviews.data?.totalPages ?? 1).toLocaleString("fa-IR")}</span><Button variant="secondary" isDisabled={page >= (clubReviews.data?.totalPages ?? 1) || clubReviews.isFetching} onPress={() => setPage(page + 1)}>صفحه بعد</Button></nav> : <DiscoveryPagination
              page={page}
              total={visibleReviews.length}
              limit={20}
              onChange={setPage}
            />}
            {!visibleReviews.length ? (
              <ReviewEmptyState
                title={reviewQuery || rating ? "نظری مطابق فیلترها پیدا نشد" : "هنوز نظری ثبت نشده"}
                description="اولین نفری باشید که تجربه‌اش را به اشتراک می‌گذارد."
              />
            ) : null}
          </div>
        )}
      </section>
    </main>
  );
}
