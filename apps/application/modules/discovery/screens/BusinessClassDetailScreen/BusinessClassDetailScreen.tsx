"use client";
import { useNow } from "@/lib/use-now";
import { ClassTrainingGroups } from "../../components/ClassTrainingGroups";
import { FormSelect, FormOption } from "@repo/ui/form-select";
import { Input as HeroInput } from "@heroui/react";
import { DetailSocialSection } from "../../components/DetailSocialSection";
import { RelatedBusinessClasses } from "../../components/RelatedBusinessClasses";

import { useCallback, useState } from "react";
import { Button, Card, Chip, toast } from "@heroui/react";
import {
  useAthleteClubClasses,
  useAthleteClassCheckIn,
  useCancelClubClassEnrollment,
  useClaimClubClassWaitlist,
  useRenewClubClassWaitlist,
  useCreatePaymentIntent,
  useEnrollInClubClass,
  useMockPaymentDecision,
  usePublicClubClass,
  type PaymentIntent,
} from "@api";
import { DiscoveryImageHero } from "../../components/DiscoveryImageHero";
import { DiscoveryQueryPage } from "../../components/DiscoveryQueryPage";
import { DiscoveryQueryState } from "../../components/DiscoveryQueryState";
import { getQueryFailure } from "@/lib/request-failure";
import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";
import { MockPaymentGateway } from "@modules/payments/components/MockPaymentGateway";
import { QrScannerButton } from "@/components/qr-scanner-button";
import { DetailPageSkeleton } from "@/components/loading-skeletons";
import { DetailFaqSection } from "@modules/discovery/components/DetailFaqSection";

const modelLabel: Record<string, string> = {
  group: "گروهی",
  private: "خصوصی",
  course: "دوره‌ای",
  single: "تک جلسه",
  open: "آزاد",
};

export function BusinessClassDetailScreen({ classId }: { classId: string }) {
  const query = usePublicClubClass(classId);
  const now = useNow();
  const enrollments = useAthleteClubClasses();
  const enroll = useEnrollInClubClass();
  const createPayment = useCreatePaymentIntent();
  const payment = useMockPaymentDecision();
  const cancel = useCancelClubClassEnrollment();
  const claimWaitlist = useClaimClubClassWaitlist();
  const renewWaitlist = useRenewClubClassWaitlist();
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

  if (getQueryFailure(query.error, query.fetchStatus) && !item)
    return <DiscoveryQueryPage title="کلاس" query={query} />;
  if (query.isPending) return <DetailPageSkeleton />;
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
      if (result.paymentStatus === "pending") await startPayment(result.id);
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
  const startPayment = async (enrollmentId: string) => {
    setPaymentEnrollmentId(enrollmentId);
  };
  const resolve = async (
    result: "approve" | "reject",
    accepted?: PaymentIntent,
  ) => {
    if (!paymentEnrollmentId) return;
    try {
      const paymentIntent =
        accepted ??
        (await createPayment.mutateAsync({
          referenceType: "business_class_enrollment",
          referenceId: paymentEnrollmentId,
          idempotencyKey: `class-${paymentEnrollmentId}-${crypto.randomUUID()}`,
          returnUrl: window.location.href,
        }));
      const resolved = await payment.mutateAsync({
        intentId: paymentIntent.id,
        status: result === "approve" ? "paid" : "failed",
      });
      setPaymentEnrollmentId(null);
      await enrollments.refetch();
      const message =
        resolved.status === "paid"
          ? "پرداخت موفق و وضعیت ثبت‌نام به‌روزرسانی شد"
          : "پرداخت ناموفق بود و ثبت‌نام لغو شد";
      if (resolved.status === "paid") toast.success(message);
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
  const claimCurrentWaitlist = async () => {
    if (!current) return;
    try {
      await claimWaitlist.mutateAsync(current.id);
      await enrollments.refetch();
      toast.success("جای خالی کلاس برای شما ثبت شد");
    } catch {
      toast.danger("مهلت ثبت جای خالی تمام شده یا ظرفیت تکمیل است");
    }
  };
  const active =
    current && ["pending", "active", "waitlisted"].includes(current.status);
  const canEnroll =
    enrollments.isSuccess &&
    !getQueryFailure(enrollments.error, enrollments.fetchStatus) &&
    item.status === "active" &&
    (!current ||
      current.status === "cancelled" ||
      current.paymentStatus === "failed");

  return (
    <main className="app-page gap-5">
      <SecondaryHeader title="جزئیات کلاس" showFilter={false} />
      <nav aria-label="دسترسی سریع کلاس" className="flex flex-wrap gap-2">
        <Button
          variant="tertiary"
          size="sm"
          onPress={() =>
            document
              .getElementById("class-first-session")
              ?.scrollIntoView({ block: "start" })
          }
        >
          راهنمای جلسه اول
        </Button>
        <Button
          variant="tertiary"
          size="sm"
          onPress={() =>
            document
              .getElementById("class-training-group")
              ?.scrollIntoView({ block: "start" })
          }
        >
          هم‌تمرینی و دعوت دوست
        </Button>
      </nav>
      <DiscoveryQueryState query={enrollments} />
      <DiscoveryImageHero
        imageUrl="/profile/cover.jpg"
        title={item.title}
        eyebrow={item.sport || "کلاس ورزشی"}
        description={
          item.description || "توضیحات این کلاس توسط باشگاه تکمیل می‌شود."
        }
      />
      <section className="app-card rounded-3xl p-5">
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
          <FormSelect
            aria-label="انتخاب گزینه"
            className="mt-4 h-11 w-full rounded-xl border border-border bg-surface-secondary px-3 text-sm"
            value={checkInSessionId || item.sessions[0]?.id}
            onChange={(event) => setCheckInSessionId(event)}
          >
            {item.sessions.map((session) => (
              <FormOption entity={session} key={session.id} value={session.id}>
                {new Date(session.startsAt).toLocaleString("fa-IR", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </FormOption>
            ))}
          </FormSelect>
          <HeroInput
            dir="ltr"
            inputMode="numeric"
            value={checkInCredential}
            onChange={(event) =>
              setCheckInCredential(event.target.value.trim())
            }
            className="mt-3 h-12 w-full rounded-xl border border-border bg-surface-secondary px-4 text-center text-xl tracking-[.25em] outline-none focus:border-accent"
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

      <DetailFaqSection items={item.faqs} />

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
            isPending={createPayment.isPending}
            onPress={() => void startPayment(current.id)}
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
        {current?.status === "waitlisted" ? (
          <Button
            className="mt-2 w-full"
            variant="primary"
            isPending={claimWaitlist.isPending}
            isDisabled={
              !current.waitlistOfferExpiresAt ||
              now === null ||
              Date.parse(current.waitlistOfferExpiresAt) <= now
            }
            onPress={() => void claimCurrentWaitlist()}
          >
            دریافت جای خالی کلاس
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
          reference={{
            referenceType: "business_class_enrollment",
            referenceId: paymentEnrollmentId,
          }}
          amount={current?.agreedPrice ?? item.price}
          isPending={payment.isPending}
          onResult={(result, intent) => void resolve(result, intent)}
        />
      ) : null}
      <DetailSocialSection items={item.socialMedia} />
      <RelatedBusinessClasses excludeId={item.id} clubId={item.clubId} />
      <section
        className="space-y-3 rounded-3xl border border-border bg-surface p-5"
        id="class-first-session"
        aria-label="راهنمای جلسه اول"
      >
        <h2 className="text-lg font-bold">برای جلسه اول آماده‌ای؟</h2>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-muted">محل حضور</dt>
            <dd className="mt-1">
              {item.branch?.address ||
                "آدرس شعبه اعلام نشده؛ پیش از مراجعه از باشگاه بپرس."}
            </dd>
          </div>
          <div>
            <dt className="text-muted">سطح و شیوه کلاس</dt>
            <dd className="mt-1">
              {item.level || "سطح اعلام نشده"} · {modelLabel[item.model]}
            </dd>
          </div>
          <div>
            <dt className="text-muted">هزینه اعلام‌شده</dt>
            <dd className="mt-1">
              {item.price.toLocaleString("fa-IR")}{" "}
              {item.currency === "IRR" ? "ریال" : item.currency} ·{" "}
              {
                (
                  {
                    monthly: "ماهانه",
                    course: "کل دوره",
                    per_session: "هر جلسه",
                    package: "بسته",
                  } as const
                )[item.pricingModel]
              }
            </dd>
          </div>
        </dl>
        {!!item.prerequisites?.length && (
          <div>
            <h3 className="text-sm font-semibold">پیش‌نیازهای اعلام‌شده</h3>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted">
              {item.prerequisites.map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ul>
          </div>
        )}
        {!!item.requiredEquipment?.length && (
          <p className="text-sm leading-7">
            وسایل لازم: {item.requiredEquipment.map((e) => e.name).join("، ")}
          </p>
        )}
        {(item.coach?.verifiedCredentialsCount ?? 0) > 0 && (
          <p className="text-xs text-success">
            {item.coach!.verifiedCredentialsCount!.toLocaleString("fa-IR")} مدرک
            مربی در پلتفرم تأیید شده است.
          </p>
        )}
        <p className="text-xs leading-6 text-muted">
          توضیحات و پرسش‌های متداول کلاس را برای وسایل لازم، زمان حضور و شرایط
          لغو بخوان. ثبت‌نام دوستت مستقل است و اشتراک لینک، جا رزرو نمی‌کند.
        </p>
      </section>
      {current?.status === "waitlisted" && (
        <p className="text-sm leading-7 text-muted">
          {current.waitlistOfferExpiresAt &&
          now !== null &&
          Date.parse(current.waitlistOfferExpiresAt) > now
            ? `فرصت پذیرش جای خالی تا ${new Date(current.waitlistOfferExpiresAt).toLocaleTimeString("fa-IR", { timeZone: "Asia/Tehran", hour: "2-digit", minute: "2-digit" })}؛ ظرفیت هنگام تأیید دوباره بررسی می‌شود.`
            : "در لیست انتظار هستی؛ پس از اعلام جای خالی، فرصت پذیرش اینجا نمایش داده می‌شود."}
        </p>
      )}
      {current?.status === "waitlisted" &&
        current.waitlistOfferExpiresAt &&
        now !== null &&
        Date.parse(current.waitlistOfferExpiresAt) <= now && (
          <div className="space-y-2">
            <p className="text-xs text-muted">
              فرصت قبلی تمام شده است. برای پیشنهاد تازه، به انتهای صف برگرد.
            </p>
            <Button
              variant="secondary"
              isPending={renewWaitlist.isPending}
              onPress={async () => {
                try {
                  await renewWaitlist.mutateAsync(current.id);
                  toast.success("درخواست تازه در انتهای صف ثبت شد");
                } catch {
                  toast.danger("تمدید انتظار انجام نشد؛ دوباره تلاش کن");
                }
              }}
            >
              ادامه انتظار برای جای خالی
            </Button>
          </div>
        )}
      <ClassTrainingGroups
        key={classId}
        classId={classId}
        eligible={
          current?.status === "active" &&
          ["paid", "waived"].includes(current.paymentStatus)
        }
      />
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
