"use client";

import { useState } from "react";
import { Button, Radio, RadioGroup, Skeleton, toast } from "@heroui/react";
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
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");

  const changeOpen = (nextOpen: boolean) => {
    if (!nextOpen) {
      setReason("");
      setDetails("");
    }
    onOpenChange(nextOpen);
  };

  const items = reasons.data?.items ?? [];

  return (
    <BottomSheet
      open={open}
      onOpenChange={changeOpen}
      snapPoints={[0.72, 0.92]}
      title="گزارش این صفحه"
      description="دلیل گزارش را انتخاب کنید و اگر لازم است جزئیات بیشتری بنویسید."
    >
      <form
        className="flex min-h-full flex-col gap-5 pt-2"
        onSubmit={async (event) => {
          event.preventDefault();
          const selected = items.find((item) => item.id === reason);
          if (!selected) return;
          try {
            await report.mutateAsync({
              targetType,
              targetId,
              reason: String(selected.name || selected.code || selected.id),
              details: details.trim(),
            });
            toast.success("گزارش شما ثبت شد");
            changeOpen(false);
          } catch {
            toast.danger("ثبت گزارش ناموفق بود؛ دوباره تلاش کنید");
          }
        }}
      >
        <fieldset>
          <legend className="mb-3 text-sm font-bold text-foreground">
            دلیل گزارش
          </legend>
          {reasons.isPending ? (
            <div className="grid gap-2" aria-label="در حال دریافت دلایل گزارش">
              {Array.from({ length: 5 }, (_, index) => (
                <Skeleton key={index} className="h-12 w-full rounded-xl" />
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
          ) : (
            <RadioGroup
              name="report-reason"
              value={reason}
              onChange={setReason}
              className="grid gap-2"
              aria-label="دلیل گزارش"
            >
              {items.map((item) => (
                <Radio
                  key={item.id}
                  value={item.id}
                  className="rounded-xl border border-foreground/10 bg-surface-secondary px-4 py-3 transition-colors data-[selected=true]:border-accent/40 data-[selected=true]:bg-accent/8"
                >
                  {item.name}
                </Radio>
              ))}
            </RadioGroup>
          )}
        </fieldset>

        <label className="grid gap-2 text-sm font-bold text-foreground">
          توضیحات تکمیلی
          <textarea
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            maxLength={2000}
            rows={5}
            className="min-h-32 resize-none rounded-2xl border border-foreground/12 bg-surface-secondary px-4 py-3 text-sm font-normal leading-7 text-foreground outline-none placeholder:text-muted focus:border-accent"
            placeholder="چه مشکلی در این صفحه دیدید؟"
          />
          <span className="text-end text-xs font-normal text-muted">
            {details.length.toLocaleString("fa-IR")} / ۲٬۰۰۰
          </span>
        </label>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="mt-auto w-full whitespace-nowrap"
          isDisabled={!reason || reasons.isPending}
          isPending={report.isPending}
        >
          ارسال گزارش
        </Button>
      </form>
    </BottomSheet>
  );
}
