"use client";

import { useState } from "react";
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
  const [reaction, setReaction] = useState<"like" | "dislike" | null>(null);

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
          <Typography type="body-sm" weight="bold" className="truncate text-base">
            {review.author}
          </Typography>
          <Typography type="body-xs" color="muted" className="mt-1">
            {formatRelativeDate(review.createdAt)}
          </Typography>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2" dir="ltr" aria-label={`${review.rating} از ۵ ستاره`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Icon
            key={star}
            name="star-full"
            size={20}
            className={star <= Math.round(review.rating) ? "text-accent" : "text-muted/45"}
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

      {review.verified ? (
        <div className="mt-4 flex items-center gap-2 text-sm font-bold text-accent">
          <Icon name="shield-check" size={19} />
          تجربه تأییدشده
        </div>
      ) : null}

      <div className="mt-5 flex items-center gap-1 border-t border-white/7 pt-3">
        <Button
          size="sm"
          variant="ghost"
          aria-pressed={reaction === "like"}
          onPress={() => setReaction((current) => current === "like" ? null : "like")}
          className={reaction === "like" ? "text-accent" : "text-muted"}
        >
          <Icon name="thumbs-up" size={18} />
          مفید {review.likes ? `(${review.likes.toLocaleString("fa-IR")})` : ""}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          aria-pressed={reaction === "dislike"}
          onPress={() => setReaction((current) => current === "dislike" ? null : "dislike")}
          className={reaction === "dislike" ? "text-danger" : "text-muted"}
        >
          <Icon name="thumbs-down" size={18} />
          غیرمفید {review.dislikes ? `(${review.dislikes.toLocaleString("fa-IR")})` : ""}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="ms-auto text-danger"
          onPress={() => toast.success("گزارش شما برای بررسی ثبت شد")}
        >
          <Icon name="flag-1" size={17} />
          گزارش
        </Button>
      </div>
    </Card>
  );
}
