"use client";

import Image from "next/image";
import { useState } from "react";
import { useCreateSupportTicket, tokenStore } from "@api";
import { Avatar, Button, Card, Typography, toast } from "@heroui/react";
import { Icon } from "@theme/icon";

export type ReviewCardItem = {
  id: string;
  author: string;
  avatarUrl?: string | null;
  rating: number;
  title?: string;
  body: string;
  createdAt: string;
  verified?: boolean;
  ownerResponse?: { body: string; respondedAt: string };
  criteria?: Array<{ name: string; value: number }>;
  mediaUrls?: string[];
  likes?: number;
  dislikes?: number;
};

function formatRelativeDate(value: string) {
  const days = Math.max(
    1,
    Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000),
  );
  if (days < 7) return `${days.toLocaleString("fa-IR")} روز پیش`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks.toLocaleString("fa-IR")} هفته پیش`;
  return `${Math.floor(days / 30).toLocaleString("fa-IR")} ماه پیش`;
}

export function ReviewCard({ review }: { review: ReviewCardItem }) {
  const report = useCreateSupportTicket();
  const [reported, setReported] = useState(false);

  return (
    <Card className="app-card app-stack-card p-5 shadow-none">
      <div className="flex items-start gap-3">
        <Avatar className="size-12 shrink-0 bg-accent/12 text-accent">
          {review.avatarUrl ? (
            <Avatar.Image src={review.avatarUrl} alt={review.author} />
          ) : null}
          <Avatar.Fallback className="font-black">
            {review.author.slice(0, 1)}
          </Avatar.Fallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <Typography
            type="body-sm"
            weight="bold"
            className="truncate text-base"
          >
            {review.author}
          </Typography>
          <Typography type="body-xs" color="muted" className="mt-1">
            {formatRelativeDate(review.createdAt)}
          </Typography>
        </div>
      </div>

      <div
        className="mt-4 flex items-center gap-2"
        dir="ltr"
        aria-label={`${review.rating} از ۵ ستاره`}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <Icon
            key={star}
            name="star-full"
            size={20}
            className={
              star <= Math.round(review.rating)
                ? "text-accent"
                : "text-muted/45"
            }
          />
        ))}
        <strong className="ms-1 text-sm tabular-nums text-foreground">
          {review.rating.toLocaleString("fa-IR")}
        </strong>
      </div>

      {review.title ? (
        <Typography type="h6" weight="bold" className="mt-4">
          {review.title}
        </Typography>
      ) : null}
      <Typography type="body-sm" color="muted" className="mt-2 leading-7">
        {review.body}
      </Typography>
      {review.mediaUrls?.length ? (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {review.mediaUrls.map((url) => (
            <Image
              width={240}
              height={240}
              unoptimized
              key={url}
              src={url}
              alt="تصویر ثبت‌شده همراه نظر"
              loading="lazy"
              className="aspect-square w-full rounded-xl object-cover"
            />
          ))}
        </div>
      ) : null}

      {review.verified ? (
        <div className="mt-4 flex items-center gap-2 text-sm font-bold text-accent">
          <Icon name="shield-check" size={19} />
          تجربه تأییدشده
        </div>
      ) : null}
      {review.criteria?.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {review.criteria.map((item) => (
            <span
              key={item.name}
              className="rounded-lg bg-surface-secondary px-2 py-1 text-xs"
            >
              {item.name}: {item.value} از ۵
            </span>
          ))}
        </div>
      ) : null}

      {review.ownerResponse ? (
        <div className="mt-4 rounded-xl bg-surface-secondary p-4">
          <p className="text-sm font-bold">پاسخ باشگاه</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-7">
            {review.ownerResponse.body}
          </p>
          <time
            className="mt-2 block text-xs text-muted"
            dateTime={review.ownerResponse.respondedAt}
          >
            {new Date(review.ownerResponse.respondedAt).toLocaleDateString(
              "fa-IR",
            )}
          </time>
        </div>
      ) : null}
      <div className="mt-5 border-t border-border pt-3">
        <Button
          size="sm"
          variant="ghost"
          className="text-danger"
          isPending={report.isPending}
          isDisabled={reported}
          onPress={async () => {
            if (!tokenStore.get()) {
              toast.danger("برای گزارش نظر وارد حساب شوید");
              return;
            }
            try {
              await report.mutateAsync({
                subject: "گزارش نظر منتشرشده",
                category: "club",
                message: `درخواست بررسی نظر ${review.id}\n${review.body}`,
                preferredContact: "in_app",
              });
              setReported(true);
              toast.success("گزارش در پشتیبانی ثبت شد");
            } catch {
              toast.danger("ثبت گزارش انجام نشد؛ دوباره تلاش کنید");
            }
          }}
        >
          <Icon name="flag-1" size={17} />
          {reported ? "گزارش ثبت شد" : "گزارش به پشتیبانی"}
        </Button>
      </div>
    </Card>
  );
}
