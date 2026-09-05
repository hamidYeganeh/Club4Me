"use client";

import { Card, Chip, Typography } from "@heroui/react";
import { useAthleteClubClasses } from "@api";
import { ButtonLink } from "@/components/button-link";
import { CompactCardListSkeleton } from "@/components/loading-skeletons";

const statusLabel: Record<string, string> = {
  pending: "در انتظار تأیید",
  active: "فعال",
  waitlisted: "لیست انتظار",
  completed: "تمام‌شده",
};

export function AthleteClubClassesSection({
  compact = false,
}: {
  compact?: boolean;
}) {
  const query = useAthleteClubClasses();
  const items = (query.data?.items ?? []).slice(0, compact ? 2 : undefined);

  return (
    <section aria-labelledby="athlete-club-classes-title">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <Typography id="athlete-club-classes-title" type="h4" weight="bold">
            کلاس‌های باشگاهی من
          </Typography>
          <p className="mt-1 text-xs text-muted">ثبت‌نام‌ها و وضعیت شهریه</p>
        </div>
        {compact ? (
          <ButtonLink href="/athlete/classes" size="sm" variant="ghost">
            مشاهده همه
          </ButtonLink>
        ) : null}
      </div>
      {query.isPending ? (
        <CompactCardListSkeleton count={compact ? 2 : 3} />
      ) : null}
      {query.isError ? (
        <Card className="app-card rounded-2xl p-5 text-center text-sm text-muted shadow-none">
          دریافت کلاس‌های شما انجام نشد.
        </Card>
      ) : null}
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <ButtonLink
            key={item.id}
            href={`/discovery/business-class?classId=${item.classId}`}
            variant="ghost"
            className="h-auto justify-stretch p-0 text-start no-underline"
          >
            <Card className="app-card w-full rounded-2xl p-4 shadow-none">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold">{item.title}</p>
                  <p className="mt-1 text-xs text-muted">
                    {item.sport || "کلاس باشگاهی"} ·{" "}
                    {new Date(item.startDate).toLocaleDateString("fa-IR")}
                  </p>
                </div>
                <Chip
                  size="sm"
                  color={
                    item.status === "active"
                      ? "success"
                      : item.status === "waitlisted"
                        ? "warning"
                        : "default"
                  }
                  variant="soft"
                >
                  {statusLabel[item.status] ?? item.status}
                </Chip>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-white/7 pt-3 text-xs text-muted">
                <span>
                  {item.paymentStatus === "paid"
                    ? "شهریه پرداخت شده"
                    : item.paymentStatus === "waived"
                      ? "رایگان"
                      : "در انتظار پرداخت"}
                </span>
                {item.remainingSessions !== null ? (
                  <span>
                    {item.remainingSessions.toLocaleString("fa-IR")} جلسه
                    باقی‌مانده
                  </span>
                ) : null}
              </div>
            </Card>
          </ButtonLink>
        ))}
      </div>
      {!query.isPending && !query.isError && !items.length ? (
        <Card className="app-card rounded-2xl p-6 text-center shadow-none">
          <p className="text-sm text-muted">
            هنوز در کلاس باشگاهی ثبت‌نام نکرده‌اید.
          </p>
          <ButtonLink
            href="/discovery/classes"
            size="sm"
            variant="primary"
            className="mt-4"
          >
            پیدا کردن کلاس
          </ButtonLink>
        </Card>
      ) : null}
    </section>
  );
}
