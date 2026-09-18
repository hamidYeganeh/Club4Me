"use client";

import { Button, Card, toast } from "@heroui/react";
import {
  useAdminClubs,
  useAdminCrmCampaigns,
  useReviewCrmCampaign,
} from "@api/admin";

const statusLabel = {
  pending: "در انتظار بررسی",
  approved: "تأیید شده",
  processing: "در حال ارسال",
  sent: "ارسال شده",
  published: "منتشر شده",
  rejected: "رد شده",
};

export function CrmReviewScreen() {
  const campaigns = useAdminCrmCampaigns();
  const clubs = useAdminClubs();
  const review = useReviewCrmCampaign();
  async function decide(id: string, approved: boolean) {
    try {
      await review.mutateAsync({ id, approved });
      toast.success(approved ? "پیام تأیید شد" : "پیام رد شد");
    } catch {
      toast.danger("ثبت تصمیم انجام نشد");
    }
  }
  const clubNames = new Map(
    clubs.data?.items.map((club) => [club.id, club.name]),
  );
  const items = campaigns.data?.items ?? [];
  return (
    <main className="flex-1 p-4 lg:p-6">
      <h1 className="text-2xl font-semibold">بررسی پیام‌های باشگاه‌ها</h1>
      <p className="mt-1 text-sm text-muted">
        پیام و خبر پس از تأیید و رسیدن زمان انتشار، در باشگاه ارسال یا منتشر
        می‌شود.
      </p>
      <div className="mt-6 grid gap-3 xl:grid-cols-2">
        {items.map((item) => (
          <Card
            key={item.id}
            className="app-card p-5 shadow-none active:scale-100"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <strong>{item.title}</strong>
              <span className="text-xs text-muted">
                {statusLabel[item.status]}
              </span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm">{item.body}</p>
            <p className="mt-2 text-xs text-muted">
              {item.kind === "news" ? "فید خبری" : "پوش نوتیفیکیشن"}
            </p>
            <p className="mt-3 text-xs text-muted">
              باشگاه: {clubNames.get(item.clubId) ?? item.clubId}
            </p>
            <p className="mt-1 text-xs text-muted">
              زمان انتشار: {new Date(item.scheduledAt).toLocaleString("fa-IR")}
            </p>
            {item.kind === "push" && (
              <p className="mt-1 text-xs text-muted">
                گیرندگان:{" "}
                {item.audience === "all_students"
                  ? "همهٔ شاگردان"
                  : `${item.studentIds.length.toLocaleString("fa-IR")} شاگرد انتخابی`}
              </p>
            )}
            {item.status === "pending" && (
              <div className="mt-4 flex gap-2">
                <Button
                  variant="primary"
                  isPending={review.isPending}
                  onPress={() => decide(item.id, true)}
                >
                  تأیید
                </Button>
                <Button
                  variant="secondary"
                  isDisabled={review.isPending}
                  onPress={() => decide(item.id, false)}
                >
                  رد
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
      {items.length === 0 && (
        <p className="mt-8 text-center text-muted">
          پیامی برای بررسی ثبت نشده است.
        </p>
      )}
    </main>
  );
}
