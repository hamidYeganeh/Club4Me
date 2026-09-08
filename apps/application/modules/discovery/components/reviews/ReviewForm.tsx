"use client";

import { FormEvent, useId, useState } from "react";
import { Button, Card, TextArea, toast } from "@heroui/react";
import { useCreateMedia } from "@api";
import { Icon, iconNames, type IconName } from "@theme/icon";

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
  const [mediaIds, setMediaIds] = useState<string[]>([]);
  const [mediaNames, setMediaNames] = useState<string[]>([]);
  const upload = useCreateMedia();
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
      mediaIds,
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
            <span className="flex items-center gap-2">
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
            </span>
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

        <div className="space-y-2">
          <label
            className="block text-sm font-bold"
            htmlFor={`${bodyId}-media`}
          >
            تصویر تجربه{" "}
            <span className="font-normal text-muted">
              (اختیاری، حداکثر ۳ تصویر)
            </span>
          </label>
          <input
            id={`${bodyId}-media`}
            className="block w-full rounded-xl border border-border bg-surface-secondary p-3 text-sm"
            type="file"
            accept="image/*"
            multiple
            disabled={isPending || upload.isPending || mediaIds.length >= 3}
            onChange={async (event) => {
              const files = Array.from(event.target.files ?? []).slice(
                0,
                3 - mediaIds.length,
              );
              if (!files.length) return;
              try {
                const uploaded = [] as Array<{ id: string; name: string }>;
                for (const file of files) {
                  const item = await upload.mutateAsync(file);
                  uploaded.push({ id: item.id, name: file.name });
                }
                setMediaIds((current) => [
                  ...current,
                  ...uploaded.map((item) => item.id),
                ]);
                setMediaNames((current) => [
                  ...current,
                  ...uploaded.map((item) => item.name),
                ]);
              } catch {
                toast.danger("بارگذاری تصویر انجام نشد");
              } finally {
                event.target.value = "";
              }
            }}
          />
          {mediaNames.length ? (
            <div className="flex flex-wrap gap-2">
              {mediaNames.map((name, index) => (
                <Button
                  key={`${name}-${index}`}
                  size="sm"
                  variant="secondary"
                  onPress={() => {
                    setMediaIds((current) =>
                      current.filter((_, i) => i !== index),
                    );
                    setMediaNames((current) =>
                      current.filter((_, i) => i !== index),
                    );
                  }}
                >
                  {name} ×
                </Button>
              ))}
            </div>
          ) : null}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full font-bold"
          isDisabled={isPending || upload.isPending || !rating || !body.trim()}
          isPending={isPending || upload.isPending}
        >
          ثبت نظر
          <Icon name="arrow-left" size={18} />
        </Button>
      </form>
    </Card>
  );
}
