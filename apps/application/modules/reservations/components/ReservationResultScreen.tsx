"use client";

import { Button, Card } from "@heroui/react";
import { Icon } from "@theme/icon";
import { FallbackImage } from "@/components/FallbackImage";

type ReservationResultScreenProps = {
  status: "success" | "failed";
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
      <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-5 pt-[max(3.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <section className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <div
            className={`relative mb-8 grid size-36 place-items-center rounded-full ${
              succeeded ? "bg-success/12 text-success" : "bg-danger/12 text-danger"
            }`}
          >
            <span
              aria-hidden
              className={`absolute inset-3 rounded-full border ${
                succeeded ? "border-success/25" : "border-danger/25"
              }`}
            />
            <span
              className={`grid size-24 place-items-center rounded-[2rem] ${
                succeeded
                  ? "rotate-[-8deg] bg-success text-success-foreground"
                  : "rotate-[8deg] bg-danger text-danger-foreground"
              }`}
            >
              <Icon
                name={succeeded ? "check" : "close-x"}
                size={52}
              />
            </span>
          </div>

          <h1 className="max-w-sm text-3xl leading-tight font-black tracking-tight text-foreground">
            {succeeded ? "رزرو شما با موفقیت انجام شد" : "رزرو انجام نشد"}
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-7 text-muted">
            {succeeded
              ? "جزئیات رزرو در برنامه شما ثبت شد و همیشه از بخش رزروها در دسترس است."
              : "پرداخت یا ثبت رزرو کامل نشد. ظرفیت برای شما ثبت نشده و می‌توانید دوباره تلاش کنید."}
          </p>

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
              <p className="mt-2 text-xs font-bold text-accent">{entity.meta}</p>
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
