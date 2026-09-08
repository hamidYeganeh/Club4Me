"use client";

import { useState } from "react";
import Link from "@/components/app-link";
import {
  useAthleteClubClasses,
  useCoachBookings,
  useCoachCalendar,
  useCoachClasses,
  useSavedItems,
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
  const favorites = useSavedItems();

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
      label: "ذخیره‌شده‌ها",
      description: "انتخاب‌های ذخیره‌شده",
      icon: "bookmark",
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

      <div className="grid grid-cols-3 gap-3">
        {items.map((item) => (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            className="group flex min-w-0 flex-col gap-3 rounded-3xl bg-surface p-3 outline-none focus-visible:ring-2 focus-visible:ring-focus"
            aria-label={`${item.label}، ${item.description}`}
          >
            <span className="grid size-10 place-items-center rounded-2xl bg-accent text-accent-foreground">
              <Icon name={item.icon} size={20} />
            </span>
            <ActivityValue value={item.value} />
            <strong className="text-xs leading-6 font-semibold">
              {item.label}
            </strong>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ActivityValue({ value }: { value: number | null | undefined }) {
  if (value === null) {
    return (
      <Skeleton aria-label="در حال دریافت" className="h-7 w-9 rounded-md" />
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
    <strong className="text-2xl leading-7 font-black tabular-nums text-foreground">
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
