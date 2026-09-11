"use client";

import { REVEAL_TRANSITION, REDUCED_TRANSITION } from "@/lib/ease";

import { TextArea as HeroTextArea } from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import {
  Button,
  Label,
  Radio,
  RadioGroup,
  ScrollShadow,
  Skeleton,
} from "@heroui/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AlertCircle, Check } from "lucide-react";
import { useCreateReport } from "@api";
import { usePublicCatalogResource } from "@api/discovery";
import { BottomSheet } from "@/components/motion/bottom-sheet";

type ReportTargetType = "club" | "coach" | "class";

export function ReportBottomSheet({
  open,
  onOpenChange,
  targetType,
  targetId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: ReportTargetType;
  targetId: string;
}) {
  const reasons = usePublicCatalogResource(
    "moderation",
    "report-reason",
    { limit: 100 },
    open,
  );
  const report = useCreateReport();
  const reduceMotion = useReducedMotion();
  const submitting = useRef(false);
  const [status, setStatus] = useState<"form" | "sent" | "error">("form");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");

  const changeOpen = (nextOpen: boolean) => {
    if (submitting.current) return;
    if (!nextOpen) {
      setStatus("form");
      setReason("");
      setDetails("");
    }
    onOpenChange(nextOpen);
  };

  useEffect(() => {
    if (!open || status !== "sent") return;
    const timer = window.setTimeout(() => {
      setStatus("form");
      setReason("");
      setDetails("");
      onOpenChange(false);
    }, 1600);
    return () => window.clearTimeout(timer);
  }, [open, status, onOpenChange]);

  const items = reasons.data?.items ?? [];
  const targetLabel = { club: "باشگاه", coach: "مربی", class: "کلاس" }[
    targetType
  ];

  return (
    <BottomSheet
      open={open}
      onOpenChange={changeOpen}
      snapPoints={["auto"]}
      title={`گزارش ${targetLabel}`}
      contentClassName="flex min-h-0 flex-col overflow-hidden px-0 pb-0"
    >
      {/* Adapted from beui.dev/components/blocks/feedback-widget. */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          className="flex min-h-0 flex-1 flex-col"
          key={status === "sent" ? "sent" : "form"}
          initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reduceMotion ? 0 : -8 }}
          transition={reduceMotion ? REDUCED_TRANSITION : REVEAL_TRANSITION}
        >
          {status === "sent" ? (
            <div
              role="status"
              className="flex flex-col items-center gap-3 rounded-3xl bg-surface-secondary px-5 py-10 text-center"
            >
              <motion.div
                initial={{ scale: reduceMotion ? 1 : 0.7 }}
                animate={{ scale: 1 }}
                className="grid size-12 place-items-center rounded-full bg-success text-success-foreground"
              >
                <Check className="size-6" aria-hidden="true" />
              </motion.div>
              <h3 className="text-base font-bold text-foreground">
                گزارش شما ثبت شد
              </h3>
              <p className="text-sm leading-6 text-muted">
                ممنون که به بهتر شدن اطلاعات باشگاه کمک می‌کنید.
              </p>
            </div>
          ) : (
            <form
              className="flex min-h-0 flex-1 flex-col"
              onSubmit={async (event) => {
                event.preventDefault();
                const selected = items.find((item) => item.id === reason);
                if (!selected || submitting.current) return;
                submitting.current = true;
                setStatus("form");
                try {
                  await report.mutateAsync({
                    targetType,
                    targetId,
                    reason: String(
                      selected.name || selected.code || selected.id,
                    ),
                    details: details.trim(),
                  });
                  setStatus("sent");
                } catch {
                  setStatus("error");
                } finally {
                  submitting.current = false;
                }
              }}
            >
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4">
                <p className="mb-4 text-sm leading-6 text-muted">
                  دلیل گزارش را انتخاب کنید و اگر لازم است بیشتر توضیح دهید.
                </p>
                <fieldset disabled={report.isPending}>
                  <legend className="mb-3 text-sm font-bold text-foreground">
                    دلیل گزارش
                  </legend>
                  {reasons.isPending ? (
                    <div
                      className="grid gap-1"
                      aria-label="در حال دریافت دلایل گزارش"
                    >
                      {Array.from({ length: 5 }, (_, index) => (
                        <Skeleton
                          key={index}
                          className="h-12 w-full rounded-xl"
                        />
                      ))}
                    </div>
                  ) : reasons.isError ? (
                    <div className="rounded-2xl border border-danger/25 bg-danger/8 p-4 text-sm text-danger">
                      دریافت دلایل گزارش انجام نشد.
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="mt-3 w-full"
                        onPress={() => void reasons.refetch()}
                      >
                        تلاش دوباره
                      </Button>
                    </div>
                  ) : items.length === 0 ? (
                    <p role="status" className="py-3 text-sm text-muted">
                      در حال حاضر دلیلی برای گزارش موجود نیست. لطفاً بعداً تلاش
                      کنید.
                    </p>
                  ) : (
                    <ScrollShadow className="h-[240px] w-full" size={24}>
                      <RadioGroup
                        isDisabled={report.isPending}
                        name="report-reason"
                        value={reason}
                        onChange={setReason}
                        className="grid gap-1"
                        aria-label="دلیل گزارش"
                      >
                        {items.map((item) => (
                          <Radio
                            key={item.id}
                            value={item.id}
                            className="w-full rounded-xl bg-surface-secondary transition-colors has-[:checked]:bg-accent/10"
                          >
                            <Radio.Content className="min-h-11 w-full px-3 py-2">
                              <Radio.Control>
                                <Radio.Indicator />
                              </Radio.Control>
                              <Label className="text-sm leading-6">
                                {String(item.name || item.code || item.id)}
                              </Label>
                            </Radio.Content>
                          </Radio>
                        ))}
                      </RadioGroup>
                    </ScrollShadow>
                  )}
                </fieldset>

                <label className="mt-4 grid gap-2 text-sm font-bold text-foreground">
                  توضیحات تکمیلی (اختیاری)
                  <HeroTextArea
                    value={details}
                    onChange={(event) => setDetails(event.target.value)}
                    maxLength={2000}
                    disabled={report.isPending}
                    rows={2}
                    className="min-h-20 resize-none rounded-xl border border-foreground/12 bg-background px-3 py-2 text-sm font-normal leading-7 text-foreground outline-none placeholder:text-muted focus:border-accent"
                    placeholder="چه مشکلی در این صفحه دیدید؟"
                  />
                  <span className="text-end text-xs font-normal text-muted">
                    {details.length.toLocaleString("fa-IR")} / ۲٬۰۰۰
                  </span>
                </label>
              </div>
              {status === "error" && (
                <div
                  role="alert"
                  className="flex items-center gap-2 rounded-2xl bg-danger/10 p-3 text-sm text-danger"
                >
                  <AlertCircle className="size-5 shrink-0" aria-hidden="true" />
                  ثبت گزارش ناموفق بود؛ اطلاعات شما حفظ شده است. دوباره تلاش
                  کنید.
                </div>
              )}
              <div className="flex shrink-0 gap-2 border-t border-foreground/10 bg-surface px-5 pt-3 pb-[calc(0.75rem+var(--app-safe-bottom,0px))]">
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  className="flex-1"
                  isDisabled={report.isPending}
                  onPress={() => changeOpen(false)}
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="flex-1 whitespace-nowrap"
                  isDisabled={
                    !items.some((item) => item.id === reason) ||
                    reasons.isPending ||
                    reasons.isError ||
                    report.isPending
                  }
                  isPending={report.isPending}
                >
                  {status === "error"
                    ? "تلاش دوباره"
                    : report.isPending
                      ? "در حال ارسال"
                      : "ارسال گزارش"}
                </Button>
              </div>
            </form>
          )}
        </motion.div>
      </AnimatePresence>
    </BottomSheet>
  );
}
