"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Chip, toast } from "@heroui/react";
import {
  useBusinessClubs,
  useCheckInClubReservation,
  useReceptionDesk,
  type ReceptionResult,
} from "@api/business";
import { asciiDigits } from "@repo/ui/iran-date";
import { Icon, type IconName } from "@theme/icon";

const field =
  "h-11 w-full rounded-[1rem] border border-border bg-surface-secondary px-3 text-sm text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted focus:border-focus focus:ring-3 focus:ring-focus/15";
const card = "app-card shadow-none active:scale-100";
const when = (value: string) =>
  new Date(value).toLocaleString("fa-IR", {
    timeZone: "Asia/Tehran",
    dateStyle: "medium",
    timeStyle: "short",
  });

const labels: Record<string, string> = {
  active: "فعال",
  scheduled: "شروع در آینده",
  paused: "متوقف",
  exhausted: "اعتبار تمام شده",
  expired: "منقضی",
  revoked: "لغو شده",
  reserved: "رزروشده",
  cancelled: "لغوشده",
  completed: "تمام‌شده",
  no_show: "عدم حضور",
  paid: "پرداخت‌شده",
  pending: "در انتظار",
  partial: "پرداخت بخشی",
  waived: "معاف",
  failed: "ناموفق",
  refunded: "مستردشده",
  not_required: "نیاز به پرداخت ندارد",
  waitlisted: "لیست انتظار",
};

function statusTone(status: string) {
  if (
    ["active", "reserved", "paid", "completed", "not_required"].includes(status)
  )
    return "success" as const;
  if (
    ["scheduled", "pending", "partial", "paused", "waitlisted"].includes(status)
  )
    return "warning" as const;
  if (["failed", "cancelled", "revoked", "no_show"].includes(status))
    return "danger" as const;
  return "default" as const;
}

function StatusChip({ status }: { status: string }) {
  return (
    <Chip color={statusTone(status)} size="sm" variant="soft">
      {labels[status] ?? status}
    </Chip>
  );
}

function SectionHeading({
  icon,
  title,
  description,
  action,
}: {
  icon: IconName;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-[1rem] bg-accent/15 text-accent">
          <Icon name={icon} size="lg" />
        </span>
        <div className="min-w-0">
          <h2 className="font-bold text-foreground">{title}</h2>
          <p className="mt-1 text-xs leading-6 text-muted">{description}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  helper,
}: {
  icon: IconName;
  label: string;
  value: number;
  helper: string;
}) {
  return (
    <div className="rounded-[1.25rem] border border-border/70 bg-surface-secondary/55 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-muted">{label}</span>
        <Icon name={icon} size="lg" className="text-muted" />
      </div>
      <p className="mt-5 text-2xl font-extrabold tabular-nums">
        {value.toLocaleString("fa-IR")}
      </p>
      <p className="mt-1 text-xs text-muted">{helper}</p>
    </div>
  );
}

function Skeleton({ label }: { label: string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3" aria-label={label} role="status">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="h-32 animate-pulse rounded-[1.25rem] bg-surface-secondary motion-reduce:animate-none"
        />
      ))}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: IconName;
  title: string;
  description: string;
}) {
  return (
    <div className="mt-5 rounded-[1.25rem] border border-dashed border-border p-6 text-center">
      <Icon name={icon} size={26} className="text-muted" />
      <p className="mt-2 text-sm font-bold">{title}</p>
      <p className="mt-1 text-xs leading-5 text-muted">{description}</p>
    </div>
  );
}

export function ReceptionDeskScreen() {
  const clubs = useBusinessClubs();
  const [picked, setPicked] = useState("");
  const router = useRouter();
  const clubId = picked || clubs.data?.items[0]?.id || "";

  return (
    <main className="min-w-0 flex-1 overflow-auto p-4 lg:p-6">
      <div className="mx-auto w-full max-w-7xl space-y-5">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted">عملیات ورودی</p>
            <h1 className="mt-1 text-2xl font-extrabold">ورود و پذیرش اعضا</h1>
            <p className="mt-1 text-sm leading-6 text-muted">
              عضو را پیدا کنید، اعتبار او را ببینید و ورود رزرو را همان‌جا ثبت
              کنید.
            </p>
          </div>
          <label className="grid gap-1.5 text-sm text-muted sm:w-72">
            باشگاه
            <select
              aria-label="باشگاه پذیرش"
              className={field}
              value={clubId}
              onChange={(event) => setPicked(event.target.value)}
            >
              {clubs.data?.items.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
            </select>
          </label>
        </header>

        {clubs.isError ? (
          <Card className={`${card} border-danger/25 bg-danger/5 p-5`}>
            <p role="alert" className="text-sm text-danger">
              فهرست باشگاه‌ها قابل دریافت نیست.
            </p>
            <Button
              className="mt-4"
              variant="secondary"
              onPress={() => void clubs.refetch()}
            >
              تلاش دوباره
            </Button>
          </Card>
        ) : clubId ? (
          <ReceptionDesk
            key={clubId}
            clubId={clubId}
            onOpenClass={(id) => router.push(`/clubs/${clubId}/classes/${id}`)}
          />
        ) : clubs.isPending ? (
          <Skeleton label="در حال دریافت باشگاه‌ها" />
        ) : (
          <Card className={`${card} p-6 text-center`}>
            <Icon name="building-1" size={30} className="text-muted" />
            <h2 className="mt-3 font-bold">باشگاهی برای پذیرش ندارید</h2>
            <p className="mt-1 text-sm text-muted">
              پس از ساخت باشگاه، ابزار پذیرش در این بخش فعال می‌شود.
            </p>
          </Card>
        )}
      </div>
    </main>
  );
}

export function ReceptionDesk({
  clubId,
  onOpenClass,
}: {
  clubId: string;
  onOpenClass?: (id: string) => void;
}) {
  const [draftPhone, setDraftPhone] = useState("");
  const [phone, setPhone] = useState("");
  const result = useReceptionDesk(clubId, phone);

  const search = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = asciiDigits(draftPhone).trim();
    if (value === phone) void result.refetch();
    else setPhone(value);
  };

  const data = result.data?.found ? result.data : null;
  const activeMemberships =
    data?.memberships.filter((item) => item.status === "active").length ?? 0;
  const openReservations =
    data?.reservations.filter(
      (item) =>
        ["reserved", "completed"].includes(item.status) &&
        ["paid", "not_required"].includes(item.paymentStatus),
    ).length ?? 0;
  const activeEnrollments =
    data?.enrollments.filter((item) => item.status === "active").length ?? 0;

  return (
    <section className="space-y-5" aria-label="جست‌وجو و پذیرش ورزشکار">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)]">
        <Card className={`${card} overflow-hidden`}>
          <div className="border-b border-border/70 bg-accent/8 p-5 sm:p-6">
            <SectionHeading
              icon="scan-1"
              title="پذیرش سریع"
              description="ورود عضو با شماره موبایل ثبت‌شده در باشگاه"
            />
          </div>
          <form onSubmit={search} className="space-y-4 p-5 sm:p-6">
            <label className="grid gap-2 text-sm font-medium">
              موبایل ورزشکار
              <input
                required
                value={draftPhone}
                onChange={(event) => setDraftPhone(event.target.value)}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                minLength={10}
                maxLength={13}
                className={field}
                placeholder="۰۹۱۲۱۲۳۴۵۶۷"
                aria-describedby="reception-phone-help"
                dir="ltr"
              />
            </label>
            <p
              id="reception-phone-help"
              className="text-xs leading-6 text-muted"
            >
              شماره فارسی یا انگلیسی پذیرفته می‌شود. نتیجه شامل عضویت، رزرو و
              وضعیت شهریه است.
            </p>
            <Button
              type="submit"
              fullWidth
              variant="primary"
              isPending={result.isFetching}
            >
              <Icon name="user-check" size="lg" />
              جست‌وجوی پذیرش
            </Button>
          </form>
        </Card>

        <div className="min-w-0 space-y-4">
          {!phone ? (
            <Card className={`${card} h-full p-5 sm:p-6`}>
              <SectionHeading
                icon="qr-code"
                title="میز آماده پذیرش است"
                description="شماره عضو را وارد کنید تا وضعیت ورود و اعتبار در یک نما باز شود."
              />
              <ol className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  [
                    "telephone-1",
                    "عضو را پیدا کنید",
                    "جست‌وجو با شماره موبایل",
                  ],
                  ["ticket", "اعتبار را ببینید", "عضویت و مانده جلسه"],
                  ["check-circle", "ورود را ثبت کنید", "همراه با سابقه اصلاح"],
                ].map(([icon, title, description]) => (
                  <li
                    key={title}
                    className="rounded-[1.25rem] bg-surface-secondary/60 p-4"
                  >
                    <Icon
                      name={icon as IconName}
                      size="lg"
                      className="text-accent"
                    />
                    <p className="mt-4 text-sm font-bold">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-muted">
                      {description}
                    </p>
                  </li>
                ))}
              </ol>
            </Card>
          ) : result.isError ? (
            <Card
              className={`${card} grid min-h-64 place-items-center p-6 text-center`}
            >
              <div>
                <Icon name="info-circle" size={30} className="text-danger" />
                <h2 className="mt-3 font-bold">جست‌وجو انجام نشد</h2>
                <p role="alert" className="mt-1 text-sm text-muted">
                  شماره و دسترسی این باشگاه را بررسی کنید.
                </p>
                <Button
                  className="mt-4"
                  variant="secondary"
                  onPress={() => void result.refetch()}
                >
                  تلاش دوباره
                </Button>
              </div>
            </Card>
          ) : result.isPending ? (
            <Skeleton label="در حال دریافت اطلاعات پذیرش" />
          ) : !result.data?.found ? (
            <Card
              className={`${card} grid min-h-64 place-items-center p-6 text-center`}
            >
              <div>
                <Icon name="user-x" size={30} className="text-muted" />
                <h2 className="mt-3 font-bold">عضو پیدا نشد</h2>
                <p className="mt-1 text-sm leading-6 text-muted">
                  سابقه‌ای برای این شماره در باشگاه انتخاب‌شده وجود ندارد.
                </p>
              </div>
            </Card>
          ) : (
            <>
              <Card className={`${card} p-5`}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-12 shrink-0 place-items-center rounded-[1rem] bg-accent text-accent-foreground">
                      <Icon name="user" size="xl" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs text-muted">پرونده پیدا شد</p>
                      <h2 className="truncate text-lg font-extrabold">
                        {result.data.person?.name}
                      </h2>
                      <p
                        className="mt-1 text-sm tabular-nums text-muted"
                        dir="ltr"
                      >
                        {result.data.person?.phone}
                      </p>
                    </div>
                  </div>
                  <Chip color="success" size="sm" variant="soft">
                    آماده بررسی
                  </Chip>
                </div>
                {result.data.accountMismatch ? (
                  <p
                    role="alert"
                    className="mt-4 rounded-[1rem] border border-warning/25 bg-warning/10 p-3 text-sm leading-6 text-warning"
                  >
                    شماره پرونده و حساب به تطبیق مالک نیاز دارد. قرارداد حساب
                    نمایش داده نمی‌شود.
                  </p>
                ) : null}
              </Card>
              <div className="grid gap-3 sm:grid-cols-3">
                <Metric
                  icon="ticket"
                  label="عضویت فعال"
                  value={activeMemberships}
                  helper="قرارداد قابل استفاده"
                />
                <Metric
                  icon="calendar-check"
                  label="رزرو قابل ورود"
                  value={openReservations}
                  helper="رزرو تاییدشده"
                />
                <Metric
                  icon="users-two"
                  label="کلاس فعال"
                  value={activeEnrollments}
                  helper="ثبت‌نام جاری"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {data ? (
        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.18fr)_minmax(22rem,0.82fr)]">
          <Card className={`${card} min-w-0 p-5 sm:p-6`}>
            <SectionHeading
              icon="calendar-check"
              title="رزرو و ثبت ورود"
              description="ورود از ۳۰ دقیقه پیش از شروع تا پایان سانس قابل ثبت است."
              action={
                <Chip size="sm" variant="soft">
                  {data.reservations.length.toLocaleString("fa-IR")} رزرو
                </Chip>
              }
            />
            {data.reservations.length ? (
              <div className="mt-5 space-y-3">
                {data.reservations.map((item) => (
                  <ReservationCheckIn
                    key={`${item.id}-${item.checkedInParticipants}`}
                    clubId={clubId}
                    item={item}
                    refresh={() => void result.refetch()}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon="calendar-slash-1"
                title="رزروی ثبت نشده است"
                description="رزروهای این عضو پس از ثبت، اینجا نمایش داده می‌شوند."
              />
            )}
          </Card>

          <div className="min-w-0 space-y-5">
            <Memberships items={data.memberships} />
            <Enrollments
              items={data.enrollments}
              unallocatedReceiptCount={data.unallocatedReceiptCount}
              onOpenClass={onOpenClass}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Memberships({ items }: { items: ReceptionResult["memberships"] }) {
  return (
    <Card className={`${card} p-5`}>
      <SectionHeading
        icon="ticket"
        title="عضویت و مانده اعتبار"
        description="وضعیت قراردادهای خریداری‌شده عضو"
      />
      {items.length ? (
        <div className="mt-4 space-y-1">
          {items.map((item) => (
            <article
              key={item.id}
              className="border-b border-border/70 py-4 last:border-b-0"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-bold">{item.title}</h3>
                <StatusChip status={item.status} />
              </div>
              <p className="mt-3 text-sm font-medium">
                {item.remainingSessions === null
                  ? `مانده هفته: ${(item.weeklyRemaining ?? 0).toLocaleString("fa-IR")} جلسه`
                  : `مانده بسته: ${item.remainingSessions.toLocaleString("fa-IR")} جلسه`}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted">
                از {when(item.startsAt)} تا {when(item.endsAt)}
              </p>
              {item.pauseUntil && item.status === "paused" ? (
                <p className="mt-1 text-xs text-warning">
                  توقف تا {when(item.pauseUntil)}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="ticket"
          title="عضویتی ثبت نشده است"
          description="برای این عضو قرارداد خریداری‌شده‌ای وجود ندارد."
        />
      )}
    </Card>
  );
}

function Enrollments({
  items,
  unallocatedReceiptCount,
  onOpenClass,
}: {
  items: ReceptionResult["enrollments"];
  unallocatedReceiptCount: number;
  onOpenClass?: (id: string) => void;
}) {
  return (
    <Card className={`${card} p-5`}>
      <SectionHeading
        icon="wallet"
        title="کلاس و وضعیت شهریه"
        description="ثبت‌نام‌ها و مانده حساب کلاس"
      />
      {unallocatedReceiptCount > 0 ? (
        <p className="mt-4 rounded-[1rem] border border-warning/25 bg-warning/10 p-3 text-sm leading-6 text-warning">
          رسید دستی بدون اتصال به قرارداد وجود دارد. مانده شهریه باید توسط مالی
          تطبیق داده شود.
        </p>
      ) : null}
      {items.length ? (
        <div className="mt-4 space-y-1">
          {items.map((item) => (
            <article
              key={item.id}
              className="border-b border-border/70 py-4 last:border-b-0"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-bold">{item.title}</h3>
                <StatusChip status={item.status} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusChip status={item.paymentStatus} />
                <span className="text-sm text-muted">
                  مانده شهریه:{" "}
                  {item.outstandingAmount === null
                    ? "نیازمند تطبیق مالی"
                    : `${item.outstandingAmount.toLocaleString("fa-IR")} ${item.currency === "IRR" ? "ریال" : item.currency}`}
                </span>
              </div>
              {onOpenClass ? (
                <Button
                  className="mt-4"
                  size="sm"
                  variant="secondary"
                  onPress={() => onOpenClass(item.classId)}
                >
                  حضور کلاس
                </Button>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="users-two"
          title="کلاس فعالی وجود ندارد"
          description="ثبت‌نام‌های کلاس این عضو اینجا نمایش داده می‌شوند."
        />
      )}
    </Card>
  );
}

function ReservationCheckIn({
  clubId,
  item,
  refresh,
}: {
  clubId: string;
  item: ReceptionResult["reservations"][number];
  refresh: () => void;
}) {
  const update = useCheckInClubReservation(clubId);
  const [count, setCount] = useState(
    String(item.checkedInParticipants || item.participantCount),
  );
  const [reason, setReason] = useState("");
  const normalizedCount = Number(asciiDigits(count));
  const isCountValid =
    Number.isInteger(normalizedCount) &&
    normalizedCount >= 0 &&
    normalizedCount <= item.participantCount;
  const correctionNeedsReason =
    isCountValid && normalizedCount < item.checkedInParticipants;
  const eligible =
    ["reserved", "completed"].includes(item.status) &&
    ["paid", "not_required"].includes(item.paymentStatus);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await update.mutateAsync({
        reservationId: item.id,
        participantCount: normalizedCount,
        expectedParticipantCount: item.checkedInParticipants,
        reason,
      });
      toast.success("ورود به‌روز شد");
      refresh();
    } catch {
      toast.danger(
        "ورود ثبت نشد. ظرفیت، زمان، دلیل اصلاح و آخرین وضعیت را بررسی کنید.",
      );
      refresh();
    }
  };

  return (
    <article className="rounded-[1.25rem] border border-border/70 bg-surface-secondary/45 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-extrabold">{item.title}</h3>
          <p className="mt-1 text-xs leading-5 text-muted">
            {when(item.startsAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusChip status={item.status} />
          <StatusChip status={item.paymentStatus} />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-[1rem] bg-surface p-3">
          <p className="text-sm font-extrabold tabular-nums">
            ورود ثبت‌شده: {item.checkedInParticipants.toLocaleString("fa-IR")}{" "}
            از {item.participantCount.toLocaleString("fa-IR")} نفر
          </p>
        </div>
        <div className="rounded-[1rem] bg-surface p-3">
          <p className="text-xs text-muted">شروع پذیرش</p>
          <p className="mt-1 text-sm font-bold">{when(item.checkInOpensAt)}</p>
        </div>
      </div>
      {eligible ? (
        <form
          onSubmit={submit}
          className="mt-4 grid gap-3 sm:grid-cols-[8rem_minmax(0,1fr)_auto]"
        >
          <label className="grid gap-1.5 text-sm">
            تعداد حاضر
            <input
              required
              inputMode="numeric"
              min={0}
              max={item.participantCount}
              className={field}
              value={count}
              aria-invalid={!isCountValid}
              onChange={(event) => setCount(event.target.value)}
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            دلیل اصلاح
            <input
              className={field}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="برای کاهش تعداد، دلیل لازم است"
              maxLength={200}
              minLength={correctionNeedsReason ? 5 : undefined}
              required={correctionNeedsReason}
            />
          </label>
          <Button
            type="submit"
            className="self-end whitespace-nowrap"
            variant="primary"
            isPending={update.isPending}
            isDisabled={
              !isCountValid ||
              (correctionNeedsReason && reason.trim().length < 5)
            }
          >
            <Icon name="check" size="lg" />
            ثبت ورود
          </Button>
        </form>
      ) : (
        <p className="mt-4 rounded-[1rem] bg-surface p-3 text-sm text-muted">
          این رزرو در وضعیت فعلی امکان ثبت ورود ندارد.
        </p>
      )}
      {item.changes.length ? (
        <details className="mt-4 text-xs text-muted">
          <summary className="cursor-pointer py-2 font-medium text-foreground">
            سابقه ورود
          </summary>
          <ol className="space-y-2 border-r border-border pr-3">
            {item.changes.map((change, index) => (
              <li key={`${change.at}-${index}`} className="leading-6">
                {when(change.at)} <span className="mx-2 text-border">|</span>
                {change.before.toLocaleString("fa-IR")} به{" "}
                {change.after.toLocaleString("fa-IR")} نفر
                <span className="mx-2 text-border">|</span>{" "}
                {change.reason || "ثبت ورود"}
              </li>
            ))}
          </ol>
        </details>
      ) : null}
    </article>
  );
}
