"use client";

import { FormEvent, useState } from "react";
import { Button, Card } from "@heroui/react";
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
  onSubmit,
}: {
  entityName: string;
  isPending?: boolean;
  onSubmit: (value: { rating: number; body: string; experience: number }) => Promise<void> | void;
}) {
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [experience, setExperience] = useState(0);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!rating || !body.trim()) return;
    await onSubmit({ rating, body: body.trim(), experience });
    setBody("");
  };

  return (
    <Card className="app-card app-reveal p-5 shadow-none">
      <Card.Title>ثبت تجربه شما</Card.Title>
      <Card.Description className="mt-1 text-muted">نظر شما درباره {entityName}</Card.Description>
      <form onSubmit={submit} className="mt-6">
        <fieldset>
          <legend className="text-sm font-bold">امتیاز شما</legend>
          <div className="mt-3 flex justify-center gap-3" dir="ltr">
            {[1, 2, 3, 4, 5].map((star) => (
              <Button key={star} isIconOnly variant="ghost" size="lg" aria-label={`${star} ستاره`} aria-pressed={star <= rating} onPress={() => setRating(star)}>
                <Icon name="star-full" size={31} className={star <= rating ? "text-accent" : "text-muted/45"} />
              </Button>
            ))}
          </div>
        </fieldset>

        <label className="mt-6 block text-sm font-bold" htmlFor="review-body">نظر شما</label>
        <div className="app-field mt-3 h-auto min-h-40 p-0 focus-within:border-accent">
          <textarea id="review-body" value={body} maxLength={300} onChange={(event) => setBody(event.target.value)} placeholder="تجربه‌تان را با دیگران به اشتراک بگذارید…" className="min-h-32 w-full resize-none bg-transparent px-4 pt-4 text-sm leading-7 text-foreground outline-none placeholder:text-muted" />
          <div className="px-4 pb-3 text-end text-xs tabular-nums text-muted" dir="ltr">{body.length.toLocaleString("fa-IR")}/۳۰۰</div>
        </div>

        <fieldset className="mt-6">
          <legend className="text-sm font-bold">تجربه کلی شما</legend>
          <div className="app-surface mt-3 grid grid-cols-5 gap-1 rounded-[1.35rem] p-2">
            {experiences.map((item, index) => (
              <Button key={item.label} isIconOnly variant="ghost" aria-label={item.label} aria-pressed={experience === index + 1} onPress={() => setExperience(index + 1)} className={experience === index + 1 ? "bg-accent text-accent-foreground" : "text-muted"}>
                <Icon name={item.icon} size={24} />
              </Button>
            ))}
          </div>
        </fieldset>

        <Button type="submit" variant="primary" size="lg" className="mt-6 w-full font-black" isDisabled={!rating || !body.trim()} isPending={isPending}>
          ثبت نظر
          <Icon name="arrow-left" size={18} />
        </Button>
      </form>
    </Card>
  );
}
