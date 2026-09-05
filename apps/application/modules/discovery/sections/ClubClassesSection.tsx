"use client";

import { Button, Typography } from "@heroui/react";
import { useCatalogClasses } from "@api/discovery";
import { usePublicClubClasses } from "@api";

import { ButtonLink } from "@/components/button-link";
import { DiscoveryResultCard } from "@modules/discovery/components/DiscoveryResultCard";
import { DiscoverySectionHeader } from "@modules/discovery/components/DiscoverySectionHeader";

export function ClubClassesSection({ clubId }: { clubId: string }) {
  const classes = useCatalogClasses({ clubId, limit: 6 });
  const businessClasses = usePublicClubClasses({ clubId });
  const items = classes.data?.items ?? [];
  const businessItems = businessClasses.data?.items ?? [];

  return (
    <section
      aria-labelledby="club-classes-title"
      aria-busy={classes.isPending}
      className="relative z-10 -mt-20 bg-background px-5 pb-8"
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

      {classes.isPending ? (
        <div className="mt-4 grid gap-3" aria-hidden>
          {[0, 1].map((item) => (
            <div
              key={item}
              className="app-card flex min-h-29 animate-pulse items-center gap-3 p-3 shadow-none motion-reduce:animate-none"
            >
              <div className="size-22 shrink-0 rounded-[1.15rem] bg-surface-secondary" />
              <div className="flex flex-1 flex-col gap-3">
                <div className="h-4 w-2/3 rounded-full bg-surface-secondary" />
                <div className="h-3 w-full rounded-full bg-surface-secondary" />
                <div className="h-3 w-1/3 rounded-full bg-surface-secondary" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {classes.isError ? (
        <div className="app-surface mt-4 rounded-[1.35rem] p-5 text-center">
          <Typography type="body-sm" color="muted">
            دریافت کلاس‌های باشگاه انجام نشد.
          </Typography>
          <Button
            size="sm"
            variant="secondary"
            className="mt-3"
            onPress={() => void classes.refetch()}
          >
            تلاش دوباره
          </Button>
        </div>
      ) : null}

      {!classes.isPending && !businessClasses.isPending && !classes.isError && !businessClasses.isError && items.length === 0 && businessItems.length === 0 ? (
        <div className="app-surface mt-4 rounded-[1.35rem] p-5 text-center">
          <Typography type="body-sm" color="muted">
            هنوز کلاس فعالی برای این باشگاه منتشر نشده است.
          </Typography>
        </div>
      ) : null}

      {items.length > 0 || businessItems.length > 0 ? (
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
            const remaining = Math.max(
              0,
              item.capacity - item.enrollmentCount,
            );
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
            href="/discovery/classes"
            variant="secondary"
            size="sm"
            className="mt-1 w-full"
          >
            همه کلاس‌ها
          </ButtonLink>
        </div>
      ) : null}
    </section>
  );
}
