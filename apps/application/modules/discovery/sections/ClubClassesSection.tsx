"use client";

import { ClubEmptyState } from "@modules/discovery/components/ClubEmptyState";

import { Button, Typography } from "@heroui/react";
import { useCatalogClasses } from "@api/discovery";
import { usePublicClubClasses } from "@api";

import { DiscoveryResultCardSkeleton } from "@/components/loading-skeletons";
import { ClassCard } from "@modules/discovery/components/ClassCard";
import { DiscoverySectionHeader } from "@modules/discovery/components/DiscoverySectionHeader";

export function ClubClassesSection({ clubId }: { clubId: string }) {
  const classes = useCatalogClasses({ clubId, limit: 6 });
  const businessClasses = usePublicClubClasses({ clubId, limit: 6 });
  const items = classes.data?.items ?? [];
  const businessItems = businessClasses.data?.items ?? [];
  const pending = classes.isPending || businessClasses.isPending;

  return (
    <section
      aria-labelledby="club-classes-title"
      aria-busy={pending}
      className="relative z-10 w-full min-w-0 overflow-hidden bg-background px-5 pb-8"
    >
      <DiscoverySectionHeader
        id="club-classes-title"
        title="کلاس‌های این باشگاه"
        subtitle={
          classes.data
            ? `${(classes.data.total + (businessClasses.data?.total ?? 0)).toLocaleString("fa-IR")} کلاس برای ثبت‌نام`
            : "برنامه کلاس‌های برگزارشده در این مجموعه"
        }
        viewAllLabel="مشاهده همه"
        viewAllUrl={`/discovery/classes?clubId=${clubId}`}
        icon="calendar-1"
      />

      {pending ? (
        <div className="mt-4">
          <DiscoveryResultCardSkeleton count={2} />
        </div>
      ) : null}

      {classes.isError || businessClasses.isError ? (
        <div className="app-surface mt-4 rounded-[1.35rem] p-5 text-center">
          <Typography type="body-sm" color="muted">
            دریافت کلاس‌های باشگاه انجام نشد.
          </Typography>
          <Button
            size="sm"
            variant="secondary"
            className="mt-3"
            onPress={() => {
              void classes.refetch();
              void businessClasses.refetch();
            }}
          >
            تلاش دوباره
          </Button>
        </div>
      ) : null}

      {!classes.isPending &&
      !businessClasses.isPending &&
      !classes.isError &&
      !businessClasses.isError &&
      items.length === 0 &&
      businessItems.length === 0 ? (
        <div className="mt-4">
          <ClubEmptyState
            title="هنوز کلاسی منتشر نشده است"
            description="برنامه کلاس‌های این باشگاه پس از انتشار اینجا نمایش داده می‌شود."
          />
        </div>
      ) : null}

      {!pending && (items.length > 0 || businessItems.length > 0) ? (
        <div
          className="-mx-5 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none]"
          aria-label="کلاس‌های این باشگاه"
        >
          {businessItems.map((item) => (
            <ClassCard
              key={`business-${item.id}`}
              title={item.title}
              description={
                item.description || item.coach?.name || item.club.name
              }
              remaining={item.remainingCapacity}
              price={item.price}
              currency={item.currency}
              startAt={item.startDate}
              href={`/discovery/business-class?classId=${item.id}`}
              badge="کلاس باشگاه"
              className="w-[min(78vw,19rem)] shrink-0 snap-start"
            />
          ))}
          {items.map((item) => (
            <ClassCard
              key={item.id}
              title={item.title}
              description={item.description}
              imageUrl={item.imageUrl}
              remaining={item.capacity - item.enrollmentCount}
              price={item.price.amount}
              currency={item.price.currency}
              startAt={item.courseStartAt}
              href={`/discovery/classes/${item.slug}`}
              badge={item.deliveryMode === "online" ? "آنلاین" : "حضوری"}
              className="w-[min(78vw,19rem)] shrink-0 snap-start"
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
