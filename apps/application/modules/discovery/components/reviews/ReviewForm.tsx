"use client";

import { FormEvent, useId, useState } from "react";
import { Button, Card, TextArea } from "@heroui/react";
import { Icon, iconNames, type IconName } from "@theme/icon";

function StarRating({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex justify-between gap-1" dir="ltr">
      {[1, 2, 3, 4, 5].map((star) => (
        <Button
          type="button"
          key={star}
          isIconOnly
          variant="ghost"
          size="lg"
          isDisabled={disabled}
          aria-label={`${label}: ${star} ستاره از ۵`}
          aria-pressed={star <= value}
          onPress={() => onChange(star)}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className={`size-8 ${star <= value ? "text-accent" : "text-muted"}`}
            fill={star <= value ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          >
            <path d="m12 3 2.8 5.7 6.3.9-4.6 4.5 1.1 6.3-5.6-3-5.6 3 1.1-6.3-4.6-4.5 6.3-.9Z" />
          </svg>
        </Button>
      ))}
    </div>
  );
}

export function ReviewForm({
  entityName,
  isPending,
  criteria = [],
  onSubmit,
}: {
  entityName: string;
  isPending?: boolean;
  criteria?: Array<{ id: string; name: string; icon?: unknown }>;
  onSubmit: (value: {
    rating: number;
    body: string;
    ratings: Record<string, number>;
    mediaIds: string[];
  }) => Promise<void> | void;
}) {
  const bodyId = useId();
  const [rating, setRating] = useState(0);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [body, setBody] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (isPending || !rating || !body.trim()) return;
    await onSubmit({
      rating,
      body: body.trim(),
      ratings: Object.fromEntries(
        Object.entries(ratings).filter(([id]) =>
          criteria.some((c) => c.id === id),
        ),
      ),
      mediaIds: [],
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
          <fieldset key={criterion.id} disabled={isPending}>
            <legend className="flex items-center gap-2 text-sm font-bold">
              <Icon
                name={
                  typeof criterion.icon === "string" &&
                  iconNames.includes(criterion.icon as IconName)
                    ? (criterion.icon as IconName)
                    : "star-full"
                }
                size={20}
                className="text-accent"
              />
              {criterion.name}
            </legend>
            <div className="mt-2">
              <StarRating
                label={criterion.name}
                value={ratings[criterion.id] ?? 0}
                disabled={isPending}
                onChange={(value) =>
                  setRatings((current) => ({
                    ...current,
                    [criterion.id]: value,
                  }))
                }
              />
            </div>
          </fieldset>
        ))}
        <fieldset disabled={isPending}>
          <legend className="text-sm font-bold">امتیاز شما</legend>
          <div className="mt-3">
            <StarRating
              label="امتیاز شما"
              value={rating}
              disabled={isPending}
              onChange={setRating}
            />
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
