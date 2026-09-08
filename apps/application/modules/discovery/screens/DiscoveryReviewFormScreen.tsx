"use client";

import { useRouter } from "next/navigation";
import { Button, Card, toast } from "@heroui/react";
import {
  useClubReviews,
  useCreateClubReview,
  useCreateServiceReview,
  usePublicClub,
  useServiceReviews,
} from "@api";
import {
  useCatalogClass,
  useCatalogClub,
  useCatalogCoach,
} from "@api/discovery";
import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";
import { ReviewForm } from "@modules/discovery/components/reviews";
import { FormPageSkeleton } from "@/components/loading-skeletons";

type ReviewTarget = "club" | "coach" | "class";

export function DiscoveryReviewFormScreen({
  type,
  id,
}: {
  type: ReviewTarget;
  id: string;
}) {
  const router = useRouter();
  const catalogClub = useCatalogClub(type === "club" ? id : "");
  const coach = useCatalogCoach(type === "coach" ? id : "");
  const classItem = useCatalogClass(type === "class" ? id : "");
  const clubId = type === "club" ? (catalogClub.data?.id ?? "") : "";
  const club = usePublicClub(clubId);
  const clubReviews = useClubReviews(clubId);
  const createReview = useCreateClubReview(clubId);
  const serviceReviews = useServiceReviews(
    type === "club" ? "coach" : type,
    type === "club" ? "" : id,
  );
  const createServiceReview = useCreateServiceReview(
    type === "club" ? "coach" : type,
    type === "club" ? "" : id,
  );
  const entityName =
    type === "club"
      ? (club.data?.name ?? catalogClub.data?.name ?? "باشگاه")
      : type === "coach"
        ? (coach.data?.displayName ?? "مربی")
        : (classItem.data?.title ?? "کلاس");
  const pending =
    type === "club"
      ? catalogClub.isPending || (Boolean(clubId) && club.isPending)
      : type === "coach"
        ? coach.isPending
        : classItem.isPending;
  if (pending) return <FormPageSkeleton fields={3} />;

  const reviewsPath = `/discovery/${type === "class" ? "classes" : `${type}s`}/${id}/reviews`;
  return (
    <main className="min-h-dvh bg-transparent pb-[calc(2rem+env(safe-area-inset-bottom))]">
      <SecondaryHeader
        title="ثبت نظر"
        showFilter={false}
        backHref={reviewsPath}
      />
      <section className="px-4 pt-5">
        {type === "club" ? (
          <ReviewForm
            entityName={entityName}
            criteria={type === "club" ? clubReviews.data?.criteria : []}
            isPending={createReview.isPending}
            onSubmit={async ({ rating, body, ratings }) => {
              try {
                await createReview.mutateAsync({ rating, body, ratings });
                await clubReviews.refetch();
                toast.success("نظر شما با موفقیت ثبت شد");
                router.replace(reviewsPath);
              } catch {
                toast.danger("ثبت نظر انجام نشد؛ دوباره تلاش کنید");
              }
            }}
          />
        ) : serviceReviews.isError ? (
          <Card className="rounded-3xl p-5">
            <Card.Title>دریافت وضعیت نظر انجام نشد</Card.Title>
            <Button className="mt-4" onPress={() => serviceReviews.refetch()}>
              تلاش دوباره
            </Button>
          </Card>
        ) : (
          <ReviewForm
            entityName={entityName}
            isPending={createServiceReview.isPending}
            onSubmit={async ({ rating, body, mediaIds }) => {
              try {
                await createServiceReview.mutateAsync({
                  rating,
                  body,
                  mediaIds,
                });
                await serviceReviews.refetch();
                toast.success("نظر شما با موفقیت ثبت شد");
                router.replace(reviewsPath);
              } catch {
                toast.danger(
                  "ثبت نظر انجام نشد؛ برای ثبت نظر باید حضور تأییدشده داشته باشید",
                );
              }
            }}
          />
        )}
      </section>
    </main>
  );
}
