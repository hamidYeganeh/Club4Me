"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMarkNotificationRead, useNotifications } from "@api";
import { Icon, type IconName } from "@theme/icon";
import { ThemeToggle } from "@theme/theme-toggle";

import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";
import { RequestFailureState } from "@/components/request-failure-state";
import { NotificationListSkeleton } from "@/components/loading-skeletons";
import { getQueryFailure } from "@/lib/request-failure";

type NotificationFilter = "unread" | "read";

const iconByType: Record<string, IconName> = {
  booking_confirmed: "calendar-check",
  booking_cancelled: "calendar-minus",
  booking_rescheduled: "calendar-1",
  booking_reminder: "clock",
  class_published: "megaphone",
  club_owner_approved: "check-circle",
  payment_failed: "info-circle",
  support_ticket_updated: "ticket",
  support_sla_escalated: "info-circle",
  waitlist_seat_available: "user-check",
};

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function dateGroupLabel(value: string) {
  const date = new Date(value);
  const dayDifference = Math.round(
    (startOfDay(new Date()).getTime() - startOfDay(date).getTime()) /
      86_400_000,
  );

  if (dayDifference === 0) return "امروز";
  if (dayDifference === 1) return "دیروز";

  return new Intl.DateTimeFormat("fa-IR", {
    day: "numeric",
    month: "long",
    year:
      date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  }).format(date);
}

function relativeTime(value: string) {
  const difference = new Date(value).getTime() - Date.now();
  const absoluteDifference = Math.abs(difference);
  const formatter = new Intl.RelativeTimeFormat("fa-IR", { numeric: "auto" });

  if (absoluteDifference < 3_600_000) {
    return formatter.format(Math.round(difference / 60_000), "minute");
  }
  if (absoluteDifference < 86_400_000) {
    return formatter.format(Math.round(difference / 3_600_000), "hour");
  }
  return formatter.format(Math.round(difference / 86_400_000), "day");
}

export function NotificationsScreen() {
  const [filter, setFilter] = useState<NotificationFilter>("unread");
  const notifications = useNotifications();
  const markRead = useMarkNotificationRead();
  const failure = getQueryFailure(
    notifications.error,
    notifications.fetchStatus,
  );
  const groups = useMemo(() => {
    const matchingItems = (notifications.data?.items ?? []).filter((item) =>
      filter === "read" ? Boolean(item.readAt) : !item.readAt,
    );

    return Array.from(
      matchingItems.reduce((grouped, item) => {
        const label = dateGroupLabel(item.createdAt);
        grouped.set(label, [...(grouped.get(label) ?? []), item]);
        return grouped;
      }, new Map<string, typeof matchingItems>()),
    );
  }, [filter, notifications.data?.items]);

  return (
    <main className="min-h-dvh pb-[calc(7rem+env(safe-area-inset-bottom))]">
      <SecondaryHeader
        title="اعلان‌ها"
        showFilter={false}
        action={<ThemeToggle className="border-0 bg-transparent" />}
      />

      <div className="px-5 pt-4">
        <div
          className="grid grid-cols-2 rounded-[1.35rem] bg-surface-secondary p-1"
          role="group"
          aria-label="فیلتر اعلان‌ها"
        >
          {(
            [
              ["unread", "خوانده‌نشده"],
              ["read", "خوانده‌شده"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              className={`min-h-12 rounded-[1.1rem] px-3 text-sm font-bold transition-all ${
                filter === value
                  ? "bg-surface text-foreground"
                  : "text-muted"
              }`}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="pt-8">
          {notifications.isPending && !failure ? (
            <NotificationListSkeleton count={4} />
          ) : null}
          {failure ? (
            <RequestFailureState
              error={failure}
              onRetry={() => void notifications.refetch()}
            />
          ) : null}

          {!notifications.isPending && !failure ? (
            <div className="space-y-8">
              {groups.map(([label, items]) => (
                <section key={label} aria-labelledby={`notifications-${label}`}>
                  <h2
                    id={`notifications-${label}`}
                    className="mb-4 text-base font-extrabold text-foreground"
                  >
                    {label}
                  </h2>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <Link
                        key={item.id}
                        href={item.href ?? "#"}
                        className="app-card flex min-h-28 items-start gap-3 p-4 no-underline"
                        onClick={() => {
                          if (!item.readAt) void markRead.mutateAsync(item.id);
                        }}
                      >
                        <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-muted shadow-sm">
                          <Icon
                            name={iconByType[item.type] ?? "bell-ringing"}
                            size={22}
                          />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-3">
                            <strong className="text-sm leading-6 text-foreground">
                              {item.title}
                            </strong>
                            <time
                              className="flex shrink-0 items-center gap-2 whitespace-nowrap text-xs text-muted"
                              dateTime={item.createdAt}
                            >
                              {relativeTime(item.createdAt)}
                              {!item.readAt ? (
                                <span
                                  aria-label="خوانده‌نشده"
                                  className="size-2 rounded-full bg-accent"
                                />
                              ) : null}
                            </time>
                          </span>
                          <span className="mt-1 block text-sm leading-7 text-muted">
                            {item.body}
                          </span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}

              {!groups.length ? (
                <div className="py-16 text-center">
                  <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-surface-secondary text-muted">
                    <Icon
                      name={filter === "read" ? "checks-1" : "bell-1"}
                      size={25}
                    />
                  </span>
                  <p className="mt-4 text-sm font-bold text-foreground">
                    {filter === "read"
                      ? "اعلان خوانده‌شده‌ای نداری"
                      : "اعلان جدیدی نداری"}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
