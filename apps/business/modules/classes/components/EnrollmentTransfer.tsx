"use client";

import { useRef, useState } from "react";
import { Button } from "@heroui/react";
import { FormSelect, FormOption } from "@repo/ui/form-select";
import type {
  BusinessClassEnrollment,
  BusinessTrainingClass,
} from "@api/business";

export function EnrollmentTransfer({
  enrollment,
  classes,
  onTransfer,
  onRefund,
}: {
  enrollment: BusinessClassEnrollment;
  classes: BusinessTrainingClass[];
  onTransfer: (targetClassId: string) => Promise<unknown>;
  onRefund: () => Promise<unknown>;
}) {
  const [confirmRefund, setConfirmRefund] = useState(false);
  const [targetId, setTargetId] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const busy = useRef(false);
  const target = classes.find((item) => item.id === targetId);
  if (!["active", "waitlisted"].includes(enrollment.status)) return null;
  if (enrollment.transferRequiresRefund)
    return (
      <div className="max-w-sm rounded-xl bg-surface-secondary p-3 text-xs leading-6">
        ثبت‌نام آنلاین پرداخت‌شده باید ابتدا لغو و بازپرداخت شود، سپس ثبت‌نام
        تازه در کلاس مقصد انجام شود.
        {confirmRefund ? (
          <div className="mt-2 space-y-2">
            <p>
              ثبت‌نام فعلی لغو و مبلغ پرداخت آنلاین از مسیر پرداخت شبیه‌سازی‌شده
              مسترد می‌شود. جای شما در کلاس مقصد رزرو نمی‌شود؛ پس از لغو باید
              ثبت‌نام جدید انجام دهید.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                isPending={pending}
                isDisabled={pending}
                onPress={() => {
                  void (async () => {
                    if (busy.current) return;
                    busy.current = true;
                    setPending(true);
                    setError("");
                    try {
                      await onRefund();
                      setConfirmRefund(false);
                    } catch {
                      setError(
                        "لغو و بازپرداخت انجام نشد؛ وضعیت حساب را بررسی و دوباره تلاش کنید.",
                      );
                    } finally {
                      busy.current = false;
                      setPending(false);
                    }
                  })();
                }}
              >
                تأیید لغو و بازپرداخت
              </Button>
              <Button
                size="sm"
                variant="secondary"
                isDisabled={pending}
                onPress={() => setConfirmRefund(false)}
              >
                انصراف
              </Button>
            </div>
          </div>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            onPress={() => {
              setConfirmRefund(true);
              setError("");
            }}
          >
            لغو و بازپرداخت ثبت‌نام
          </Button>
        )}
        {error ? (
          <p role="alert" className="text-danger">
            {error}
          </p>
        ) : null}
        <a
          className="block text-accent underline"
          href={`/payments?studentId=${enrollment.studentId}`}
        >
          بررسی حساب و پرداخت ثبت‌نام
        </a>
      </div>
    );
  const submit = async () => {
    if (!target || busy.current) return;
    busy.current = true;
    setPending(true);
    setError("");
    setSuccess(false);
    try {
      await onTransfer(target.id);
      setTargetId("");
      setSuccess(true);
    } catch (failure) {
      const code = (failure as { code?: string })?.code;
      const messages: Record<string, string> = {
        PAID_CLASS_TRANSFER_REQUIRES_REFUND:
          "ثبت‌نام آنلاین باید ابتدا لغو و بازپرداخت شود.",
        TRANSFER_CONTRACT_MISMATCH:
          "واحد پول قراردادها یکسان نیست؛ انتقال مستقیم ممکن نیست.",
        TRANSFER_CAPACITY_REQUIRED: "کلاس مقصد ظرفیت کافی ندارد.",
        TRANSFER_CREDITS_EXCEEDED:
          "تعداد جلسات مصرف‌شده بیشتر از سهمیه کلاس مقصد است.",
        BILLING_RECONCILIATION_REQUIRED:
          "ابتدا حساب شهریه قدیمی را در بخش پرداخت‌ها تطبیق دهید.",
      };
      setError(
        messages[code ?? ""] ??
          "انتقال انجام نشد. اطلاعات و انتخاب شما حفظ شده؛ دوباره تلاش کنید.",
      );
    } finally {
      busy.current = false;
      setPending(false);
    }
  };
  return (
    <div className="w-full max-w-sm space-y-3 rounded-xl bg-surface-secondary p-3">
      <FormSelect
        aria-label="انتقال شاگرد"
        value={targetId}
        disabled={pending}
        onChange={(value) => {
          setTargetId(value);
          setError("");
          setSuccess(false);
        }}
      >
        <FormOption value="">انتخاب کلاس مقصد</FormOption>
        {classes
          .filter(
            (item) =>
              item.id !== enrollment.classId && item.status === "active",
          )
          .map((item) => (
            <FormOption key={item.id} value={item.id} entity={item}>
              {item.title}
            </FormOption>
          ))}
      </FormSelect>
      {target ? (
        <div className="space-y-2 text-xs leading-6">
          <p>
            انتقال به «{target.title}»؛ شهریه مقصد{" "}
            {target.price.toLocaleString("fa-IR")}{" "}
            {target.currency === "IRR" ? "ریال" : target.currency}. پرداخت‌های
            قبلی منتقل می‌شوند و اختلاف به‌صورت بدهی یا بستانکاری در حساب شهریه
            باقی می‌ماند. جلسات مصرف‌شده از سهمیه مقصد کسر می‌شوند.
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              isPending={pending}
              isDisabled={pending}
              onPress={() => void submit()}
            >
              تأیید انتقال
            </Button>
            <Button
              size="sm"
              variant="secondary"
              isDisabled={pending}
              onPress={() => {
                setTargetId("");
                setError("");
              }}
            >
              انصراف
            </Button>
          </div>
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="text-xs leading-6 text-danger">
          {error}
        </p>
      ) : null}
      {success ? (
        <p role="status" className="text-xs text-success">
          شاگرد منتقل شد.
        </p>
      ) : null}
    </div>
  );
}
