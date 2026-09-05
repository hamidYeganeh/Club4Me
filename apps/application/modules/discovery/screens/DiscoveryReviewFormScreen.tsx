"use client";

import { useRouter } from "next/navigation";
import { toast } from "@heroui/react";
import { useClubReviews, useCreateClubReview, usePublicClub } from "@api";
import { useCatalogClass, useCatalogClub, useCatalogCoach } from "@api/discovery";
import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";
import { ReviewForm } from "@modules/discovery/components/reviews";
import { FormPageSkeleton } from "@/components/loading-skeletons";

type ReviewTarget = "club" | "coach" | "class";

export function DiscoveryReviewFormScreen({ type, id }: { type: ReviewTarget; id: string }) {
  const router = useRouter();
  const catalogClub = useCatalogClub(type === "club" ? id : "");
  const coach = useCatalogCoach(type === "coach" ? id : "");
  const classItem = useCatalogClass(type === "class" ? id : "");
  const clubId = type === "club" ? (catalogClub.data?.id ?? "") : "";
  const club = usePublicClub(clubId);
  const clubReviews = useClubReviews(clubId);
  const createReview = useCreateClubReview(clubId);
  const entityName = type === "club"
    ? (club.data?.name ?? catalogClub.data?.name ?? "باشگاه")
    : type === "coach"
      ? (coach.data?.displayName ?? "مربی")
      : (classItem.data?.title ?? "کلاس");
  const pending = type === "club"
    ? catalogClub.isPending || (Boolean(clubId) && club.isPending)
    : type === "coach" ? coach.isPending : classItem.isPending;
  if (pending) return <FormPageSkeleton fields={3} />;

  const reviewsPath = `/discovery/${type === "class" ? "classes" : `${type}s`}/${id}/reviews`;
  return (
    <main className="min-h-dvh bg-transparent pb-[calc(2rem+env(safe-area-inset-bottom))]">
      <SecondaryHeader title="ثبت نظر" />
      <section className="px-4 pt-5">
        <ReviewForm
          entityName={entityName}
          isPending={createReview.isPending}
          onSubmit={async ({ rating, body }) => {
            if (type !== "club") {
              toast.success("نظر شما دریافت شد؛ ثبت نظر این بخش به‌زودی فعال می‌شود");
              router.replace(reviewsPath);
              return;
            }
            try {
              await createReview.mutateAsync({ rating, body });
              await clubReviews.refetch();
              toast.success("نظر شما با موفقیت ثبت شد");
              router.replace(reviewsPath);
            } catch {
              toast.danger("ثبت نظر انجام نشد؛ دوباره تلاش کنید");
            }
          }}
        />
      </section>
    </main>
  );
}
