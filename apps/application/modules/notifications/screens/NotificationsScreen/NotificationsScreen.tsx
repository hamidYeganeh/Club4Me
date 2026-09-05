"use client";

import Link from "next/link";
import { Card } from "@heroui/react";
import { useMarkNotificationRead, useNotifications } from "@api";

import { DiscoveryPageHeader } from "@modules/discovery/components/DiscoveryPageHeader";
import { RequestFailureState } from "@/components/request-failure-state";
import { NotificationListSkeleton } from "@/components/loading-skeletons";

export function NotificationsScreen() {
  const notifications = useNotifications();
  const markRead = useMarkNotificationRead();
  return (
    <main className="min-h-dvh px-5 pb-[calc(7rem+env(safe-area-inset-bottom))]">
      <DiscoveryPageHeader
        title="اعلان‌ها"
        description="خبرهای باشگاه‌ها و مربی‌های موردعلاقه‌ات"
      />
      {notifications.isPending ? (
        <NotificationListSkeleton count={4} />
      ) : null}
      {notifications.isError ? (
        <RequestFailureState
          error={notifications.error}
          onRetry={() => void notifications.refetch()}
        />
      ) : null}
      <div className="space-y-3">
        {(notifications.data?.items ?? []).map((item) => (
          <Card
            key={item.id}
            className={`rounded-3xl p-4 shadow-none ${item.readAt ? "bg-surface" : "bg-surface-secondary ring-1 ring-accent/30"}`}
          >
            <Link
              href={item.href ?? "#"}
              onClick={() => void markRead.mutateAsync(item.id)}
              className="block no-underline"
            >
              <h2 className="font-bold text-foreground">{item.title}</h2>
              <p className="mt-1 text-sm text-muted">{item.body}</p>
              <time
                className="mt-3 block text-xs text-muted"
                dateTime={item.createdAt}
              >
                {new Intl.DateTimeFormat("fa-IR", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(item.createdAt))}
              </time>
            </Link>
          </Card>
        ))}
        {notifications.data &&
        !notifications.isError &&
        !notifications.data.items.length ? (
          <p className="py-16 text-center text-sm text-muted">
            هنوز اعلانی نداری.
          </p>
        ) : null}
      </div>
    </main>
  );
}
