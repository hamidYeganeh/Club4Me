"use client";
import { TaskStatusIntro } from "@/components/task-status-intro";

import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";
import { Button, Card } from "@heroui/react";
import type { CoachBooking } from "@api";
import { Icon } from "@theme/icon";

import { FallbackImage } from "@/components/FallbackImage";

export function CoachReservationSuccessScreen({
  coach,
  booking,
  phone,
  cancelPending,
  onCall,
  onReschedule,
  onCancel,
}: {
  coach: {
    displayName: string;
    shortBio: string;
    imageUrl?: string | null;
    averageRating: number;
    reviewsCount: number;
  };
  booking: CoachBooking;
  phone?: string;
  cancelPending: boolean;
  onCall: () => void;
  onReschedule: () => void;
  onCancel: () => void;
}) {
  const startsAt = new Date(booking.sessionStartsAt);
  const isOnline = booking.deliveryMode === "online";

  return (
    <main className="flex min-h-dvh flex-col bg-background text-foreground">
      <SecondaryHeader title="رسید رزرو" showFilter={false} />
      <div className="mx-auto flex w-full max-w-xl flex-col px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-5">
        <section className="flex flex-1 flex-col justify-center">
          <TaskStatusIntro tone="success" title={`رزرو جلسه با ${coach.displayName} قطعی شد`}>
          <p className="mx-auto mt-4 max-w-sm text-center text-base leading-8 text-muted">
            {startsAt.toLocaleDateString("fa-IR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
            ، ساعت{" "}
            {startsAt.toLocaleTimeString("fa-IR", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })}
            {isOnline
              ? " یک جلسه آنلاین دارید."
              : " جلسه تمرینی شما برگزار می‌شود."}
          </p>
          </TaskStatusIntro>

          <Card className="app-card mt-5 shadow-none">
            <Card.Content className="flex items-center gap-4 p-5">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-full bg-surface-secondary ring-2 ring-accent/20">
                <FallbackImage
                  src={coach.imageUrl}
                  alt={coach.displayName}
                  fill
                  unoptimized
                  sizes="80px"
                  className="object-cover"
                />
                <span className="absolute bottom-0 end-0 grid size-6 place-items-center rounded-full border-2 border-surface bg-success text-success-foreground">
                  <Icon name="check" size={12} />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <Card.Title className="truncate text-lg font-black">
                  {coach.displayName}
                </Card.Title>
                <Card.Description className="mt-1 line-clamp-1 text-muted">
                  {booking.offeringTitle ||
                    coach.shortBio ||
                    booking.sessionTitle}
                </Card.Description>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <span className="flex items-center gap-1 font-bold">
                    <Icon name="star-full" size={16} className="text-warning" />
                    {coach.averageRating.toLocaleString("fa-IR")}
                    <span className="font-normal text-muted">
                      ({coach.reviewsCount.toLocaleString("fa-IR")} نظر)
                    </span>
                  </span>
                  <span className="text-success">
                    ● {isOnline ? "آنلاین" : "حضوری"}
                  </span>
                </div>
              </div>
              <Icon name="chevron-left" size={20} className="text-muted" />
            </Card.Content>
          </Card>

          <div className="mt-10 grid grid-cols-3 gap-3">
            <ActionButton
              icon="telephone-1"
              label={phone ? "تماس با مربی" : "شماره ثبت نشده"}
              variant="primary"
              isDisabled={!phone}
              onPress={onCall}
            />
            <ActionButton
              icon="calendar-2"
              label="تغییر زمان"
              variant="secondary"
              onPress={onReschedule}
            />
            <ActionButton
              icon="close-x"
              label="لغو رزرو"
              variant="danger"
              isPending={cancelPending}
              onPress={onCancel}
            />
          </div>
        </section>

        <p className="mt-10 text-center text-xs leading-6 text-muted">
          شناسه رزرو: <span dir="ltr">{booking.id.slice(-8)}</span>
        </p>
      </div>
    </main>
  );
}

function ActionButton({
  icon,
  label,
  variant,
  isDisabled,
  isPending,
  onPress,
}: {
  icon: "telephone-1" | "calendar-2" | "close-x";
  label: string;
  variant: "primary" | "secondary" | "danger";
  isDisabled?: boolean;
  isPending?: boolean;
  onPress: () => void;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-3 text-center">
      <Button
        isIconOnly
        size="lg"
        variant={variant}
        aria-label={label}
        className="size-16 min-h-16 min-w-16 rounded-full shadow-lg"
        isDisabled={isDisabled}
        isPending={isPending}
        onPress={onPress}
      >
        <Icon name={icon} size={28} />
      </Button>
      <span className="text-xs font-bold leading-5 text-muted sm:text-sm">
        {label}
      </span>
    </div>
  );
}
