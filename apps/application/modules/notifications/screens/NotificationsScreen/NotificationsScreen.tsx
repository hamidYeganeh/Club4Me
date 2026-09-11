"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "@/components/app-link";
import { VisualEmptyState } from "@/components/ui/clarity";
import { toast } from "@heroui/react";
import { useMarkNotificationRead, useNotifications } from "@api";
import { Icon, type IconName } from "@theme/icon";

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

const toneByType: Record<string, string> = {
  booking_confirmed: "success",
  booking_cancelled: "danger",
  payment_failed: "danger",
  support_sla_escalated: "danger",
  booking_reminder: "activity",
  booking_rescheduled: "activity",
  class_published: "accent",
  waitlist_seat_available: "success",
  club_owner_approved: "success",
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
  const router = useRouter();
  const pathname = usePathname();
  const role = pathname.startsWith("/coach") ? "coach" : "athlete";
  const [filter, setFilter] = useState<NotificationFilter>("unread");
  const notifications = useNotifications();
  const markRead = useMarkNotificationRead();
  const failure = notifications.data
    ? null
    : getQueryFailure(notifications.error, notifications.fetchStatus);
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
        backHref={`/${role}/profile`}
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
              aria-label={label}
              className={`min-h-12 rounded-[1.1rem] px-3 text-sm font-bold transition-all ${
                filter === value ? "bg-surface text-foreground" : "text-muted"
              }`}
              onClick={() => setFilter(value)}
            >
              {label}
              {notifications.data ? (
                <span className="ms-2 inline-flex min-w-5 items-center justify-center rounded-full bg-background px-1.5 text-xs tabular-nums">
                  {notifications.data.items
                    .filter((item) =>
                      value === "read" ? Boolean(item.readAt) : !item.readAt,
                    )
                    .length.toLocaleString("fa-IR")}
                </span>
              ) : null}
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
                      <button
                        type="button"
                        key={item.id}
                        className="app-notification"
                        onClick={async () => {
                          if (!item.readAt) {
                            try {
                              await markRead.mutateAsync(item.id);
                            } catch {
                              toast.danger(
                                "ثبت وضعیت اعلان انجام نشد؛ دوباره تلاش کنید",
                              );
                            }
                          }
                          if (item.href) router.push(item.href);
                        }}
                      >
                        <span
                          className="app-notification-icon"
                          data-tone={toneByType[item.type] ?? "accent"}
                          aria-hidden
                        >
                          <Icon
                            name={iconByType[item.type] ?? "bell-ringing"}
                            size={22}
                          />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
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
                      </button>
                    ))}
                  </div>
                </section>
              ))}

              {!groups.length ? (
                <VisualEmptyState
                  icon={filter === "read" ? "checks-1" : "bell-1"}
                  title={
                    filter === "read"
                      ? "اعلان خوانده‌شده‌ای نداری"
                      : "اعلان جدیدی نداری"
                  }
                  description={
                    filter === "read"
                      ? "اعلان‌هایی که باز می‌کنی، برای مرور دوباره اینجا می‌مانند."
                      : "همه‌چیز به‌روز است. خبر رزروها و تغییر برنامه‌ها را اینجا می‌بینی."
                  }
                  action={
                    <Link
                      href={`/${role}/reservations`}
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
                    >
                      مشاهده برنامه من <Icon name="arrow-left" size={18} />
                    </Link>
                  }
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
