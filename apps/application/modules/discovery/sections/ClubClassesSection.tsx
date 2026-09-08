"use client";

import { ClubEmptyState } from "@modules/discovery/components/ClubEmptyState";

import { Button, Typography } from "@heroui/react";
import { useCatalogClasses } from "@api/discovery";
import { usePublicClubClasses } from "@api";

import { ButtonLink } from "@/components/button-link";
import { DiscoveryResultCardSkeleton } from "@/components/loading-skeletons";
import { DiscoveryResultCard } from "@modules/discovery/components/DiscoveryResultCard";
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
        <div className="mt-4 flex flex-col gap-3">
          {businessItems.map((item) => (
            <DiscoveryResultCard
              key={`business-${item.id}`}
              title={item.title}
              subtitle={item.description || item.coach?.name || item.club.name}
              meta={`${item.remainingCapacity.toLocaleString("fa-IR")} جای خالی`}
              imageUrl={null}
              href={`/discovery/business-class?classId=${item.id}`}
              badge="کلاس باشگاه"
            />
          ))}
          {items.map((item) => {
            const remaining = Math.max(0, item.capacity - item.enrollmentCount);
            return (
              <DiscoveryResultCard
                key={item.id}
                title={item.title}
                subtitle={
                  item.description ||
                  (item.deliveryMode === "online" ? "آنلاین" : "حضوری")
                }
                meta={`${remaining.toLocaleString("fa-IR")} جای خالی`}
                imageUrl={item.imageUrl}
                href={`/discovery/classes/${item.slug}`}
                badge="کلاس"
              />
            );
          })}
          <ButtonLink
            href={`/discovery/classes?clubId=${clubId}`}
            variant="secondary"
            size="sm"
            className="mt-1 w-full"
          >
            همه کلاس‌های این باشگاه
          </ButtonLink>
        </div>
      ) : null}
    </section>
  );
}
