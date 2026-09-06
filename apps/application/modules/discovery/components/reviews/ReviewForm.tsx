"use client";

import { FormEvent, useId, useState } from "react";
import { Button, Card, TextArea } from "@heroui/react";
import { Icon, type IconName } from "@theme/icon";

const experiences: Array<{ icon: IconName; label: string }> = [
  { icon: "smile-depressed", label: "خیلی بد" },
  { icon: "smile-sad", label: "بد" },
  { icon: "smile-neutral", label: "معمولی" },
  { icon: "smile-happy", label: "خوب" },
  { icon: "smile-overjoyed", label: "عالی" },
];

export function ReviewForm({
  entityName,
  isPending,
  criteria = [],
  onSubmit,
}: {
  entityName: string;
  isPending?: boolean;
  criteria?: Array<{ id: string; name: string }>;
  onSubmit: (value: {
    rating: number;
    body: string;
    experience: number;
    ratings: Record<string, number>;
  }) => Promise<void> | void;
}) {
  const bodyId = useId();
  const [rating, setRating] = useState(0);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [body, setBody] = useState("");
  const [experience, setExperience] = useState(0);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (isPending || !rating || !body.trim()) return;
    await onSubmit({
      rating,
      body: body.trim(),
      experience,
      ratings: Object.fromEntries(
        Object.entries(ratings).filter(([id]) =>
          criteria.some((c) => c.id === id),
        ),
      ),
    });
  };

  return (
    <Card className="rounded-[1.75rem] border border-border bg-surface p-5 shadow-none sm:p-6">
      <Card.Title>ثبت تجربه شما</Card.Title>
      <Card.Description className="mt-1 text-muted">
        نظر شما درباره {entityName}
      </Card.Description>
      <form onSubmit={submit} className="mt-6 space-y-6">
        {criteria.map((criterion) => (
          <label key={criterion.id} className="block text-sm font-bold">
            {criterion.name}
            <select
              disabled={isPending}
              className="mt-2 w-full rounded-xl border border-border bg-surface p-3"
              value={ratings[criterion.id] ?? ""}
              onChange={(e) =>
                setRatings((current) => {
                  const next = { ...current };
                  if (e.target.value)
                    next[criterion.id] = Number(e.target.value);
                  else delete next[criterion.id];
                  return next;
                })
              }
            >
              <option value="">ارزیابی نکرده‌ام</option>
              {[1, 2, 3, 4, 5].map((score) => (
                <option key={score} value={score}>
                  {score} از ۵
                </option>
              ))}
            </select>
          </label>
        ))}
        <fieldset disabled={isPending}>
          <legend className="text-sm font-bold">امتیاز شما</legend>
          <div className="mt-3 flex justify-between gap-1" dir="ltr">
            {[1, 2, 3, 4, 5].map((star) => (
              <Button
                type="button"
                key={star}
                isIconOnly
                variant="ghost"
                size="lg"
                aria-label={`${star} ستاره`}
                aria-pressed={star <= rating}
                onPress={() => setRating(star)}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className={`size-8 ${star <= rating ? "text-accent" : "text-muted"}`}
                  fill={star <= rating ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinejoin="round"
                >
                  <path d="m12 3 2.8 5.7 6.3.9-4.6 4.5 1.1 6.3-5.6-3-5.6 3 1.1-6.3-4.6-4.5 6.3-.9Z" />
                </svg>
              </Button>
            ))}
          </div>
        </fieldset>

        <div className="space-y-3">
          <label className="block text-sm font-bold" htmlFor={bodyId}>
            نظر شما
          </label>
          <TextArea
            id={bodyId}
            aria-describedby={`${bodyId}-count`}
            value={body}
            maxLength={300}
            required
            disabled={isPending}
            onChange={(event) => setBody(event.target.value)}
            placeholder="از فضای باشگاه، امکانات و برخورد کارکنان بگویید…"
            rows={5}
            className="min-h-40 w-full resize-y rounded-2xl border border-border bg-surface-secondary p-4 text-sm leading-7"
          />
          <div
            id={`${bodyId}-count`}
            className="flex items-center justify-between gap-3 text-xs text-muted"
          >
            <span>تجربه شما به انتخاب دیگران کمک می‌کند.</span>
            <span className="shrink-0 tabular-nums" dir="ltr">
              {body.length.toLocaleString("fa-IR")} / ۳۰۰
            </span>
          </div>
        </div>

        <fieldset disabled={isPending}>
          <legend className="text-sm font-bold">
            تجربه کلی شما{" "}
            <span className="font-normal text-muted">(اختیاری)</span>
          </legend>
          <div className="mt-3 grid grid-cols-5 gap-1 rounded-2xl bg-surface-secondary p-2">
            {experiences.map((item, index) => (
              <Button
                type="button"
                key={item.label}
                variant="ghost"
                aria-label={item.label}
                aria-pressed={experience === index + 1}
                onPress={() => setExperience(index + 1)}
                className={`h-auto! min-w-0 flex-col gap-2 rounded-xl px-1 py-3 ${experience === index + 1 ? "bg-accent text-accent-foreground" : "text-muted"}`}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-7 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M8 9h.01M16 9h.01" strokeWidth="2.7" />
                  <path
                    d={
                      index < 2
                        ? "M8 16q4-5 8 0"
                        : index === 2
                          ? "M8 15h8"
                          : "M8 14q4 5 8 0"
                    }
                  />
                </svg>
                <span className="text-[10px] sm:text-xs">{item.label}</span>
              </Button>
            ))}
          </div>
        </fieldset>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full font-bold"
          isDisabled={isPending || !rating || !body.trim()}
          isPending={isPending}
        >
          ثبت نظر
          <Icon name="arrow-left" size={18} />
        </Button>
      </form>
    </Card>
  );
}
