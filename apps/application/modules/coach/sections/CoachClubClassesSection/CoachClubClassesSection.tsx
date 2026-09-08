"use client";

import { Card, Chip, Typography } from "@heroui/react";
import { useCoachClubClasses } from "@api";
import { ButtonLink } from "@/components/button-link";
import { CompactCardListSkeleton } from "@/components/loading-skeletons";

const statusLabel: Record<string, string> = {
  draft: "پیش‌نویس",
  active: "فعال",
  paused: "متوقف",
  completed: "تمام‌شده",
  cancelled: "لغوشده",
};

export function CoachClubClassesSection() {
  const query = useCoachClubClasses();
  return (
    <section aria-labelledby="assigned-club-classes">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <Typography id="assigned-club-classes" type="h4" weight="bold">
            کلاس‌های واگذارشده باشگاه
          </Typography>
          <p className="mt-1 text-xs text-muted">
            برنامه، شاگردها و حضور‌وغیاب
          </p>
        </div>
        <span className="text-sm text-muted">
          {(query.data?.items.length ?? 0).toLocaleString("fa-IR")}
        </span>
      </div>
      {query.isPending ? <CompactCardListSkeleton count={2} /> : null}
      <div className="flex flex-col gap-3">
        {(query.data?.items ?? []).map((item) => (
          <ButtonLink
            key={item.id}
            href={`/coach/club-classes?classId=${item.id}`}
            variant="ghost"
            className="h-auto justify-stretch p-0 text-start no-underline"
          >
            <Card className="app-card w-full rounded-2xl p-4 shadow-none">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{item.title}</p>
                  <p className="mt-1 text-xs text-muted">
                    {item.club.name} ·{" "}
                    {item.enrollmentCount.toLocaleString("fa-IR")} از{" "}
                    {item.capacity.toLocaleString("fa-IR")} شاگرد
                  </p>
                </div>
                <Chip
                  size="sm"
                  color={item.status === "active" ? "success" : "default"}
                  variant="soft"
                >
                  {statusLabel[item.status] ?? item.status}
                </Chip>
              </div>
            </Card>
          </ButtonLink>
        ))}
      </div>
      {!query.isPending && !query.isError && !query.data?.items.length ? (
        <Card className="app-card rounded-2xl p-5 text-center text-sm text-muted shadow-none">
          هنوز باشگاهی کلاسی به شماره حساب شما تخصیص نداده است.
        </Card>
      ) : null}
      {query.isError ? (
        <Card className="app-card rounded-2xl p-5 text-center text-sm text-danger shadow-none">
          دریافت کلاس‌های باشگاه انجام نشد.
        </Card>
      ) : null}
    </section>
  );
}
