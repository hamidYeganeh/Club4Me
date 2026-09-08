"use client";
import { StudentAccounts } from "@/components/student-accounts";
import { IranDateInput } from "@repo/ui/iran-date-input";
import { tehranLocalValue } from "@repo/ui/iran-date";

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
  type ClubAttendanceRecord,
  type ClubBranch,
  type ClubCoachProfile,
  type ClubManualPayment,
  type ClubStudent,
} from "@api/business";
import {
  type Payout,
  useCancelPayout,
  usePayoutBalance,
  usePayouts,
  useRequestPayout,
} from "@api";
import {
  createListColumnHelper,
  DataTable,
  ListPagePanel,
} from "@/components/data-table";
import { Button, Card, Chip, toast } from "@heroui/react";
import { Icon } from "@theme/icon";
import { EntityDetailsModal } from "@ui/entity-details-modal";
import { FormEvent, ReactNode, useCallback, useMemo, useState } from "react";
import { PanelNumberField } from "@/components/form/PanelNumberField";

const inputClass =
  "h-11 w-full rounded-[1.15rem] border border-white/10 bg-surface/80 px-3 text-sm outline-none transition focus:border-accent";
const textareaClass = `${inputClass} h-24 py-3`;
const iranPhonePattern = "(?:\\+98|0)?9\\d{9}";
const ibanPattern = "IR\\d{24}";
const today = () => tehranLocalValue(new Date().toISOString()).slice(0, 10);
const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("fa-IR", {
        timeZone: "Asia/Tehran",
        dateStyle: "medium",
      }).format(new Date(value))
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

function QueryError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="grid min-h-56 place-items-center rounded-2xl border border-danger/20 bg-danger/5 p-8 text-center">
      <div>
        <p className="text-sm text-danger">دریافت اطلاعات انجام نشد.</p>
        <Button
          className="mt-3"
          size="sm"
          variant="secondary"
          onPress={onRetry}
        >
          تلاش دوباره
        </Button>
      </div>
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

const studentColumnHelper = createListColumnHelper<ClubStudent>();
const coachColumnHelper = createListColumnHelper<ClubCoachProfile>();
const paymentColumnHelper = createListColumnHelper<ClubManualPayment>();
type AttendanceTableRow = ClubStudent & {
  attendance?: ClubAttendanceRecord;
};
const attendanceColumnHelper = createListColumnHelper<AttendanceTableRow>();
const branchColumnHelper = createListColumnHelper<ClubBranch>();

const paymentTypeLabels = {
  tuition: "شهریه",
  session: "سانس",
  other: "سایر",
} as const;

const attendanceStatusLabels = {
  present: "حاضر",
  absent: "غایب",
  excused: "موجه",
} as const;

export function StudentsScreen() {
  const { clubs, clubId, setClubId } = useSelectedClub();
  const students = useClubStudents(clubId);
  const create = useCreateClubStudent(clubId);
  const update = useUpdateClubStudent(clubId);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ClubStudent | null>(null);
  const [draftFilters, setDraftFilters] = useState({
    query: "",
    status: "" as "" | "active" | "inactive",
  });
  const [filters, setFilters] = useState({
    query: "",
    status: "" as "" | "active" | "inactive",
  });

  const items = useMemo(
    () => students.data?.items ?? [],
    [students.data?.items],
  );
  const filtered = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    return items.filter((student) => {
      if (filters.status && student.status !== filters.status) return false;
      if (!query) return true;
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
      return (
        fullName.includes(query) ||
        student.phone.includes(query) ||
        student.sport.toLowerCase().includes(query) ||
        student.membershipTitle.toLowerCase().includes(query)
      );
    });
  }, [filters, items]);

  const filterActiveCount =
    (filters.query.trim() ? 1 : 0) + (filters.status ? 1 : 0);

  const columns = useMemo(
    () =>
      studentColumnHelper.columns([
        studentColumnHelper.accessor(
          (row) => `${row.firstName} ${row.lastName}`,
          {
            id: "name",
            header: "شاگرد",
            cell: (info) => (
              <span className="font-medium">{info.getValue()}</span>
            ),
          },
        ),
        studentColumnHelper.accessor("phone", {
          header: "تماس",
          cell: (info) => (
            <span className="tabular-nums" dir="ltr">
              {info.getValue()}
            </span>
          ),
        }),
        studentColumnHelper.accessor("sport", {
          header: "رشته",
          cell: (info) => info.getValue() || "—",
        }),
        studentColumnHelper.accessor("membershipTitle", {
          enableSorting: false,
          header: "عضویت",
          cell: (info) => (
            <div>
              <div>{info.getValue() || "—"}</div>
              <span className="text-xs text-muted">
                تا {formatDate(info.row.original.membershipEndsAt)}
              </span>
            </div>
          ),
        }),
        studentColumnHelper.accessor("status", {
          header: "وضعیت",
          cell: (info) => <StatusChip active={info.getValue() === "active"} />,
        }),
        studentColumnHelper.display({
          id: "actions",
          header: "عملیات",
          cell: (info) => {
            const student = info.row.original;
            return (
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={() => setSelected(student)}
                >
                  جزئیات
                </Button>
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
                            student.status === "active" ? "inactive" : "active",
                        },
                      })
                      .then(() => toast.success("وضعیت شاگرد تغییر کرد"))
                      .catch(() => toast.danger("تغییر وضعیت انجام نشد"))
                  }
                >
                  {student.status === "active" ? "غیرفعال کردن" : "فعال کردن"}
                </Button>
              </div>
            );
          },
        }),
      ]),
    [update],
  );

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await create.mutateAsync({
        firstName: String(data.get("firstName")),
        lastName: String(data.get("lastName")),
        phone: String(data.get("phone")).trim(),
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
          <Button
            variant="primary"
            isDisabled={!clubId}
            onPress={() => setOpen((value) => !value)}
          >
            <Icon name="plus" />
            افزودن شاگرد
          </Button>
        </div>
      }
    >
      {open && (
        <Card className="mt-5 app-card shadow-none active:scale-100 p-5">
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
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                maxLength={13}
                pattern={iranPhonePattern}
                title="شماره موبایل را مانند 09121234567 یا +989121234567 وارد کنید."
                dir="ltr"
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
              <IranDateInput
                name="membershipEndsAt"

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
      {students.isError ? (
        <div className="mt-5">
          <QueryError onRetry={() => void students.refetch()} />
        </div>
      ) : (
        <ListPagePanel
          title="فهرست شاگردها"
          description={`${filtered.length.toLocaleString("fa-IR")} نفر`}
          filterActiveCount={filterActiveCount}
          filterTitle="فیلتر شاگردها"
          onFilterApply={() => setFilters(draftFilters)}
          onFilterReset={() => {
            const empty = { query: "", status: "" as const };
            setDraftFilters(empty);
            setFilters(empty);
          }}
          filterContent={
            <>
              <label className="grid gap-1.5 text-sm">
                <span className="text-muted">جست‌وجو</span>
                <input
                  className={inputClass}
                  value={draftFilters.query}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      query: event.target.value,
                    }))
                  }
                  placeholder="نام، تماس، رشته یا عضویت"
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="text-muted">وضعیت</span>
                <select
                  className={inputClass}
                  value={draftFilters.status}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      status: event.target.value as "" | "active" | "inactive",
                    }))
                  }
                >
                  <option value="">همه</option>
                  <option value="active">فعال</option>
                  <option value="inactive">غیرفعال</option>
                </select>
              </label>
            </>
          }
        >
          <DataTable
            ariaLabel="فهرست شاگردها"
            data={filtered}
            columns={columns}
            getRowId={(row) => row.id}
            rowHeaderColumnId="name"
            isLoading={students.isPending}
            emptyContent={
              <Empty
                title="هنوز شاگردی ثبت نشده"
                hint="با دکمه افزودن شاگرد، اولین پرونده را بسازید"
              />
            }
          />
        </ListPagePanel>
      )}
      <EntityDetailsModal
        isOpen={Boolean(selected)}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelected(null);
        }}
        title={
          selected
            ? `${selected.firstName} ${selected.lastName}`
            : "جزئیات شاگرد"
        }
        description="پرونده، عضویت و تاریخچه این شاگرد در باشگاه انتخاب‌شده"
        sections={
          selected
            ? [
                {
                  items: [
                    { label: "شناسه پرونده", value: selected.id, dir: "ltr" },
                    { label: "شماره تماس", value: selected.phone, dir: "ltr" },
                    { label: "رشته", value: selected.sport },
                    { label: "عنوان عضویت", value: selected.membershipTitle },
                    {
                      label: "پایان عضویت",
                      value: formatDate(selected.membershipEndsAt),
                    },
                    {
                      label: "وضعیت",
                      value: selected.status === "active" ? "فعال" : "غیرفعال",
                    },
                    { label: "یادداشت", value: selected.notes, wide: true },
                    {
                      label: "ایجاد پرونده",
                      value: formatDate(selected.createdAt),
                    },
                    {
                      label: "آخرین تغییر",
                      value: formatDate(selected.updatedAt),
                    },
                  ],
                },
              ]
            : []
        }
      />
    </Page>
  );
}

export function CoachesScreen() {
  const { clubs, clubId, setClubId } = useSelectedClub();
  const coaches = useClubCoachProfiles(clubId);
  const create = useCreateClubCoach(clubId);
  const update = useUpdateClubCoach(clubId);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ClubCoachProfile | null>(null);
  const [draftFilters, setDraftFilters] = useState({
    query: "",
    status: "" as "" | "active" | "inactive",
  });
  const [filters, setFilters] = useState({
    query: "",
    status: "" as "" | "active" | "inactive",
  });

  const items = useMemo(() => coaches.data?.items ?? [], [coaches.data?.items]);
  const filtered = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    return items.filter((coach) => {
      if (filters.status && coach.status !== filters.status) return false;
      if (!query) return true;
      const fullName = `${coach.firstName} ${coach.lastName}`.toLowerCase();
      return (
        fullName.includes(query) ||
        coach.phone.includes(query) ||
        coach.specialties.some((item) => item.toLowerCase().includes(query)) ||
        coach.employmentType.toLowerCase().includes(query)
      );
    });
  }, [filters, items]);

  const filterActiveCount =
    (filters.query.trim() ? 1 : 0) + (filters.status ? 1 : 0);

  const columns = useMemo(
    () =>
      coachColumnHelper.columns([
        coachColumnHelper.accessor(
          (row) => `${row.firstName} ${row.lastName}`,
          {
            id: "name",
            header: "مربی",
            cell: (info) => (
              <span className="font-medium">{info.getValue()}</span>
            ),
          },
        ),
        coachColumnHelper.accessor("phone", {
          header: "تماس",
          cell: (info) => (
            <span className="tabular-nums" dir="ltr">
              {info.getValue()}
            </span>
          ),
        }),
        coachColumnHelper.accessor("specialties", {
          enableSorting: false,
          header: "تخصص‌ها",
          cell: (info) => {
            const specialties = info.getValue();
            if (!specialties.length) {
              return <span className="text-muted">—</span>;
            }
            return (
              <div className="flex max-w-56 flex-wrap gap-1">
                {specialties.map((item) => (
                  <Chip key={item} size="sm" variant="soft">
                    {item}
                  </Chip>
                ))}
              </div>
            );
          },
        }),
        coachColumnHelper.accessor("employmentType", {
          header: "نوع همکاری",
          cell: (info) => info.getValue() || "ثبت نشده",
        }),
        coachColumnHelper.accessor("status", {
          header: "وضعیت",
          cell: (info) => <StatusChip active={info.getValue() === "active"} />,
        }),
        coachColumnHelper.display({
          id: "actions",
          header: "عملیات",
          cell: (info) => {
            const coach = info.row.original;
            return (
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={() => setSelected(coach)}
                >
                  جزئیات
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  isPending={update.isPending}
                  onPress={() =>
                    update
                      .mutateAsync({
                        id: coach.id,
                        payload: {
                          status:
                            coach.status === "active" ? "inactive" : "active",
                        },
                      })
                      .then(() => toast.success("وضعیت مربی تغییر کرد"))
                      .catch(() => toast.danger("تغییر وضعیت انجام نشد"))
                  }
                >
                  {coach.status === "active" ? "پایان همکاری" : "شروع همکاری"}
                </Button>
              </div>
            );
          },
        }),
      ]),
    [update],
  );

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await create.mutateAsync({
        firstName: String(data.get("firstName")),
        lastName: String(data.get("lastName")),
        phone: String(data.get("phone")).trim(),
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
          <Button
            variant="primary"
            isDisabled={!clubId}
            onPress={() => setOpen((v) => !v)}
          >
            <Icon name="plus" />
            افزودن مربی
          </Button>
        </div>
      }
    >
      {open && (
        <Card className="mt-5 app-card shadow-none active:scale-100 p-5">
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
              <input
                required
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                maxLength={13}
                pattern={iranPhonePattern}
                title="شماره موبایل را مانند 09121234567 یا +989121234567 وارد کنید."
                dir="ltr"
                className={inputClass}
              />
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
      {coaches.isError ? (
        <div className="mt-5">
          <QueryError onRetry={() => void coaches.refetch()} />
        </div>
      ) : (
        <ListPagePanel
          title="فهرست مربی‌ها"
          description={`${filtered.length.toLocaleString("fa-IR")} نفر`}
          filterActiveCount={filterActiveCount}
          filterTitle="فیلتر مربی‌ها"
          onFilterApply={() => setFilters(draftFilters)}
          onFilterReset={() => {
            const empty = { query: "", status: "" as const };
            setDraftFilters(empty);
            setFilters(empty);
          }}
          filterContent={
            <>
              <label className="grid gap-1.5 text-sm">
                <span className="text-muted">جست‌وجو</span>
                <input
                  className={inputClass}
                  value={draftFilters.query}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      query: event.target.value,
                    }))
                  }
                  placeholder="نام، تماس، تخصص یا نوع همکاری"
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="text-muted">وضعیت</span>
                <select
                  className={inputClass}
                  value={draftFilters.status}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      status: event.target.value as "" | "active" | "inactive",
                    }))
                  }
                >
                  <option value="">همه</option>
                  <option value="active">فعال</option>
                  <option value="inactive">غیرفعال</option>
                </select>
              </label>
            </>
          }
        >
          <DataTable
            ariaLabel="فهرست مربی‌ها"
            data={filtered}
            columns={columns}
            getRowId={(row) => row.id}
            rowHeaderColumnId="name"
            isLoading={coaches.isPending}
            emptyContent={
              <Empty
                title="مربی‌ای ثبت نشده"
                hint="اطلاعات اولین مربی را ثبت کنید"
              />
            }
          />
        </ListPagePanel>
      )}
      <EntityDetailsModal
        isOpen={Boolean(selected)}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelected(null);
        }}
        title={
          selected
            ? `${selected.firstName} ${selected.lastName}`
            : "جزئیات مربی"
        }
        description="اطلاعات همکاری و تخصص‌های مربی در باشگاه انتخاب‌شده"
        sections={
          selected
            ? [
                {
                  items: [
                    { label: "شناسه مربی", value: selected.id, dir: "ltr" },
                    { label: "شماره تماس", value: selected.phone, dir: "ltr" },
                    {
                      label: "تخصص‌ها",
                      value: selected.specialties.join("، "),
                    },
                    { label: "نوع همکاری", value: selected.employmentType },
                    {
                      label: "وضعیت",
                      value: selected.status === "active" ? "فعال" : "غیرفعال",
                    },
                    { label: "یادداشت", value: selected.notes, wide: true },
                    {
                      label: "زمان ثبت",
                      value: formatDate(selected.createdAt),
                    },
                    {
                      label: "آخرین تغییر",
                      value: formatDate(selected.updatedAt),
                    },
                  ],
                },
              ]
            : []
        }
      />
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
  const cancelPayout = useCancelPayout();
  const [open, setOpen] = useState(false);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] =
    useState<ClubManualPayment | null>(null);
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [draftFilters, setDraftFilters] = useState({
    query: "",
    type: "" as "" | ClubManualPayment["type"],
  });
  const [filters, setFilters] = useState({
    query: "",
    type: "" as "" | ClubManualPayment["type"],
  });
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
  const paymentItems = useMemo(
    () => payments.data?.items ?? [],
    [payments.data?.items],
  );
  const filteredPayments = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    return paymentItems.filter((payment) => {
      if (filters.type && payment.type !== filters.type) return false;
      if (!query) return true;
      const studentName =
        studentMap.get(payment.studentId)?.toLowerCase() ?? "";
      return (
        studentName.includes(query) ||
        payment.title.toLowerCase().includes(query) ||
        paymentTypeLabels[payment.type].includes(query)
      );
    });
  }, [filters, paymentItems, studentMap]);

  const paymentFilterActiveCount =
    (filters.query.trim() ? 1 : 0) + (filters.type ? 1 : 0);

  const paymentColumns = useMemo(
    () =>
      paymentColumnHelper.columns([
        paymentColumnHelper.display({
          id: "student",
          header: "شاگرد",
          cell: (info) => (
            <span className="font-medium">
              {studentMap.get(info.row.original.studentId) ?? "شاگرد حذف‌شده"}
            </span>
          ),
        }),
        paymentColumnHelper.accessor("title", {
          header: "عنوان",
        }),
        paymentColumnHelper.accessor("type", {
          header: "نوع",
          cell: (info) => paymentTypeLabels[info.getValue()],
        }),
        paymentColumnHelper.accessor("amount", {
          header: "مبلغ",
          cell: (info) => (
            <span className="font-semibold tabular-nums">
              {formatMoney(info.getValue())} ریال
            </span>
          ),
        }),
        paymentColumnHelper.display({
          id: "receiptStatus",
          header: "وضعیت رسید",
          cell: (info) =>
            info.row.original.voidedAt
              ? "باطل‌شده"
              : (info.row.original.refundedAmount ?? 0) > 0
                ? `برگشتی: ${formatMoney(info.row.original.refundedAmount ?? 0)} ریال`
                : info.row.original.enrollmentId
                  ? "متصل به ثبت‌نام"
                  : "تخصیص‌نیافته",
        }),
        paymentColumnHelper.accessor("paidAt", {
          header: "تاریخ",
          cell: (info) => formatDate(info.getValue()),
        }),
        paymentColumnHelper.display({
          id: "actions",
          header: "عملیات",
          cell: (info) => (
            <Button
              size="sm"
              variant="ghost"
              onPress={() => setSelectedPayment(info.row.original)}
            >
              جزئیات
            </Button>
          ),
        }),
      ]),
    [studentMap],
  );

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
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
      form.reset();
      setOpen(false);
      toast.success("پرداخت ثبت شد");
    } catch {
      toast.danger("ثبت پرداخت انجام نشد");
    }
  };
  const submitPayout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await requestPayout.mutateAsync({
        providerType: "club",
        providerId: clubId,
        amount: Number(data.get("amount")),
        iban: String(data.get("iban")).replaceAll(" ", "").trim().toUpperCase(),
      });
      form.reset();
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
      <StudentAccounts key={clubId} clubId={clubId} />
      <section className="mt-5 grid gap-4 lg:grid-cols-[1fr_2fr]">
        <Card className="app-card shadow-none active:scale-100 p-5">
          <p className="text-sm text-muted">موجودی قابل برداشت</p>
          <p className="mt-1 text-xs text-warning">
            پرداخت و تسویه آزمایشی است؛ انتقال بانکی انجام نمی‌شود.
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums">
            {formatMoney(payoutBalance.data?.availableAmount ?? 0)} ریال
          </p>
          <p className="mt-1 text-xs text-muted">
            در انتظار تسویه:{" "}
            {formatMoney(payoutBalance.data?.reservedAmount ?? 0)} ریال
          </p>
          {(payoutBalance.data?.outstandingDebt ?? 0) > 0 ? (
            <p className="mt-2 text-sm text-danger">
              بدهی بازپرداخت:{" "}
              {formatMoney(payoutBalance.data?.outstandingDebt ?? 0)} ریال؛ از
              درآمد بعدی کسر می‌شود.
            </p>
          ) : null}
          <Button
            className="mt-4"
            variant="primary"
            isDisabled={(payoutBalance.data?.availableAmount ?? 0) <= 0}
            onPress={() => setPayoutOpen((value) => !value)}
          >
            درخواست برداشت
          </Button>
        </Card>
        <Card className="app-card shadow-none active:scale-100 p-5">
          <h2 className="font-semibold">آخرین تسویه‌ها</h2>
          <div className="mt-3 space-y-2 text-sm">
            {(payouts.data?.items ?? []).slice(0, 4).map((payout) => (
              <div
                key={payout.id}
                className="flex items-center justify-between gap-3"
              >
                <span>{formatMoney(payout.amount)} ریال</span>
                <div className="flex items-center gap-2">
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
                        under_review: "در حال بررسی",
                        paid: "پرداخت‌شده",
                        rejected: "ردشده",
                        cancelled: "لغوشده",
                      }[payout.status]
                    }
                  </Chip>
                  <Button
                    size="sm"
                    variant="ghost"
                    onPress={() => setSelectedPayout(payout)}
                  >
                    جزئیات
                  </Button>
                  {payout.status === "requested" ? (
                    <Button
                      size="sm"
                      variant="danger-soft"
                      isPending={cancelPayout.isPending}
                      onPress={async () => {
                        if (!window.confirm("درخواست تسویه لغو شود؟")) return;
                        try {
                          await cancelPayout.mutateAsync(payout.id);
                          toast.success("درخواست لغو و موجودی آزاد شد");
                        } catch {
                          toast.danger("لغو درخواست تسویه ناموفق بود");
                        }
                      }}
                    >
                      لغو
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
            {!payouts.data?.items.length ? (
              <p className="text-muted">هنوز تسویه‌ای ثبت نشده است.</p>
            ) : null}
          </div>
        </Card>
      </section>
      {payoutOpen ? (
        <Card className="mt-4 app-card shadow-none active:scale-100 p-5">
          <form onSubmit={submitPayout} className="grid gap-4 md:grid-cols-2">
            <Field label="مبلغ برداشت (ریال)">
              <PanelNumberField
                name="amount"
                minValue={1}
                step={1}
                isRequired
                maxValue={payoutBalance.data?.availableAmount ?? undefined}
                aria-label="مبلغ برداشت (ریال)"
              />
            </Field>
            <Field label="شماره شبا">
              <input
                required
                name="iban"
                dir="ltr"
                inputMode="numeric"
                maxLength={26}
                pattern={ibanPattern}
                title="شماره شبا باید با IR شروع شود و پس از آن دقیقاً ۲۴ رقم داشته باشد."
                autoComplete="off"
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
        <Card className="mt-5 app-card shadow-none active:scale-100 p-5">
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
              <PanelNumberField
                name="amount"
                minValue={1}
                step={1}
                isRequired
                aria-label="مبلغ (ریال)"
              />
            </Field>
            <Field label="تاریخ پرداخت">
              <IranDateInput
                required
                defaultValue={today()}
                name="paidAt"

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
      {payments.isError ? (
        <div className="mt-5">
          <QueryError onRetry={() => void payments.refetch()} />
        </div>
      ) : (
        <ListPagePanel
          title="فهرست پرداخت‌ها"
          description={`${filteredPayments.length.toLocaleString("fa-IR")} پرداخت`}
          filterActiveCount={paymentFilterActiveCount}
          filterTitle="فیلتر پرداخت‌ها"
          onFilterApply={() => setFilters(draftFilters)}
          onFilterReset={() => {
            const empty = { query: "", type: "" as const };
            setDraftFilters(empty);
            setFilters(empty);
          }}
          filterContent={
            <>
              <label className="grid gap-1.5 text-sm">
                <span className="text-muted">جست‌وجو</span>
                <input
                  className={inputClass}
                  value={draftFilters.query}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      query: event.target.value,
                    }))
                  }
                  placeholder="نام شاگرد، عنوان یا نوع"
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="text-muted">نوع پرداخت</span>
                <select
                  className={inputClass}
                  value={draftFilters.type}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      type: event.target.value as
                        "" | ClubManualPayment["type"],
                    }))
                  }
                >
                  <option value="">همه</option>
                  <option value="tuition">شهریه</option>
                  <option value="session">هزینه سانس</option>
                  <option value="other">سایر</option>
                </select>
              </label>
            </>
          }
        >
          <DataTable
            ariaLabel="فهرست پرداخت‌ها"
            data={filteredPayments}
            columns={paymentColumns}
            getRowId={(row) => row.id}
            rowHeaderColumnId="student"
            isLoading={payments.isPending}
            emptyContent={
              <Empty
                title="پرداختی ثبت نشده"
                hint="پس از دریافت وجه، آن را به‌عنوان پرداخت‌شده ثبت کنید"
              />
            }
          />
        </ListPagePanel>
      )}
      <EntityDetailsModal
        isOpen={Boolean(selectedPayment)}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelectedPayment(null);
        }}
        title={selectedPayment?.title ?? "جزئیات پرداخت"}
        description="اطلاعات کامل دریافت ثبت‌شده در باشگاه"
        sections={
          selectedPayment
            ? [
                {
                  items: [
                    {
                      label: "شناسه پرداخت",
                      value: selectedPayment.id,
                      dir: "ltr",
                    },
                    {
                      label: "شاگرد",
                      value:
                        studentMap.get(selectedPayment.studentId) ??
                        "شاگرد حذف‌شده",
                    },
                    {
                      label: "شناسه شاگرد",
                      value: selectedPayment.studentId,
                      dir: "ltr",
                    },
                    { label: "نوع", value: selectedPayment.type },
                    {
                      label: "مبلغ",
                      value: `${formatMoney(selectedPayment.amount)} ${selectedPayment.currency}`,
                    },
                    { label: "روش پرداخت", value: selectedPayment.method },
                    {
                      label: "تاریخ پرداخت",
                      value: formatDate(selectedPayment.paidAt),
                    },
                    {
                      label: "ثبت‌کننده",
                      value: selectedPayment.recordedBy,
                      dir: "ltr",
                    },
                    {
                      label: "یادداشت",
                      value: selectedPayment.notes,
                      wide: true,
                    },
                    {
                      label: "زمان ثبت",
                      value: formatDate(selectedPayment.createdAt),
                    },
                  ],
                },
              ]
            : []
        }
      />
      <EntityDetailsModal
        isOpen={Boolean(selectedPayout)}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelectedPayout(null);
        }}
        title="جزئیات درخواست تسویه"
        description="وضعیت درخواست و اطلاعات بررسی ادمین"
        sections={
          selectedPayout
            ? [
                {
                  items: [
                    {
                      label: "شناسه تسویه",
                      value: selectedPayout.id,
                      dir: "ltr",
                    },
                    {
                      label: "مبلغ",
                      value: `${formatMoney(selectedPayout.amount)} ریال`,
                    },
                    {
                      label: "شماره شبا",
                      value: selectedPayout.iban,
                      dir: "ltr",
                    },
                    { label: "وضعیت", value: selectedPayout.status },
                    {
                      label: "یادداشت ادمین",
                      value: selectedPayout.reviewNote,
                      wide: true,
                    },
                    {
                      label: "شماره پیگیری بانکی",
                      value: selectedPayout.bankReference,
                      dir: "ltr",
                    },
                    {
                      label: "زمان درخواست",
                      value: formatDate(selectedPayout.createdAt),
                    },
                    {
                      label: "زمان بررسی",
                      value: formatDate(selectedPayout.reviewedAt),
                    },
                    {
                      label: "زمان پرداخت",
                      value: formatDate(selectedPayout.paidAt),
                    },
                  ],
                },
              ]
            : []
        }
      />
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
  const [selected, setSelected] = useState<ClubAttendanceRecord | null>(null);
  const [draftFilters, setDraftFilters] = useState({ query: "" });
  const [filters, setFilters] = useState({ query: "" });
  const recordMap = useMemo(
    () =>
      new Map(
        (records.data?.items ?? [])
          .filter((item) => item.sessionTitle === sessionTitle)
          .map((item) => [item.studentId, item]),
      ),
    [records.data?.items, sessionTitle],
  );
  const attendanceRows = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    return (students.data?.items ?? [])
      .filter((student) => student.status === "active")
      .filter((student) => {
        if (!query) return true;
        const fullName =
          `${student.firstName} ${student.lastName}`.toLowerCase();
        return (
          fullName.includes(query) ||
          student.sport.toLowerCase().includes(query) ||
          student.membershipTitle.toLowerCase().includes(query) ||
          student.phone.includes(query)
        );
      })
      .map((student) => ({
        ...student,
        attendance: recordMap.get(student.id),
      }));
  }, [filters.query, recordMap, students.data?.items]);

  const attendanceFilterActiveCount = filters.query.trim() ? 1 : 0;

  const mark = useCallback(
    (student: ClubStudent, status: "present" | "absent" | "excused") => {
      if (sessionTitle.trim().length < 2) {
        toast.danger("عنوان سانس باید حداقل ۲ نویسه باشد");
        return;
      }
      return upsert
        .mutateAsync({
          studentId: student.id,
          date: new Date(`${date}T12:00:00.000Z`).toISOString(),
          sessionTitle: sessionTitle.trim(),
          status,
          notes: "",
        })
        .then(() => toast.success(`حضور ${student.firstName} ثبت شد`))
        .catch(() => toast.danger("ثبت حضور انجام نشد"));
    },
    [date, sessionTitle, upsert],
  );

  const attendanceColumns = useMemo(
    () =>
      attendanceColumnHelper.columns([
        attendanceColumnHelper.accessor(
          (row) => `${row.firstName} ${row.lastName}`,
          {
            id: "name",
            header: "شاگرد",
            cell: (info) => (
              <span className="font-medium">{info.getValue()}</span>
            ),
          },
        ),
        attendanceColumnHelper.display({
          id: "membership",
          header: "رشته / عضویت",
          cell: (info) => {
            const student = info.row.original;
            return (
              <span className="text-sm text-muted">
                {student.sport ||
                  student.membershipTitle ||
                  student.phone ||
                  "—"}
              </span>
            );
          },
        }),
        attendanceColumnHelper.display({
          id: "status",
          header: "وضعیت",
          cell: (info) => {
            const status = info.row.original.attendance?.status;
            if (!status) {
              return (
                <Chip size="sm" variant="soft">
                  ثبت نشده
                </Chip>
              );
            }
            return (
              <Chip
                size="sm"
                variant="soft"
                color={
                  status === "present"
                    ? "success"
                    : status === "absent"
                      ? "danger"
                      : "default"
                }
              >
                {attendanceStatusLabels[status]}
              </Chip>
            );
          },
        }),
        attendanceColumnHelper.display({
          id: "actions",
          header: "عملیات",
          cell: (info) => {
            const student = info.row.original;
            const current = student.attendance;
            return (
              <div className="flex flex-wrap gap-2">
                {current ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onPress={() => setSelected(current)}
                  >
                    جزئیات
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant={current?.status === "present" ? "primary" : "ghost"}
                  isDisabled={
                    upsert.isPending || sessionTitle.trim().length < 2
                  }
                  onPress={() => mark(student, "present")}
                >
                  حاضر
                </Button>
                <Button
                  size="sm"
                  variant={current?.status === "absent" ? "danger" : "ghost"}
                  isDisabled={
                    upsert.isPending || sessionTitle.trim().length < 2
                  }
                  onPress={() => mark(student, "absent")}
                >
                  غایب
                </Button>
                <Button
                  size="sm"
                  variant={
                    current?.status === "excused" ? "secondary" : "ghost"
                  }
                  isDisabled={
                    upsert.isPending || sessionTitle.trim().length < 2
                  }
                  onPress={() => mark(student, "excused")}
                >
                  موجه
                </Button>
              </div>
            );
          },
        }),
      ]),
    [mark, sessionTitle, upsert.isPending],
  );

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
      <Card className="mt-5 app-card shadow-none active:scale-100 p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="تاریخ">
            <IranDateInput
              required
              value={date}
              onValueChange={(dateValue) => setDate(dateValue)}
              className={inputClass}
            />
          </Field>
          <Field label="عنوان سانس">
            <input
              required
              minLength={2}
              maxLength={120}
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </Card>
      {students.isError || records.isError ? (
        <div className="mt-5">
          <QueryError
            onRetry={() => {
              void students.refetch();
              void records.refetch();
            }}
          />
        </div>
      ) : (
        <ListPagePanel
          title="فهرست حضور و غیاب"
          description={`${attendanceRows.length.toLocaleString("fa-IR")} شاگرد فعال`}
          filterActiveCount={attendanceFilterActiveCount}
          filterTitle="فیلتر شاگردها"
          onFilterApply={() => setFilters(draftFilters)}
          onFilterReset={() => {
            const empty = { query: "" };
            setDraftFilters(empty);
            setFilters(empty);
          }}
          filterContent={
            <label className="grid gap-1.5 text-sm">
              <span className="text-muted">جست‌وجو</span>
              <input
                className={inputClass}
                value={draftFilters.query}
                onChange={(event) =>
                  setDraftFilters({ query: event.target.value })
                }
                placeholder="نام، رشته، عضویت یا تماس"
              />
            </label>
          }
        >
          <DataTable
            ariaLabel="فهرست حضور و غیاب"
            data={attendanceRows}
            columns={attendanceColumns}
            getRowId={(row) => row.id}
            rowHeaderColumnId="name"
            isLoading={students.isPending || records.isPending}
            emptyContent={
              <Empty
                title="شاگرد فعالی وجود ندارد"
                hint="ابتدا از بخش شاگردها پرونده بسازید"
              />
            }
          />
        </ListPagePanel>
      )}
      <EntityDetailsModal
        isOpen={Boolean(selected)}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelected(null);
        }}
        title="جزئیات حضور و غیاب"
        description="رکورد ثبت‌شده برای شاگرد و سانس انتخاب‌شده"
        sections={
          selected
            ? [
                {
                  items: [
                    { label: "شناسه رکورد", value: selected.id, dir: "ltr" },
                    {
                      label: "شناسه شاگرد",
                      value: selected.studentId,
                      dir: "ltr",
                    },
                    { label: "عنوان سانس", value: selected.sessionTitle },
                    { label: "تاریخ", value: formatDate(selected.date) },
                    { label: "وضعیت", value: selected.status },
                    {
                      label: "ثبت‌کننده",
                      value: selected.recordedBy,
                      dir: "ltr",
                    },
                    { label: "یادداشت", value: selected.notes, wide: true },
                    {
                      label: "آخرین تغییر",
                      value: formatDate(selected.updatedAt),
                    },
                  ],
                },
              ]
            : []
        }
      />
    </Page>
  );
}

export function BranchesScreen() {
  const { clubs, clubId, setClubId } = useSelectedClub();
  const branches = useClubBranches(clubId);
  const create = useCreateClubBranch(clubId);
  const update = useUpdateClubBranch(clubId);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ClubBranch | null>(null);
  const [draftFilters, setDraftFilters] = useState({
    query: "",
    status: "" as "" | "active" | "inactive",
  });
  const [filters, setFilters] = useState({
    query: "",
    status: "" as "" | "active" | "inactive",
  });

  const items = useMemo(
    () => branches.data?.items ?? [],
    [branches.data?.items],
  );
  const filtered = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    return items.filter((branch) => {
      if (filters.status && branch.status !== filters.status) return false;
      if (!query) return true;
      return (
        branch.name.toLowerCase().includes(query) ||
        branch.address.toLowerCase().includes(query) ||
        branch.phone.includes(query)
      );
    });
  }, [filters, items]);

  const filterActiveCount =
    (filters.query.trim() ? 1 : 0) + (filters.status ? 1 : 0);

  const columns = useMemo(
    () =>
      branchColumnHelper.columns([
        branchColumnHelper.accessor("name", {
          header: "نام شعبه",
          cell: (info) => (
            <span className="font-medium">{info.getValue()}</span>
          ),
        }),
        branchColumnHelper.accessor("address", {
          enableSorting: false,
          header: "نشانی",
          cell: (info) => (
            <span className="line-clamp-2 max-w-xs text-sm text-muted">
              {info.getValue()}
            </span>
          ),
        }),
        branchColumnHelper.accessor("phone", {
          header: "تماس",
          cell: (info) => (
            <span className="tabular-nums" dir="ltr">
              {info.getValue() || "ثبت نشده"}
            </span>
          ),
        }),
        branchColumnHelper.accessor("status", {
          header: "وضعیت",
          cell: (info) => <StatusChip active={info.getValue() === "active"} />,
        }),
        branchColumnHelper.display({
          id: "actions",
          header: "عملیات",
          cell: (info) => {
            const branch = info.row.original;
            return (
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={() => setSelected(branch)}
                >
                  جزئیات
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  isPending={update.isPending}
                  onPress={() =>
                    update
                      .mutateAsync({
                        id: branch.id,
                        payload: {
                          status:
                            branch.status === "active" ? "inactive" : "active",
                        },
                      })
                      .then(() => toast.success("وضعیت شعبه تغییر کرد"))
                      .catch(() => toast.danger("تغییر وضعیت انجام نشد"))
                  }
                >
                  {branch.status === "active" ? "تعطیل کردن" : "فعال کردن"}
                </Button>
              </div>
            );
          },
        }),
      ]),
    [update],
  );

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await create.mutateAsync({
        name: String(data.get("name")).trim(),
        address: String(data.get("address")).trim(),
        phone: String(data.get("phone")).trim(),
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
          <Button
            variant="primary"
            isDisabled={!clubId}
            onPress={() => setOpen((v) => !v)}
          >
            <Icon name="plus" />
            ساخت شعبه
          </Button>
        </div>
      }
    >
      {open && (
        <Card className="mt-5 app-card shadow-none active:scale-100 p-5">
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
              <input
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                maxLength={13}
                pattern={iranPhonePattern}
                title="شماره موبایل را مانند 09121234567 یا +989121234567 وارد کنید."
                dir="ltr"
                className={inputClass}
              />
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
      {branches.isError ? (
        <div className="mt-5">
          <QueryError onRetry={() => void branches.refetch()} />
        </div>
      ) : (
        <ListPagePanel
          title="فهرست شعبه‌ها"
          description={`${filtered.length.toLocaleString("fa-IR")} شعبه`}
          filterActiveCount={filterActiveCount}
          filterTitle="فیلتر شعبه‌ها"
          onFilterApply={() => setFilters(draftFilters)}
          onFilterReset={() => {
            const empty = { query: "", status: "" as const };
            setDraftFilters(empty);
            setFilters(empty);
          }}
          filterContent={
            <>
              <label className="grid gap-1.5 text-sm">
                <span className="text-muted">جست‌وجو</span>
                <input
                  className={inputClass}
                  value={draftFilters.query}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      query: event.target.value,
                    }))
                  }
                  placeholder="نام، نشانی یا تماس"
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="text-muted">وضعیت</span>
                <select
                  className={inputClass}
                  value={draftFilters.status}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      status: event.target.value as "" | "active" | "inactive",
                    }))
                  }
                >
                  <option value="">همه</option>
                  <option value="active">فعال</option>
                  <option value="inactive">غیرفعال</option>
                </select>
              </label>
            </>
          }
        >
          <DataTable
            ariaLabel="فهرست شعبه‌ها"
            data={filtered}
            columns={columns}
            getRowId={(row) => row.id}
            rowHeaderColumnId="name"
            isLoading={branches.isPending}
            emptyContent={
              <Empty
                title="شعبه‌ای ساخته نشده"
                hint="برای مدیریت مستقل مکان‌ها، اولین شعبه را بسازید"
              />
            }
          />
        </ListPagePanel>
      )}
      <EntityDetailsModal
        isOpen={Boolean(selected)}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelected(null);
        }}
        title={selected?.name ?? "جزئیات شعبه"}
        description="اطلاعات تماس، نشانی و وضعیت شعبه"
        sections={
          selected
            ? [
                {
                  items: [
                    { label: "شناسه شعبه", value: selected.id, dir: "ltr" },
                    { label: "نشانی", value: selected.address, wide: true },
                    { label: "شماره تماس", value: selected.phone, dir: "ltr" },
                    {
                      label: "منطقه زمانی",
                      value: selected.timezone,
                      dir: "ltr",
                    },
                    {
                      label: "وضعیت",
                      value: selected.status === "active" ? "فعال" : "غیرفعال",
                    },
                    {
                      label: "زمان ثبت",
                      value: formatDate(selected.createdAt),
                    },
                    {
                      label: "آخرین تغییر",
                      value: formatDate(selected.updatedAt),
                    },
                  ],
                },
              ]
            : []
        }
      />
    </Page>
  );
}
