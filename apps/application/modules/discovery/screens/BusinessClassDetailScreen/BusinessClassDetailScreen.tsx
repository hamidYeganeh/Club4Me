"use client";

import { useCallback, useState } from "react";
import { Button, Card, Chip, toast, Typography } from "@heroui/react";
import {
  useAthleteClubClasses,
  useAthleteClassCheckIn,
  useCancelClubClassEnrollment,
  useEnrollInClubClass,
  usePublicClubClass,
  useResolveClubClassPayment,
} from "@api";
import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";
import { MockPaymentGateway } from "@modules/payments/components/MockPaymentGateway";
import { QrScannerButton } from "@/components/qr-scanner-button";
import { DetailPageSkeleton } from "@/components/loading-skeletons";

const modelLabel: Record<string, string> = {
  group: "گروهی",
  private: "خصوصی",
  course: "دوره‌ای",
  single: "تک جلسه",
  open: "آزاد",
};

export function BusinessClassDetailScreen({ classId }: { classId: string }) {
  const query = usePublicClubClass(classId);
  const enrollments = useAthleteClubClasses();
  const enroll = useEnrollInClubClass();
  const payment = useResolveClubClassPayment();
  const cancel = useCancelClubClassEnrollment();
  const checkIn = useAthleteClassCheckIn();
  const [checkInCredential, setCheckInCredential] = useState("");
  const [checkInSessionId, setCheckInSessionId] = useState("");
  const acceptQr = useCallback((value: string) => {
    const match = /^gym4me-checkin:([a-f\d]{24})\./i.exec(value);
    if (match?.[1]) setCheckInSessionId(match[1]);
    setCheckInCredential(value);
  }, []);
  const [paymentEnrollmentId, setPaymentEnrollmentId] = useState<string | null>(
    null,
  );
  const item = query.data;
  const current = enrollments.data?.items.find(
    (entry) => entry.classId === classId,
  );

  if (query.isPending)
    return <DetailPageSkeleton />;
  if (!item)
    return (
      <main className="app-page">
        <SecondaryHeader title="کلاس" />
        <Card className="app-card p-6 text-center shadow-none">
          این کلاس در دسترس نیست.
        </Card>
      </main>
    );

  const startEnrollment = async () => {
    try {
      const result = await enroll.mutateAsync(item.id);
      if (result.paymentStatus === "pending") setPaymentEnrollmentId(result.id);
      else
        toast.success(
          result.status === "active"
            ? "ثبت‌نام کلاس قطعی شد"
            : result.status === "waitlisted"
              ? "به لیست انتظار اضافه شدید"
              : "درخواست برای تأیید باشگاه ارسال شد",
        );
    } catch {
      toast.danger("ثبت‌نام انجام نشد؛ دوباره تلاش کنید");
    }
  };
  const resolve = async (result: "approve" | "reject") => {
    const enrollmentId = paymentEnrollmentId ?? current?.id;
    if (!enrollmentId) return;
    try {
      const saved = await payment.mutateAsync({ enrollmentId, result });
      setPaymentEnrollmentId(null);
      const message =
        result === "approve"
          ? saved.status === "active"
            ? "پرداخت موفق و ثبت‌نام قطعی شد"
            : saved.status === "waitlisted"
              ? "پرداخت موفق؛ در لیست انتظار هستید"
              : "پرداخت موفق؛ منتظر تأیید باشگاه باشید"
          : "پرداخت ناموفق بود و ثبت‌نام لغو شد";
      if (result === "approve") toast.success(message);
      else toast.danger(message);
    } catch {
      toast.danger("ثبت نتیجه پرداخت انجام نشد");
    }
  };
  const cancelCurrent = async () => {
    if (!current || !window.confirm("ثبت‌نام این کلاس لغو شود؟")) return;
    try {
      await cancel.mutateAsync(current.id);
      toast.success("ثبت‌نام لغو شد");
    } catch {
      toast.danger("لغو ثبت‌نام انجام نشد");
    }
  };
  const active =
    current && ["pending", "active", "waitlisted"].includes(current.status);
  const canEnroll =
    item.status === "active" &&
    (!current ||
      current.status === "cancelled" ||
      current.paymentStatus === "failed");

  return (
    <main className="app-page gap-5">
      <SecondaryHeader title="جزئیات کلاس" />
      <section className="app-reveal rounded-[2rem] border border-white/8 bg-linear-to-br from-accent/18 via-surface to-surface p-6">
        <div className="flex flex-wrap gap-2">
          <Chip size="sm" color="accent" variant="soft">
            {modelLabel[item.model]}
          </Chip>
          <Chip size="sm" variant="soft">
            {item.sport || "ورزشی"}
          </Chip>
          {item.level ? (
            <Chip size="sm" variant="soft">
              {item.level}
            </Chip>
          ) : null}
        </div>
        <Typography type="h2" weight="bold" className="mt-5">
          {item.title}
        </Typography>
        <p className="mt-3 leading-7 text-muted">
          {item.description || "توضیحات این کلاس توسط باشگاه تکمیل می‌شود."}
        </p>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs">
          <Fact
            label="ظرفیت باقی‌مانده"
            value={item.remainingCapacity.toLocaleString("fa-IR")}
          />
          <Fact
            label="شروع"
            value={new Date(item.startDate).toLocaleDateString("fa-IR")}
          />
          <Fact
            label="شهریه"
            value={item.price ? item.price.toLocaleString("fa-IR") : "رایگان"}
          />
        </div>
      </section>

      <Card className="app-card rounded-3xl p-5 shadow-none">
        <Card.Title>محل و برگزارکننده</Card.Title>
        <div className="mt-4 grid gap-3 text-sm">
          <Line label="باشگاه" value={item.club.name} />
          <Line label="مربی" value={item.coach?.name ?? "در حال تعیین"} />
          <Line label="شعبه" value={item.branch?.name ?? "شعبه اصلی"} />
          {item.branch?.address ? (
            <p className="rounded-2xl bg-surface-secondary p-3 text-xs leading-6 text-muted">
              {item.branch.address}
            </p>
          ) : null}
        </div>
      </Card>

      {current?.status === "active" && item.sessions.length ? (
        <Card className="app-card rounded-3xl p-5 shadow-none">
          <Card.Title>ورود به جلسه</Card.Title>
          <p className="mt-2 text-xs leading-6 text-muted">
            کد ۵ رقمی اعلام‌شده توسط باشگاه را وارد کنید؛ محتوای QR اسکن‌شده نیز
            پذیرفته می‌شود.
          </p>
          <select
            className="mt-4 h-11 w-full rounded-xl border border-white/10 bg-surface-secondary px-3 text-sm"
            value={checkInSessionId || item.sessions[0]?.id}
            onChange={(event) => setCheckInSessionId(event.target.value)}
          >
            {item.sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {new Date(session.startsAt).toLocaleString("fa-IR", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </option>
            ))}
          </select>
          <input
            dir="ltr"
            inputMode="numeric"
            value={checkInCredential}
            onChange={(event) =>
              setCheckInCredential(event.target.value.trim())
            }
            className="mt-3 h-12 w-full rounded-xl border border-white/10 bg-surface-secondary px-4 text-center text-xl tracking-[.25em] outline-none focus:border-accent"
            placeholder="کد ۵ رقمی"
          />
          <QrScannerButton onScan={acceptQr} />
          <Button
            className="mt-3 w-full"
            variant="primary"
            isPending={checkIn.isPending}
            isDisabled={!checkInCredential}
            onPress={async () => {
              try {
                await checkIn.mutateAsync({
                  classId: item.id,
                  sessionId: checkInSessionId || item.sessions[0]!.id,
                  credential: checkInCredential,
                });
                setCheckInCredential("");
                toast.success("ورود شما با موفقیت ثبت شد");
              } catch {
                toast.danger("کد نامعتبر یا منقضی است");
              }
            }}
          >
            ثبت ورود
          </Button>
        </Card>
      ) : null}

      <Card className="app-card rounded-3xl p-5 shadow-none">
        <Card.Title>جلسات پیش رو</Card.Title>
        <div className="mt-4 flex flex-col gap-2">
          {item.sessions.slice(0, 8).map((session) => (
            <div
              key={session.id}
              className="rounded-2xl bg-surface-secondary p-3 text-sm"
            >
              <strong>
                {new Date(session.startsAt).toLocaleDateString("fa-IR", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </strong>
              <span className="mr-2 text-muted">
                {new Date(session.startsAt).toLocaleTimeString("fa-IR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          ))}
          {!item.sessions.length ? (
            <p className="text-sm text-muted">جلسه آینده‌ای ثبت نشده است.</p>
          ) : null}
        </div>
      </Card>

      <Card className="app-card rounded-3xl p-5 shadow-none">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-bold">
              {current ? "وضعیت ثبت‌نام شما" : "ثبت‌نام در کلاس"}
            </p>
            <p className="mt-1 text-xs text-muted">
              {current
                ? statusText(current.status, current.paymentStatus)
                : item.enrollmentMode === "requires_approval"
                  ? "پس از پرداخت نیازمند تأیید باشگاه"
                  : "ثبت‌نام خودکار پس از پرداخت"}
            </p>
          </div>
          <strong className="text-accent">
            {item.price
              ? `${item.price.toLocaleString("fa-IR")} ریال`
              : "رایگان"}
          </strong>
        </div>
        {current?.paymentStatus === "pending" ? (
          <Button
            className="mt-4 w-full"
            variant="primary"
            onPress={() => setPaymentEnrollmentId(current.id)}
          >
            ادامه پرداخت
          </Button>
        ) : canEnroll ? (
          <Button
            className="mt-4 w-full"
            variant="primary"
            isPending={enroll.isPending}
            onPress={() => void startEnrollment()}
          >
            ثبت‌نام
          </Button>
        ) : null}
        {active ? (
          <Button
            className="mt-2 w-full"
            variant="danger-soft"
            isPending={cancel.isPending}
            onPress={() => void cancelCurrent()}
          >
            لغو ثبت‌نام
          </Button>
        ) : null}
      </Card>
      {paymentEnrollmentId ? (
        <MockPaymentGateway
          title={item.title}
          amount={item.price}
          isPending={payment.isPending}
          onResult={(result) => void resolve(result)}
        />
      ) : null}
    </main>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-background/35 p-3">
      <strong className="block text-base">{value}</strong>
      <span className="mt-1 block text-muted">{label}</span>
    </div>
  );
}
function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
function statusText(status: string, payment: string) {
  if (payment === "pending") return "در انتظار پرداخت";
  if (status === "active") return "ثبت‌نام قطعی";
  if (status === "waitlisted") return "در لیست انتظار";
  if (status === "pending") return "در انتظار تأیید باشگاه";
  return "ثبت‌نام بسته";
}
