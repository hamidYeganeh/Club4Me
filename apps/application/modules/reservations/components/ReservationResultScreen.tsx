"use client";
import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";
import { TaskStatusIntro } from "@/components/task-status-intro";

import { Button, Card } from "@heroui/react";
import { Icon } from "@theme/icon";
import { FallbackImage } from "@/components/FallbackImage";

type ReservationResultScreenProps = {
  status: "success" | "failed";
  message?: string;
  entity: {
    kind: "coach" | "club";
    title: string;
    subtitle: string;
    meta: string;
    imageUrl?: string | null;
  };
  onPrimary: () => void;
  onSecondary: () => void;
};

export function ReservationResultScreen({
  status,
  message,
  entity,
  onPrimary,
  onSecondary,
}: ReservationResultScreenProps) {
  const succeeded = status === "success";

  return (
    <main
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-80 overflow-y-auto bg-background"
    >
      <SecondaryHeader title="نتیجه رزرو" showFilter={false} showBack={false} />
      <div className="mx-auto flex min-h-[75dvh] w-full max-w-xl flex-col px-5 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <section className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <TaskStatusIntro tone={succeeded ? "success" : "danger"} title={succeeded ? "رزرو شما با موفقیت انجام شد" : "رزرو انجام نشد"}>
            {message ?? (succeeded ? "جزئیات رزرو در برنامه شما ثبت شد و از بخش رزروها در دسترس است." : "پرداخت یا ثبت رزرو کامل نشد. پیش از تلاش دوباره، وضعیت رزروهایتان را بررسی کنید.")}
          </TaskStatusIntro>

          <Card className="app-card mt-8 flex w-full flex-row items-center gap-3 rounded-[1.5rem] p-3 text-start shadow-none">
            <div className="relative size-20 shrink-0 overflow-hidden rounded-[1.15rem] bg-surface-secondary">
              <FallbackImage
                src={entity.imageUrl}
                alt={entity.title}
                fill
                unoptimized
                sizes="80px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="mb-1 inline-flex text-[11px] font-bold text-accent">
                {entity.kind === "coach" ? "مربی" : "باشگاه"}
              </span>
              <Card.Title className="line-clamp-1 text-base text-foreground">
                {entity.title}
              </Card.Title>
              <Card.Description className="mt-1 line-clamp-1 text-xs text-muted">
                {entity.subtitle}
              </Card.Description>
              <p className="mt-2 text-xs font-bold text-accent">
                {entity.meta}
              </p>
            </div>
          </Card>
        </section>

        <div className="flex flex-col gap-2">
          <Button
            variant={succeeded ? "primary" : "danger"}
            size="lg"
            fullWidth
            onPress={onPrimary}
            className="font-bold"
          >
            {succeeded ? "مشاهده رزروهای من" : "تلاش دوباره"}
            <Icon
              name={succeeded ? "calendar-check" : "arrow-rotate-clockwise-1"}
              size={20}
            />
          </Button>
          <Button
            variant="ghost"
            size="lg"
            fullWidth
            onPress={onSecondary}
            className="font-bold text-accent"
          >
            {succeeded ? "ادامه جست‌وجو" : "بازگشت به رزروها"}
          </Button>
        </div>
      </div>
    </main>
  );
}
