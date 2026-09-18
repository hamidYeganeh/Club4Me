"use client";

import Link from "next/link";
import { Button, Card } from "@heroui/react";
import { FormOption, FormSelect } from "@repo/ui/form-select";
import { useBusinessCrmCampaigns } from "@api/business";
import { useSelectedClub } from "@/lib/use-selected-club";

const statusLabel = {
  pending: "در انتظار تأیید ادمین",
  approved: "تأیید شده؛ در انتظار انتشار",
  processing: "در حال ارسال",
  sent: "ارسال شده",
  published: "منتشر شده",
  rejected: "رد شده",
};

export function CrmScreen() {
  const { clubs, clubId, setClubId } = useSelectedClub();
  const campaigns = useBusinessCrmCampaigns(clubId);
  return (
    <main className="flex-1 p-4 lg:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">پیام‌ها و خبرهای باشگاه</h1>
          <p className="mt-1 text-sm text-muted">
            پوش و خبر پس از تأیید ادمین، در تاریخ انتخابی منتشر می‌شوند.
          </p>
        </div>
        <div className="flex gap-2">
          <FormSelect aria-label="باشگاه" value={clubId} onChange={setClubId}>
            {clubs.data?.items.map((club) => (
              <FormOption key={club.id} value={club.id}>
                {club.name}
              </FormOption>
            ))}
          </FormSelect>
          <Button variant="primary" isDisabled={!clubId}>
            <Link href={`/crm/new?clubId=${clubId}`}>ایجاد پیام یا خبر</Link>
          </Button>
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {campaigns.data?.items.map((item) => (
          <Card
            key={item.id}
            className="app-card p-5 shadow-none active:scale-100"
          >
            <div className="flex items-start justify-between gap-2">
              <strong>{item.title}</strong>
              <span className="text-xs text-muted">
                {statusLabel[item.status]}
              </span>
            </div>
            <span className="mt-2 block text-xs text-muted">
              {item.kind === "news" ? "فید خبری" : "پوش نوتیفیکیشن"}
            </span>
            <p className="mt-2 whitespace-pre-wrap text-sm">{item.body}</p>
            <p className="mt-3 text-xs text-muted">
              {item.kind === "news" ? "انتشار" : "ارسال"}:{" "}
              {new Date(item.scheduledAt).toLocaleString("fa-IR")}
            </p>
            {item.kind === "push" && (
              <p className="mt-1 text-xs text-muted">
                {item.audience === "all_students"
                  ? "همهٔ شاگردان"
                  : `${item.studentIds.length.toLocaleString("fa-IR")} شاگرد انتخابی`}
              </p>
            )}
            {["pending", "rejected", "published"].includes(item.status) && (
              <Link
                className="mt-4 inline-block text-sm text-accent underline"
                href={`/crm/${item.id}/edit?clubId=${clubId}`}
              >
                ویرایش در صفحهٔ جداگانه
              </Link>
            )}
          </Card>
        ))}
      </div>
      {campaigns.data?.items.length === 0 && (
        <p className="mt-8 text-center text-muted">
          هنوز پیام یا خبری ثبت نشده است.
        </p>
      )}
    </main>
  );
}
