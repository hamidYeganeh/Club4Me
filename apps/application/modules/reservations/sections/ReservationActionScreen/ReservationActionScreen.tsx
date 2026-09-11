"use client";
import { RadioGroup, Radio } from "@heroui/react";
import { TextArea as HeroTextArea } from "@heroui/react";
import { TaskStatusIntro } from "@/components/task-status-intro";

import { useState } from "react";
import { RescheduleReservationForm } from "../../components/RescheduleReservationForm";
import Link from "@/components/app-link";
import { Button, Skeleton } from "@heroui/react";
import { Icon } from "@theme/icon";
import type { PublicResourceItem } from "@api/discovery";
import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";
import type { TimelineReservation } from "../../reservations.types";
import {
  durationMinutes,
  formatReservationTime,
} from "../../reservations.utils";

type Props = {
  reservation: TimelineReservation;
  reasons: PublicResourceItem[];
  reasonsPending: boolean;
  cancelPending: boolean;
  onBack: () => void;
  onCancel: (reason: string) => void;
};

export function ReservationActionScreen({
  reservation,
  reasons,
  reasonsPending,
  cancelPending,
  onBack,
  onCancel,
}: Props) {
  const [mode, setMode] = useState<"cancel" | "time">("cancel");
  const [reasonId, setReasonId] = useState("");
  const [customReason, setCustomReason] = useState("");
  const selectedReason =
    reasons.find((item) => item.id === reasonId)?.name ?? customReason.trim();
  const date = new Intl.DateTimeFormat("fa-IR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(reservation.sessionStartsAt));

  return (
    <main className="fixed inset-x-0 top-0 bottom-[var(--keyboard-inset,0px)] z-60 mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col overflow-y-auto bg-background pb-[calc(2rem+env(safe-area-inset-bottom))]">
      <SecondaryHeader
        title={mode === "cancel" ? "لغو رزرو" : "تغییر زمان رزرو"}
        showFilter={false}
        onBack={onBack}
      />
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 px-5 pt-5">
        <TaskStatusIntro
          title={
            mode === "cancel"
              ? "پیش از لغو بررسی کنید"
              : "زمان مناسب‌تری انتخاب کنید"
          }
        >
          {mode === "cancel"
            ? "شرایط لغو و مبلغ قابل بازگشت را پیش از تأیید بخوانید."
            : "برای رزرو زمان جدید، ظرفیت و شرایط جلسه را بررسی کنید."}
        </TaskStatusIntro>
        <section className="app-card p-5">
          <div className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent/12 text-accent">
              <Icon name="calendar-1" size={24} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-extrabold">
                {reservation.sessionTitle}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {date}، ساعت{" "}
                {formatReservationTime(reservation.sessionStartsAt)}
              </p>
              <p className="mt-2 text-xs text-muted">
                {durationMinutes(
                  reservation.sessionStartsAt,
                  reservation.sessionEndsAt,
                ).toLocaleString("fa-IR")}{" "}
                دقیقه
              </p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-2 rounded-[1.25rem] bg-surface-secondary p-1.5">
          <button
            type="button"
            onClick={() => setMode("cancel")}
            className={`h-12 rounded-2xl text-sm font-bold transition ${mode === "cancel" ? "bg-surface text-danger shadow-sm" : "text-muted"}`}
          >
            لغو رزرو
          </button>
          <button
            type="button"
            onClick={() => setMode("time")}
            className={`h-12 rounded-2xl text-sm font-bold transition ${mode === "time" ? "bg-surface text-accent shadow-sm" : "text-muted"}`}
          >
            تغییر زمان
          </button>
        </div>

        {mode === "cancel" ? (
          <section className="app-card flex flex-col gap-4 p-5">
            <div>
              <h2 className="text-lg font-extrabold">
                دلیل لغو را انتخاب کنید
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted">
                مبلغ بازگشتی طبق{" "}
                {reservation.cancellationPolicyTitle ?? "قانون لغو این رزرو"}{" "}
                محاسبه می‌شود.
              </p>
            </div>
            {reasonsPending ? (
              Array.from({ length: 3 }, (_, index) => (
                <Skeleton key={index} className="h-12 rounded-xl" />
              ))
            ) : (
              <RadioGroup
                aria-label="دلیل لغو رزرو"
                name="cancellation-reason"
                value={reasonId}
                onChange={(value) => {
                  setReasonId(value);
                  if (value !== "other") setCustomReason("");
                }}
              >
                {reasons.map((reason) => (
                  <Radio key={reason.id} value={reason.id}>
                    <Radio.Content className="min-h-12">
                      <Radio.Control>
                        <Radio.Indicator />
                      </Radio.Control>
                      {reason.name}
                    </Radio.Content>
                  </Radio>
                ))}
                <Radio value="other">
                  <Radio.Content className="min-h-12">
                    <Radio.Control>
                      <Radio.Indicator />
                    </Radio.Control>
                    سایر
                  </Radio.Content>
                </Radio>
              </RadioGroup>
            )}
            {reasonId === "other" ? (
              <div>
                <label
                  htmlFor="custom-cancellation-reason"
                  className="mb-2 block text-sm font-bold"
                >
                  دلیل شما
                </label>
                <HeroTextArea
                  id="custom-cancellation-reason"
                  maxLength={300}
                  value={customReason}
                  onChange={(event) => setCustomReason(event.target.value)}
                  placeholder="دلیل لغو را بنویسید…"
                  className="app-field h-32 w-full resize-none py-4 text-sm"
                />
                <p className="mt-1 text-end text-xs text-muted">
                  {customReason.length.toLocaleString("fa-IR")}/۳۰۰
                </p>
              </div>
            ) : null}
            <Button
              variant="danger"
              fullWidth
              isPending={cancelPending}
              isDisabled={!selectedReason}
              onPress={() => onCancel(selectedReason)}
              className="mt-1 font-bold"
            >
              تأیید لغو رزرو
            </Button>
          </section>
        ) : reservation.source === "club" &&
          reservation.clubId &&
          ["paid", "not_required"].includes(reservation.paymentStatus) ? (
          <RescheduleReservationForm
            id={reservation.sourceId ?? reservation.id}
            clubId={reservation.clubId}
            sessionId={reservation.sessionId}
            onDone={onBack}
          />
        ) : (
          <section className="app-card flex flex-col gap-4 p-5">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-accent/12 text-accent">
              <Icon name="clock" size={24} />
            </span>
            <div>
              <h2 className="text-lg font-extrabold">
                یک زمان تازه انتخاب کنید
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted">
                انتخاب زمان جدید، یک رزرو جدا می‌سازد و رزرو فعلی را لغو
                نمی‌کند. برای لغو رزرو فعلی، شرایط بازپرداخت آن را بررسی کنید.
              </p>
            </div>
            {reservation.changeTimeHref ? (
              <Link
                href={reservation.changeTimeHref}
                className="flex h-16 w-full items-center justify-center rounded-2xl bg-accent font-bold text-accent-foreground transition-transform active:scale-[.98]"
              >
                مشاهده زمان‌های موجود
              </Link>
            ) : (
              <Button fullWidth isDisabled>
                زمان دیگری موجود نیست
              </Button>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
