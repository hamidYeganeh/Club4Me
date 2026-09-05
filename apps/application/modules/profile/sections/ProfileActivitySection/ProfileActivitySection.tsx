"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useAthleteClubClasses,
  useCoachBookings,
  useCoachCalendar,
  useCoachClasses,
  useFavorites,
  useMyReservations,
} from "@api";
import { Skeleton, Typography } from "@heroui/react";
import { Icon, type IconName } from "@theme/icon";

import type { ProfileRole } from "../../profile.types";

type ActivityItem = {
  href: string;
  label: string;
  description: string;
  icon: IconName;
  value: number | null | undefined;
};

export function ProfileActivitySection({ role }: { role: ProfileRole }) {
  return role === "athlete" ? <AthleteActivity /> : <CoachActivity />;
}

function AthleteActivity() {
  const reservations = useMyReservations();
  const clubClasses = useAthleteClubClasses();
  const favorites = useFavorites();

  const items: ActivityItem[] = [
    {
      href: "/athlete/reservations",
      label: "رزروهای من",
      description: "جلسات پیش رو و سوابق رزرو",
      icon: "calendar-heart",
      value: getQueryCount(
        reservations.isPending,
        reservations.isError,
        reservations.data?.items.filter((item) => item.status !== "cancelled")
          .length,
      ),
    },
    {
      href: "/athlete/classes",
      label: "کلاس‌ها",
      description: "ثبت‌نام‌های فعال",
      icon: "weight",
      value: getQueryCount(
        clubClasses.isPending,
        clubClasses.isError,
        clubClasses.data?.items.filter((item) =>
          ["pending", "active", "waitlisted"].includes(item.status),
        ).length,
      ),
    },
    {
      href: "/athlete/favorites",
      label: "علاقه‌مندی‌ها",
      description: "انتخاب‌های ذخیره‌شده",
      icon: "heart",
      value: getQueryCount(
        favorites.isPending,
        favorites.isError,
        favorites.data?.items.length,
      ),
    },
  ];

  return <ActivityGrid items={items} />;
}

function CoachActivity() {
  const bookings = useCoachBookings();
  const classes = useCoachClasses();
  const calendar = useCoachCalendar();
  const [now] = useState(() => Date.now());

  const items: ActivityItem[] = [
    {
      href: "/coach/reservations",
      label: "رزرو شاگردها",
      description: "درخواست‌های فعال و تأییدشده",
      icon: "calendar-heart",
      value: getQueryCount(
        bookings.isPending,
        bookings.isError,
        bookings.data?.items.filter((item) =>
          ["pending", "confirmed"].includes(item.status),
        ).length,
      ),
    },
    {
      href: "/coach",
      label: "کلاس‌ها",
      description: "کلاس‌های در حال اجرا",
      icon: "whistle",
      value: getQueryCount(
        classes.isPending,
        classes.isError,
        classes.data?.items.filter((item) =>
          ["published", "registration_closed", "in_progress"].includes(
            item.status,
          ),
        ).length,
      ),
    },
    {
      href: "/coach",
      label: "جلسات پیش رو",
      description: "برنامه زمان‌بندی‌شده",
      icon: "clock",
      value: getQueryCount(
        calendar.isPending,
        calendar.isError,
        calendar.data?.items.filter(
          (item) =>
            item.status !== "cancelled" &&
            new Date(item.startAt).getTime() >= now,
        ).length,
      ),
    },
  ];

  return <ActivityGrid items={items} />;
}

function ActivityGrid({ items }: { items: ActivityItem[] }) {
  return (
    <section
      className="app-reveal flex flex-col gap-3"
      aria-labelledby="profile-activity-title"
    >
      <div>
        <Typography id="profile-activity-title" type="h4" weight="bold">
          فعالیت من
        </Typography>
        <p className="mt-1 text-xs text-muted">
          میان‌برهای شخصی و وضعیت فعلی حساب
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {items.map((item, index) => (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            className={`app-card group flex min-h-36 flex-col p-4 text-foreground ${
              index === 0 ? "col-span-2 min-h-30 flex-row items-center" : ""
            }`}
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-[1rem] bg-accent/14 text-accent">
              <Icon name={item.icon} size={21} />
            </span>
            <span
              className={
                index === 0 ? "mr-3 min-w-0 flex-1" : "mt-4 min-w-0 flex-1"
              }
            >
              <strong className="block text-sm font-bold">{item.label}</strong>
              <span className="mt-1 block text-xs leading-5 text-muted">
                {item.description}
              </span>
            </span>
            <span
              className={
                index === 0
                  ? "mr-3 flex items-center gap-2"
                  : "mt-3 flex items-center justify-between"
              }
            >
              <ActivityValue value={item.value} />
              <Icon
                name="chevron-left"
                size={16}
                className="text-muted transition-transform duration-300 group-hover:-translate-x-1"
              />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ActivityValue({ value }: { value: number | null | undefined }) {
  if (value === null) {
    return (
      <Skeleton
        aria-label="در حال دریافت"
        className="h-7 w-9 rounded-md"
      />
    );
  }

  if (value === undefined) {
    return (
      <strong aria-label="نامشخص" className="text-2xl leading-7 text-muted">
        -
      </strong>
    );
  }

  return (
    <strong className="text-2xl leading-7 font-black tabular-nums text-accent">
      {value.toLocaleString("fa-IR")}
    </strong>
  );
}

function getQueryCount(
  isPending: boolean,
  isError: boolean,
  value: number | undefined,
) {
  if (isPending) return null;
  if (isError) return undefined;
  return value ?? 0;
}
