"use client";

import Link from "next/link";
import { useAthleteClubClasses, useSavedItems, useMyReservations } from "@api";
import { Skeleton, Typography } from "@heroui/react";
import { Icon, type IconName } from "@theme/icon";

type SummaryItem = {
  href: string;
  label: string;
  value: number | null | undefined;
  icon: IconName;
};

export function AthleteActivitySummarySection() {
  const reservations = useMyReservations();
  const clubClasses = useAthleteClubClasses();
  const favorites = useSavedItems();

  const reservationCount = reservations.isError
    ? undefined
    : (reservations.data?.items.filter(
        (item) => item.status === "reserved" || item.status === "completed",
      ).length ?? 0);
  const activeClassCount = clubClasses.isError
    ? undefined
    : (clubClasses.data?.items.filter((item) =>
        ["pending", "active", "waitlisted"].includes(item.status),
      ).length ?? 0);
  const favoriteCount = favorites.isError
    ? undefined
    : (favorites.data?.items.length ?? 0);

  const items: SummaryItem[] = [
    {
      href: "/athlete/reservations",
      label: "رزرو",
      value: reservations.isPending ? null : reservationCount,
      icon: "ticket",
    },
    {
      href: "/athlete/classes",
      label: "کلاس فعال",
      value: clubClasses.isPending ? null : activeClassCount,
      icon: "weight",
    },
    {
      href: "/athlete/favorites",
      label: "ذخیره‌شده",
      value: favorites.isPending ? null : favoriteCount,
      icon: "bookmark",
    },
  ];

  return (
    <section
      className="app-reveal flex flex-col gap-3"
      aria-labelledby="athlete-activity-summary-title"
    >
      <div className="flex items-end justify-between gap-3">
        <div>
          <Typography
            id="athlete-activity-summary-title"
            type="h4"
            weight="bold"
          >
            نمای کلی من
          </Typography>
          <p className="mt-1 text-xs text-muted">
            خلاصه‌ای از فعالیت‌های ورزشی تو
          </p>
        </div>
        <Link
          href="/athlete/profile"
          className="shrink-0 text-xs font-bold text-accent"
        >
          پروفایل
        </Link>
      </div>

      <div className="app-card grid grid-cols-3 overflow-hidden p-1">
        {items.map((item, index) => (
          <Link
            key={item.href}
            href={item.href}
            aria-label={`${item.label}: ${
              item.value === null
                ? "در حال دریافت"
                : item.value === undefined
                  ? "نامشخص"
                  : item.value.toLocaleString("fa-IR")
            }`}
            className={`flex min-w-0 flex-col items-center gap-2 rounded-[1.05rem] px-2 py-4 text-center text-foreground transition-colors active:bg-surface-secondary ${
              index > 0 ? "border-r border-white/7" : ""
            }`}
          >
            <Icon name={item.icon} size={19} className="text-accent" />
            {item.value === null ? (
              <Skeleton aria-hidden className="h-6 w-8 rounded-md" />
            ) : item.value === undefined ? (
              <strong aria-hidden className="text-xl leading-6 text-muted">
                -
              </strong>
            ) : (
              <strong className="text-xl leading-6 font-black tabular-nums">
                {item.value.toLocaleString("fa-IR")}
              </strong>
            )}
            <span className="truncate text-[0.7rem] text-muted">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
