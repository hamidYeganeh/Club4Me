"use client";

import {
  useBusinessClubs,
  useClubAttendance,
  useClubBranches,
  useClubCoachProfiles,
  useClubPayments,
  useClubStudents,
  useCreateClubBranch,
  useCreateClubCoach,
  useCreateClubPayment,
  useCreateClubStudent,
  useUpdateClubBranch,
  useUpdateClubCoach,
  useUpdateClubStudent,
  useUpsertClubAttendance,
  type BusinessClub,
  type ClubStudent,
} from "@api/business";
import { usePayoutBalance, usePayouts, useRequestPayout } from "@api";
import { Button, Card, Chip, Spinner, toast } from "@heroui/react";
import { Icon } from "@theme/icon";
import { FormEvent, ReactNode, useMemo, useState } from "react";

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm outline-none transition focus:border-accent";
const textareaClass = `${inputClass} h-24 py-3`;
const today = () => new Date().toISOString().slice(0, 10);
const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(
        new Date(value),
      )
    : "ثبت نشده";
const formatMoney = (value: number) =>
  new Intl.NumberFormat("fa-IR").format(value);

function useSelectedClub() {
  const clubs = useBusinessClubs();
  const [selectedClubId, setClubId] = useState("");
  const clubId = selectedClubId || clubs.data?.items[0]?.id || "";
  return { clubs, clubId, setClubId };
}

function Page({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="min-w-0 flex-1 overflow-auto p-4 lg:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="mt-1 text-sm text-muted">{description}</p>
          </div>
          {action}
        </div>
        {children}
      </div>
    </main>
  );
}

function ClubSelect({
  clubs,
  value,
  onChange,
}: {
  clubs: BusinessClub[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-xs text-muted">
      باشگاه
      <select
        className={`${inputClass} min-w-52 text-foreground`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {clubs.map((club) => (
          <option key={club.id} value={club.id}>
            {club.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function Empty({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="grid min-h-56 place-items-center rounded-2xl border border-dashed border-border p-8 text-center">
      <div>
        <Icon name="folder-open" size={30} className="text-muted" />
        <h2 className="mt-3 font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted">{hint}</p>
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex justify-center py-20">
      <Spinner />
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="text-muted">{label}</span>
      {children}
    </label>
  );
}

function StatusChip({ active }: { active: boolean }) {
  return (
    <Chip color={active ? "success" : "default"} size="sm" variant="soft">
      {active ? "فعال" : "غیرفعال"}
    </Chip>
  );
}

export function StudentsScreen() {
  const { clubs, clubId, setClubId } = useSelectedClub();
  const students = useClubStudents(clubId);
  const create = useCreateClubStudent(clubId);
  const update = useUpdateClubStudent(clubId);
  const [open, setOpen] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await create.mutateAsync({
        firstName: String(data.get("firstName")),
        lastName: String(data.get("lastName")),
        phone: String(data.get("phone")),
        sport: String(data.get("sport")),
        membershipTitle: String(data.get("membershipTitle")),
        membershipEndsAt: data.get("membershipEndsAt")
          ? new Date(String(data.get("membershipEndsAt"))).toISOString()
          : null,
        status: "active",
        notes: String(data.get("notes")),
      });
      event.currentTarget.reset();
      setOpen(false);
      toast.success("شاگرد با موفقیت اضافه شد");
    } catch {
      toast.danger("ثبت شاگرد انجام نشد؛ شماره تماس را بررسی کنید");
    }
  };
  return (
    <Page
      title="شاگردها"
      description="پرونده شاگردها، رشته و وضعیت عضویت را مدیریت کنید"
      action={
        <div className="flex items-end gap-2">
          <ClubSelect
            clubs={clubs.data?.items ?? []}
            value={clubId}
            onChange={setClubId}
          />
          <Button variant="primary" onPress={() => setOpen((value) => !value)}>
            <Icon name="plus" />
            افزودن شاگرد
          </Button>
        </div>
      }
    >
      {open && (
        <Card className="mt-5 rounded-2xl border border-border bg-surface p-5">
          <form
            onSubmit={submit}
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            <Field label="نام">
              <input
                required
                minLength={2}
                name="firstName"
                className={inputClass}
              />
            </Field>
            <Field label="نام خانوادگی">
              <input
                required
                minLength={2}
                name="lastName"
                className={inputClass}
              />
            </Field>
            <Field label="شماره تماس">
              <input
                required
                name="phone"
                inputMode="tel"
                className={inputClass}
              />
            </Field>
            <Field label="رشته ورزشی">
              <input name="sport" className={inputClass} />
            </Field>
            <Field label="عنوان عضویت">
              <input
                name="membershipTitle"
                placeholder="مثلاً بدنسازی ماهانه"
                className={inputClass}
              />
            </Field>
            <Field label="پایان عضویت">
              <input
                name="membershipEndsAt"
                type="date"
                className={inputClass}
              />
            </Field>
            <div className="md:col-span-2 lg:col-span-3">
              <Field label="یادداشت">
                <textarea name="notes" className={textareaClass} />
              </Field>
            </div>
            <div className="flex gap-2 md:col-span-2 lg:col-span-3">
              <Button
                type="submit"
                variant="primary"
                isPending={create.isPending}
              >
                ثبت شاگرد
              </Button>
              <Button
                type="button"
                variant="ghost"
                onPress={() => setOpen(false)}
              >
                انصراف
              </Button>
            </div>
          </form>
        </Card>
      )}
      <div className="mt-5">
        {students.isPending ? (
          <Loading />
        ) : (students.data?.items.length ?? 0) === 0 ? (
          <Empty
            title="هنوز شاگردی ثبت نشده"
            hint="با دکمه افزودن شاگرد، اولین پرونده را بسازید"
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
            <table className="w-full min-w-200 text-right text-sm">
              <thead className="bg-default/40 text-muted">
                <tr>
                  <th className="p-4">شاگرد</th>
                  <th className="p-4">تماس</th>
                  <th className="p-4">رشته</th>
                  <th className="p-4">عضویت</th>
                  <th className="p-4">وضعیت</th>
                  <th className="p-4">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {students.data?.items.map((student) => (
                  <tr key={student.id}>
                    <td className="p-4 font-medium">
                      {student.firstName} {student.lastName}
                    </td>
                    <td className="p-4 tabular-nums">{student.phone}</td>
                    <td className="p-4">{student.sport || "-"}</td>
                    <td className="p-4">
                      <div>{student.membershipTitle || "-"}</div>
                      <span className="text-xs text-muted">
                        تا {formatDate(student.membershipEndsAt)}
                      </span>
                    </td>
                    <td className="p-4">
                      <StatusChip active={student.status === "active"} />
                    </td>
                    <td className="p-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        isPending={update.isPending}
                        onPress={() =>
                          update
                            .mutateAsync({
                              id: student.id,
                              payload: {
                                status:
                                  student.status === "active"
                                    ? "inactive"
                                    : "active",
                              },
                            })
                            .then(() => toast.success("وضعیت شاگرد تغییر کرد"))
                            .catch(() => toast.danger("تغییر وضعیت انجام نشد"))
                        }
                      >
                        {student.status === "active"
                          ? "غیرفعال کردن"
                          : "فعال کردن"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Page>
  );
}

export function CoachesScreen() {
  const { clubs, clubId, setClubId } = useSelectedClub();
  const coaches = useClubCoachProfiles(clubId);
  const create = useCreateClubCoach(clubId);
  const update = useUpdateClubCoach(clubId);
  const [open, setOpen] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await create.mutateAsync({
        firstName: String(data.get("firstName")),
        lastName: String(data.get("lastName")),
        phone: String(data.get("phone")),
        specialties: String(data.get("specialties"))
          .split(/[،,]/)
          .map((v) => v.trim())
          .filter(Boolean),
        employmentType: String(data.get("employmentType")),
        status: "active",
        notes: String(data.get("notes")),
      });
      event.currentTarget.reset();
      setOpen(false);
      toast.success("مربی اضافه شد");
    } catch {
      toast.danger("ثبت مربی انجام نشد");
    }
  };
  return (
    <Page
      title="مربی‌ها"
      description="فهرست مربی‌های هر باشگاه و تخصص آن‌ها"
      action={
        <div className="flex items-end gap-2">
          <ClubSelect
            clubs={clubs.data?.items ?? []}
            value={clubId}
            onChange={setClubId}
          />
          <Button variant="primary" onPress={() => setOpen((v) => !v)}>
            <Icon name="plus" />
            افزودن مربی
          </Button>
        </div>
      }
    >
      {open && (
        <Card className="mt-5 rounded-2xl border border-border bg-surface p-5">
          <form
            onSubmit={submit}
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            <Field label="نام">
              <input
                required
                name="firstName"
                minLength={2}
                className={inputClass}
              />
            </Field>
            <Field label="نام خانوادگی">
              <input
                required
                name="lastName"
                minLength={2}
                className={inputClass}
              />
            </Field>
            <Field label="شماره تماس">
              <input required name="phone" className={inputClass} />
            </Field>
            <Field label="تخصص‌ها">
              <input
                name="specialties"
                placeholder="بدنسازی، تی‌آر‌ایکس"
                className={inputClass}
              />
            </Field>
            <Field label="نوع همکاری">
              <input
                name="employmentType"
                placeholder="تمام‌وقت، درصدی و ..."
                className={inputClass}
              />
            </Field>
            <Field label="یادداشت">
              <input name="notes" className={inputClass} />
            </Field>
            <div className="flex gap-2 md:col-span-2 lg:col-span-3">
              <Button
                type="submit"
                variant="primary"
                isPending={create.isPending}
              >
                ثبت مربی
              </Button>
              <Button
                type="button"
                variant="ghost"
                onPress={() => setOpen(false)}
              >
                انصراف
              </Button>
            </div>
          </form>
        </Card>
      )}
      <div className="mt-5">
        {coaches.isPending ? (
          <Loading />
        ) : (coaches.data?.items.length ?? 0) === 0 ? (
          <Empty
            title="مربی‌ای ثبت نشده"
            hint="اطلاعات اولین مربی را ثبت کنید"
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {coaches.data?.items.map((coach) => (
              <Card
                key={coach.id}
                className="rounded-2xl border border-border bg-surface p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="grid size-11 place-items-center rounded-xl bg-accent/10 text-accent">
                    <Icon name="user" size={22} />
                  </div>
                  <StatusChip active={coach.status === "active"} />
                </div>
                <h2 className="mt-4 font-semibold">
                  {coach.firstName} {coach.lastName}
                </h2>
                <p className="mt-1 text-sm text-muted">{coach.phone}</p>
                <div className="mt-3 flex min-h-7 flex-wrap gap-1">
                  {coach.specialties.map((item) => (
                    <Chip key={item} size="sm" variant="soft">
                      {item}
                    </Chip>
                  ))}
                </div>
                <p className="mt-3 text-sm">
                  {coach.employmentType || "نوع همکاری ثبت نشده"}
                </p>
                <Button
                  className="mt-4"
                  size="sm"
                  variant="ghost"
                  isPending={update.isPending}
                  onPress={() =>
                    update.mutateAsync({
                      id: coach.id,
                      payload: {
                        status:
                          coach.status === "active" ? "inactive" : "active",
                      },
                    })
                  }
                >
                  {coach.status === "active" ? "پایان همکاری" : "شروع همکاری"}
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Page>
  );
}

export function PaymentsScreen() {
  const { clubs, clubId, setClubId } = useSelectedClub();
  const students = useClubStudents(clubId);
  const payments = useClubPayments(clubId);
  const create = useCreateClubPayment(clubId);
  const payoutBalance = usePayoutBalance("club", clubId);
  const payouts = usePayouts();
  const requestPayout = useRequestPayout();
  const [open, setOpen] = useState(false);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const studentMap = useMemo(
    () =>
      new Map(
        (students.data?.items ?? []).map((item) => [
          item.id,
          `${item.firstName} ${item.lastName}`,
        ]),
      ),
    [students.data?.items],
  );
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await create.mutateAsync({
        studentId: String(data.get("studentId")),
        type: String(data.get("type")) as "tuition" | "session" | "other",
        title: String(data.get("title")),
        amount: Number(data.get("amount")),
        currency: "IRR",
        paidAt: new Date(String(data.get("paidAt"))).toISOString(),
        method: String(data.get("method")) as
          "cash" | "card" | "transfer" | "other",
        notes: String(data.get("notes")),
      });
      event.currentTarget.reset();
      setOpen(false);
      toast.success("پرداخت ثبت شد");
    } catch {
      toast.danger("ثبت پرداخت انجام نشد");
    }
  };
  const submitPayout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await requestPayout.mutateAsync({
        providerType: "club",
        providerId: clubId,
        amount: Number(data.get("amount")),
        iban: String(data.get("iban")).replaceAll(" ", "").toUpperCase(),
      });
      event.currentTarget.reset();
      setPayoutOpen(false);
      toast.success("درخواست تسویه ثبت شد");
    } catch {
      toast.danger("ثبت درخواست تسویه انجام نشد");
    }
  };
  return (
    <Page
      title="پرداخت‌ها"
      description="شهریه، هزینه سانس و سایر دریافت‌های حضوری را ثبت کنید"
      action={
        <div className="flex items-end gap-2">
          <ClubSelect
            clubs={clubs.data?.items ?? []}
            value={clubId}
            onChange={setClubId}
          />
          <Button
            variant="primary"
            isDisabled={!students.data?.items.length}
            onPress={() => setOpen((v) => !v)}
          >
            <Icon name="plus" />
            ثبت پرداخت
          </Button>
        </div>
      }
    >
      <section className="mt-5 grid gap-4 lg:grid-cols-[1fr_2fr]">
        <Card className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-sm text-muted">موجودی قابل برداشت</p>
          <p className="mt-2 text-2xl font-bold tabular-nums">
            {formatMoney(payoutBalance.data?.availableAmount ?? 0)} ریال
          </p>
          <p className="mt-1 text-xs text-muted">
            در انتظار تسویه:{" "}
            {formatMoney(payoutBalance.data?.reservedAmount ?? 0)} ریال
          </p>
          <Button
            className="mt-4"
            variant="primary"
            isDisabled={(payoutBalance.data?.availableAmount ?? 0) <= 0}
            onPress={() => setPayoutOpen((value) => !value)}
          >
            درخواست برداشت
          </Button>
        </Card>
        <Card className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="font-semibold">آخرین تسویه‌ها</h2>
          <div className="mt-3 space-y-2 text-sm">
            {(payouts.data?.items ?? []).slice(0, 4).map((payout) => (
              <div
                key={payout.id}
                className="flex items-center justify-between gap-3"
              >
                <span>{formatMoney(payout.amount)} ریال</span>
                <Chip
                  color={
                    payout.status === "paid"
                      ? "success"
                      : payout.status === "rejected"
                        ? "danger"
                        : "warning"
                  }
                  size="sm"
                >
                  {
                    {
                      requested: "در انتظار",
                      paid: "پرداخت‌شده",
                      rejected: "ردشده",
                      cancelled: "لغوشده",
                    }[payout.status]
                  }
                </Chip>
              </div>
            ))}
            {!payouts.data?.items.length ? (
              <p className="text-muted">هنوز تسویه‌ای ثبت نشده است.</p>
            ) : null}
          </div>
        </Card>
      </section>
      {payoutOpen ? (
        <Card className="mt-4 rounded-2xl border border-border bg-surface p-5">
          <form onSubmit={submitPayout} className="grid gap-4 md:grid-cols-2">
            <Field label="مبلغ برداشت (ریال)">
              <input
                required
                name="amount"
                type="number"
                min="1"
                max={payoutBalance.data?.availableAmount ?? 0}
                className={inputClass}
              />
            </Field>
            <Field label="شماره شبا">
              <input
                required
                name="iban"
                dir="ltr"
                placeholder="IR000000000000000000000000"
                className={inputClass}
              />
            </Field>
            <Button
              type="submit"
              variant="primary"
              isPending={requestPayout.isPending}
            >
              ثبت درخواست
            </Button>
          </form>
        </Card>
      ) : null}
      {open && (
        <Card className="mt-5 rounded-2xl border border-border bg-surface p-5">
          <form
            onSubmit={submit}
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            <Field label="شاگرد">
              <select required name="studentId" className={inputClass}>
                <option value="">انتخاب کنید</option>
                {students.data?.items.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.firstName} {student.lastName}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="نوع پرداخت">
              <select name="type" className={inputClass}>
                <option value="tuition">شهریه</option>
                <option value="session">هزینه سانس</option>
                <option value="other">سایر</option>
              </select>
            </Field>
            <Field label="عنوان">
              <input
                required
                name="title"
                placeholder="شهریه شهریور"
                className={inputClass}
              />
            </Field>
            <Field label="مبلغ (ریال)">
              <input
                required
                min="0"
                name="amount"
                type="number"
                className={inputClass}
              />
            </Field>
            <Field label="تاریخ پرداخت">
              <input
                required
                defaultValue={today()}
                name="paidAt"
                type="date"
                className={inputClass}
              />
            </Field>
            <Field label="روش پرداخت">
              <select name="method" className={inputClass}>
                <option value="card">کارتخوان</option>
                <option value="cash">نقدی</option>
                <option value="transfer">کارت‌به‌کارت</option>
                <option value="other">سایر</option>
              </select>
            </Field>
            <div className="md:col-span-2 lg:col-span-3">
              <Field label="یادداشت">
                <textarea name="notes" className={textareaClass} />
              </Field>
            </div>
            <div className="flex gap-2 md:col-span-2 lg:col-span-3">
              <Button
                type="submit"
                variant="primary"
                isPending={create.isPending}
              >
                تأیید پرداخت‌شده
              </Button>
              <Button
                type="button"
                variant="ghost"
                onPress={() => setOpen(false)}
              >
                انصراف
              </Button>
            </div>
          </form>
        </Card>
      )}
      <div className="mt-5">
        {payments.isPending ? (
          <Loading />
        ) : (payments.data?.items.length ?? 0) === 0 ? (
          <Empty
            title="پرداختی ثبت نشده"
            hint="پس از دریافت وجه، آن را به‌عنوان پرداخت‌شده ثبت کنید"
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
            <table className="w-full min-w-180 text-right text-sm">
              <thead className="bg-default/40 text-muted">
                <tr>
                  <th className="p-4">شاگرد</th>
                  <th className="p-4">عنوان</th>
                  <th className="p-4">نوع</th>
                  <th className="p-4">مبلغ</th>
                  <th className="p-4">تاریخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.data?.items.map((payment) => (
                  <tr key={payment.id}>
                    <td className="p-4 font-medium">
                      {studentMap.get(payment.studentId) ?? "شاگرد حذف‌شده"}
                    </td>
                    <td className="p-4">{payment.title}</td>
                    <td className="p-4">
                      {
                        { tuition: "شهریه", session: "سانس", other: "سایر" }[
                          payment.type
                        ]
                      }
                    </td>
                    <td className="p-4 font-semibold tabular-nums">
                      {formatMoney(payment.amount)} ریال
                    </td>
                    <td className="p-4">{formatDate(payment.paidAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Page>
  );
}

export function AttendanceScreen() {
  const { clubs, clubId, setClubId } = useSelectedClub();
  const [date, setDate] = useState(today());
  const students = useClubStudents(clubId);
  const records = useClubAttendance(clubId, date);
  const upsert = useUpsertClubAttendance(clubId);
  const [sessionTitle, setSessionTitle] = useState("تمرین عمومی");
  const recordMap = useMemo(
    () =>
      new Map(
        (records.data?.items ?? [])
          .filter((item) => item.sessionTitle === sessionTitle)
          .map((item) => [item.studentId, item.status]),
      ),
    [records.data?.items, sessionTitle],
  );
  const mark = (
    student: ClubStudent,
    status: "present" | "absent" | "excused",
  ) =>
    upsert
      .mutateAsync({
        studentId: student.id,
        date: new Date(`${date}T12:00:00.000Z`).toISOString(),
        sessionTitle,
        status,
        notes: "",
      })
      .then(() => toast.success(`حضور ${student.firstName} ثبت شد`))
      .catch(() => toast.danger("ثبت حضور انجام نشد"));
  return (
    <Page
      title="حضور و غیاب"
      description="وضعیت حضور شاگردها را برای هر روز و سانس کنترل کنید"
      action={
        <ClubSelect
          clubs={clubs.data?.items ?? []}
          value={clubId}
          onChange={setClubId}
        />
      }
    >
      <Card className="mt-5 rounded-2xl border border-border bg-surface p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="تاریخ">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="عنوان سانس">
            <input
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </Card>
      <div className="mt-5">
        {students.isPending || records.isPending ? (
          <Loading />
        ) : (students.data?.items.length ?? 0) === 0 ? (
          <Empty
            title="شاگرد فعالی وجود ندارد"
            hint="ابتدا از بخش شاگردها پرونده بسازید"
          />
        ) : (
          <div className="grid gap-3">
            {students.data?.items
              .filter((student) => student.status === "active")
              .map((student) => {
                const current = recordMap.get(student.id);
                return (
                  <Card
                    key={student.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4"
                  >
                    <div>
                      <h2 className="font-medium">
                        {student.firstName} {student.lastName}
                      </h2>
                      <p className="text-sm text-muted">
                        {student.sport ||
                          student.membershipTitle ||
                          student.phone}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={current === "present" ? "primary" : "ghost"}
                        onPress={() => mark(student, "present")}
                      >
                        حاضر
                      </Button>
                      <Button
                        size="sm"
                        variant={current === "absent" ? "danger" : "ghost"}
                        onPress={() => mark(student, "absent")}
                      >
                        غایب
                      </Button>
                      <Button
                        size="sm"
                        variant={current === "excused" ? "secondary" : "ghost"}
                        onPress={() => mark(student, "excused")}
                      >
                        موجه
                      </Button>
                    </div>
                  </Card>
                );
              })}
          </div>
        )}
      </div>
    </Page>
  );
}

export function BranchesScreen() {
  const { clubs, clubId, setClubId } = useSelectedClub();
  const branches = useClubBranches(clubId);
  const create = useCreateClubBranch(clubId);
  const update = useUpdateClubBranch(clubId);
  const [open, setOpen] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await create.mutateAsync({
        name: String(data.get("name")),
        address: String(data.get("address")),
        phone: String(data.get("phone")),
        timezone: "Asia/Tehran",
        status: "active",
      });
      event.currentTarget.reset();
      setOpen(false);
      toast.success("شعبه ساخته شد");
    } catch {
      toast.danger("ساخت شعبه انجام نشد؛ نام شعبه باید یکتا باشد");
    }
  };
  return (
    <Page
      title="شعبه‌ها"
      description="شعبه‌های زیرمجموعه هر باشگاه را ایجاد و مدیریت کنید"
      action={
        <div className="flex items-end gap-2">
          <ClubSelect
            clubs={clubs.data?.items ?? []}
            value={clubId}
            onChange={setClubId}
          />
          <Button variant="primary" onPress={() => setOpen((v) => !v)}>
            <Icon name="plus" />
            ساخت شعبه
          </Button>
        </div>
      }
    >
      {open && (
        <Card className="mt-5 rounded-2xl border border-border bg-surface p-5">
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
            <Field label="نام شعبه">
              <input
                required
                minLength={2}
                name="name"
                placeholder="شعبه مرکزی"
                className={inputClass}
              />
            </Field>
            <Field label="شماره تماس">
              <input name="phone" className={inputClass} />
            </Field>
            <div className="md:col-span-2">
              <Field label="نشانی">
                <textarea
                  required
                  minLength={5}
                  name="address"
                  className={textareaClass}
                />
              </Field>
            </div>
            <div className="flex gap-2 md:col-span-2">
              <Button
                type="submit"
                variant="primary"
                isPending={create.isPending}
              >
                ساخت شعبه
              </Button>
              <Button
                type="button"
                variant="ghost"
                onPress={() => setOpen(false)}
              >
                انصراف
              </Button>
            </div>
          </form>
        </Card>
      )}
      <div className="mt-5">
        {branches.isPending ? (
          <Loading />
        ) : (branches.data?.items.length ?? 0) === 0 ? (
          <Empty
            title="شعبه‌ای ساخته نشده"
            hint="برای مدیریت مستقل مکان‌ها، اولین شعبه را بسازید"
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {branches.data?.items.map((branch) => (
              <Card
                key={branch.id}
                className="rounded-2xl border border-border bg-surface p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="grid size-11 place-items-center rounded-xl bg-accent/10 text-accent">
                    <Icon name="building-2" size={22} />
                  </div>
                  <StatusChip active={branch.status === "active"} />
                </div>
                <h2 className="mt-4 font-semibold">{branch.name}</h2>
                <p className="mt-2 min-h-10 text-sm leading-6 text-muted">
                  {branch.address}
                </p>
                <p className="mt-2 text-sm tabular-nums">
                  {branch.phone || "شماره تماس ثبت نشده"}
                </p>
                <Button
                  className="mt-4"
                  size="sm"
                  variant="ghost"
                  isPending={update.isPending}
                  onPress={() =>
                    update.mutateAsync({
                      id: branch.id,
                      payload: {
                        status:
                          branch.status === "active" ? "inactive" : "active",
                      },
                    })
                  }
                >
                  {branch.status === "active" ? "تعطیل کردن" : "فعال کردن"}
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Page>
  );
}
