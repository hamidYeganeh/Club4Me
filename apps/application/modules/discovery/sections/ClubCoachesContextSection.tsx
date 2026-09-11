"use client";

import { usePublicClubClasses } from "@api";
import { useState } from "react";
import { DiscoveryPagination } from "@modules/discovery/components/DiscoveryPagination";
import { CoachCard } from "@ui/coach-card";

export function ClubCoachesContextSection({
  clubId,
  timezone,
}: {
  clubId: string;
  timezone: string;
}) {
  const [page, setPage] = useState(1);
  const classes = usePublicClubClasses({ clubId, page, limit: 20 });
  const items = classes.data?.items ?? [];
  const coaches = [
    ...new Map(
      items.flatMap((item) =>
        item.coach ? [[item.coach.id, item.coach] as const] : [],
      ),
    ).values(),
  ];
  if (classes.isPending)
    return (
      <p className="px-5 pb-6 text-sm text-muted">
        در حال دریافت مربی‌های باشگاه…
      </p>
    );
  if (classes.isError)
    return (
      <div className="px-5 pb-6 text-sm">
        دریافت مربی‌ها انجام نشد.{" "}
        <button type="button" onClick={() => void classes.refetch()}>
          تلاش دوباره
        </button>
      </div>
    );
  if (!coaches.length && !classes.data?.total) return null;
  return (
    <section className="mx-auto w-full max-w-4xl space-y-3 overflow-hidden px-5 pb-8">
      <h2 className="text-xl font-bold">مربی‌ها در این باشگاه</h2>
      <p className="text-xs text-muted">
        بر اساس کلاس‌های این صفحه و جلسات منتشرشده این باشگاه
      </p>
      <div className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {coaches.map((coach) => {
          const teaching = items.filter((item) => item.coach?.id === coach.id);
          const nextSession = teaching
            .flatMap((item) => item.sessions)
            .filter((session) => Date.parse(session.startsAt) > Date.now())
            .sort(
              (first, second) =>
                Date.parse(first.startsAt) - Date.parse(second.startsAt),
            )[0];
          const dayLabel = nextSession
            ? new Intl.DateTimeFormat("fa-IR", {
                weekday: "long",
                timeZone: timezone,
              }).format(new Date(nextSession.startsAt))
            : "";

          return (
            <CoachCard
              key={coach.id}
              type="normal"
              title={coach.name}
              badge="مربی باشگاه"
              href={
                coach.profileSlug
                  ? `/discovery/coaches/${coach.profileSlug}`
                  : undefined
              }
              supportingText={
                teaching.map((item) => item.sport).filter(Boolean).join("، ") ||
                "مربی فعال باشگاه"
              }
              stats={[
                {
                  id: "classes",
                  icon: "academic-cap",
                  label: `${teaching.length.toLocaleString("fa-IR")} کلاس`,
                },
                { id: "next-session", icon: "calendar-1", label: dayLabel },
              ]}
              className="w-[min(78vw,276px)] snap-start rounded-[2rem]"
            />
          );
        })}
      </div>
      <DiscoveryPagination
        page={page}
        total={classes.data?.total ?? 0}
        limit={20}
        onChange={setPage}
        pending={classes.isFetching}
      />
    </section>
  );
}
