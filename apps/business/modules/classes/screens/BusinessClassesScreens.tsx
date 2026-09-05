"use client";

import {
  useBusinessClass,
  useBusinessClassAttendance,
  useBusinessClassEnrollments,
  useBusinessClasses,
  useBusinessClassSessions,
  useBusinessClubs,
  useClubBranches,
  useClubCoachProfiles,
  useClubStudents,
  useCreateBusinessClass,
  useCreateBusinessCalendarFeed,
  useRevokeBusinessCalendarFeed,
  useEnrollStudentInBusinessClass,
  useRecordBusinessClassAttendance,
  useRegenerateBusinessClassSessions,
  useGenerateBusinessClassCheckIn,
  useTransferBusinessClassEnrollment,
  useUpdateBusinessClass,
  useUpdateBusinessClassEnrollment,
  useUpdateBusinessClassSession,
  type BusinessClassModel,
  type BusinessClassPayload,
  type BusinessClassPricingModel,
  type BusinessClassStatus,
  type BusinessTrainingClass,
} from "@api/business";
import { Button, Card, Chip, Spinner, toast } from "@heroui/react";
import { getApiConfig } from "@api";
import { Icon } from "@theme/icon";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import QRCode from "qrcode";

const input =
  "h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground outline-none transition focus:border-accent";
const dateText = (value: string) =>
  new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(
    new Date(value),
  );
const dateTime = (value: string) =>
  new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
const money = (value: number) => new Intl.NumberFormat("fa-IR").format(value);
const parseFaqRows = (value: string) =>
  value
    .split("\n")
    .map((row) => row.split("|").map((part) => part.trim()))
    .filter(([question, answer]) => Boolean(question && answer))
    .map(([question, answer]) => ({ question: question!, answer: answer! }));
const modelLabels: Record<BusinessClassModel, string> = {
  group: "گروهی",
  private: "خصوصی",
  course: "دوره‌ای",
  single: "تک‌جلسه‌ای",
  open: "آزاد",
};
const pricingLabels: Record<BusinessClassPricingModel, string> = {
  monthly: "ماهانه",
  course: "کل دوره",
  per_session: "هر جلسه",
  package: "پکیج جلسات",
};
const statusLabels: Record<BusinessClassStatus, string> = {
  draft: "پیش‌نویس",
  active: "فعال",
  paused: "متوقف",
  completed: "تمام‌شده",
  cancelled: "لغوشده",
};
const weekdays = [
  { value: 6, label: "شنبه" },
  { value: 0, label: "یکشنبه" },
  { value: 1, label: "دوشنبه" },
  { value: 2, label: "سه‌شنبه" },
  { value: 3, label: "چهارشنبه" },
  { value: 4, label: "پنجشنبه" },
  { value: 5, label: "جمعه" },
];

function Shell({
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
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="text-muted">{label}</span>
      {children}
    </label>
  );
}
function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-52 place-items-center rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">
      {children}
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

export function BusinessClassesScreen() {
  const clubs = useBusinessClubs();
  const [picked, setPicked] = useState("");
  const clubId = picked || clubs.data?.items[0]?.id || "";
  const classes = useBusinessClasses(clubId);
  return (
    <Shell
      title="کلاس‌ها"
      description="کلاس‌ها، ظرفیت، برنامه و شاگردهای ثبت‌نام‌شده را مدیریت کنید"
      action={
        <div className="flex items-end gap-2">
          <Field label="باشگاه">
            <select
              className={`${input} min-w-52`}
              value={clubId}
              onChange={(e) => setPicked(e.target.value)}
            >
              {clubs.data?.items.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
            </select>
          </Field>
          <Button variant="primary">
            <Link href="/classes/new" className="flex items-center gap-2">
              <Icon name="plus" />
              ساخت کلاس
            </Link>
          </Button>
        </div>
      }
    >
      <div className="mt-6">
        {classes.isPending ? (
          <Loading />
        ) : !classes.data?.items.length ? (
          <Empty>
            <div>
              <Icon name="calendar-plus" size={28} />
              <p className="mt-3">هنوز کلاسی برای این باشگاه ساخته نشده است.</p>
            </div>
          </Empty>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {classes.data.items.map((item) => (
              <Link key={item.id} href={`/clubs/${clubId}/classes/${item.id}`}>
                <Card className="h-full rounded-2xl border border-border bg-surface p-5 transition hover:border-accent">
                  <div className="flex items-start justify-between gap-3">
                    <Chip size="sm" variant="soft">
                      {modelLabels[item.model]}
                    </Chip>
                    <Chip
                      size="sm"
                      color={item.status === "active" ? "success" : "default"}
                      variant="soft"
                    >
                      {statusLabels[item.status]}
                    </Chip>
                  </div>
                  <h2 className="mt-4 text-lg font-semibold">{item.title}</h2>
                  <p className="mt-1 text-sm text-muted">
                    {item.sport || "رشته ثبت نشده"}
                    {item.level ? ` · ${item.level}` : ""}
                  </p>
                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted">ظرفیت</span>
                      <p className="mt-1 font-medium">
                        {item.enrollmentCount} از {item.capacity}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted">شهریه</span>
                      <p className="mt-1 font-medium">
                        {money(item.price)} ریال
                      </p>
                    </div>
                    <div>
                      <span className="text-muted">مدل پرداخت</span>
                      <p className="mt-1">{pricingLabels[item.pricingModel]}</p>
                    </div>
                    <div>
                      <span className="text-muted">بازه</span>
                      <p className="mt-1">{dateText(item.startDate)}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}

type ScheduleDraft = {
  dayOfWeek: number;
  startTime: string;
  durationMinutes: number;
};
function ClassForm({
  initial,
  fixedClubId,
}: {
  initial?: BusinessTrainingClass;
  fixedClubId?: string;
}) {
  const router = useRouter();
  const clubs = useBusinessClubs();
  const [clubChoice, setClubChoice] = useState(fixedClubId ?? "");
  const clubId = fixedClubId || clubChoice || clubs.data?.items[0]?.id || "";
  const coaches = useClubCoachProfiles(clubId);
  const branches = useClubBranches(clubId);
  const create = useCreateBusinessClass(clubId);
  const update = useUpdateBusinessClass(clubId, initial?.id ?? "");
  const [model, setModel] = useState<BusinessClassModel>(
    initial?.model ?? "group",
  );
  const [pricingModel, setPricingModel] = useState<BusinessClassPricingModel>(
    initial?.pricingModel ?? "monthly",
  );
  const [schedule, setSchedule] = useState<ScheduleDraft[]>(
    initial?.schedule ?? [
      { dayOfWeek: 6, startTime: "18:00", durationMinutes: 60 },
    ],
  );
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload: BusinessClassPayload = {
      title: String(data.get("title")),
      description: String(data.get("description")),
      faqs: parseFaqRows(String(data.get("faqs") ?? "")),
      sport: String(data.get("sport")),
      level: String(data.get("level")),
      model,
      pricingModel,
      price: Number(data.get("price")),
      currency: "IRR",
      packageSessionCount:
        pricingModel === "package"
          ? Number(data.get("packageSessionCount"))
          : null,
      capacity: Number(data.get("capacity")),
      coachProfileId: String(data.get("coachProfileId")) || null,
      branchId: String(data.get("branchId")) || null,
      startDate: String(data.get("startDate")),
      endDate: String(data.get("endDate")),
      schedule: model === "single" ? schedule.slice(0, 1) : schedule,
      visibility: String(data.get("visibility")) as "public" | "private",
      enrollmentMode: String(data.get("enrollmentMode")) as
        "automatic" | "requires_approval",
      status: String(data.get("status")) as BusinessClassStatus,
    };
    try {
      const result = initial
        ? await update.mutateAsync(payload)
        : await create.mutateAsync(payload);
      toast.success(
        initial ? "تغییرات کلاس ذخیره شد" : "کلاس و جلسات آن ساخته شد",
      );
      router.push(`/clubs/${clubId}/classes/${result.id}`);
    } catch {
      toast.danger("ذخیره کلاس انجام نشد؛ تاریخ، ظرفیت و برنامه را بررسی کنید");
    }
  };
  const setScheduleField = (
    index: number,
    field: keyof ScheduleDraft,
    value: string | number,
  ) =>
    setSchedule((items) =>
      items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    );
  if (clubs.isPending) return <Loading />;
  if (!clubId)
    return (
      <Shell
        title="ابتدا یک باشگاه بسازید"
        description="هر کلاس باید زیرمجموعه یک باشگاه باشد."
      >
        <div className="mt-6">
          <Empty>
            <Button variant="primary">
              <Link href="/clubs/new">ساخت باشگاه</Link>
            </Button>
          </Empty>
        </div>
      </Shell>
    );
  return (
    <Shell
      title={initial ? "ویرایش کلاس" : "ساخت کلاس جدید"}
      description="نوع کلاس، مدل مالی و برنامه هفتگی را مشخص کنید"
    >
      <form onSubmit={save} className="mt-6 grid gap-5">
        <Card className="grid gap-4 rounded-2xl border border-border bg-surface p-5 md:grid-cols-2 lg:grid-cols-3">
          {!fixedClubId && (
            <Field label="باشگاه">
              <select
                required
                className={input}
                value={clubId}
                onChange={(e) => setClubChoice(e.target.value)}
              >
                {clubs.data?.items.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label="نام کلاس">
            <input
              required
              minLength={2}
              name="title"
              defaultValue={initial?.title}
              className={input}
            />
          </Field>
          <Field label="رشته">
            <input
              name="sport"
              defaultValue={initial?.sport}
              placeholder="مثلاً بدنسازی"
              className={input}
            />
          </Field>
          <Field label="سطح">
            <input
              name="level"
              defaultValue={initial?.level}
              placeholder="مقدماتی، پیشرفته و ..."
              className={input}
            />
          </Field>
          <Field label="مدل کلاس">
            <select
              className={input}
              value={model}
              onChange={(e) => setModel(e.target.value as BusinessClassModel)}
            >
              {Object.entries(modelLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="ظرفیت">
            <input
              required
              name="capacity"
              type="number"
              min="1"
              max={model === "private" ? 4 : 1000}
              defaultValue={initial?.capacity ?? (model === "private" ? 1 : 12)}
              className={input}
            />
          </Field>
          <Field label="وضعیت">
            <select
              name="status"
              defaultValue={initial?.status ?? "active"}
              className={input}
            >
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="نمایش در اپ ورزشکار">
            <select
              name="visibility"
              defaultValue={initial?.visibility ?? "public"}
              className={input}
            >
              <option value="public">عمومی و قابل ثبت‌نام</option>
              <option value="private">خصوصی و فقط مدیریت باشگاه</option>
            </select>
          </Field>
          <Field label="روش تأیید ثبت‌نام">
            <select
              name="enrollmentMode"
              defaultValue={initial?.enrollmentMode ?? "automatic"}
              className={input}
            >
              <option value="automatic">خودکار پس از پرداخت</option>
              <option value="requires_approval">نیازمند تأیید باشگاه</option>
            </select>
          </Field>
          <Field label="مربی">
            <select
              name="coachProfileId"
              defaultValue={initial?.coachProfileId ?? ""}
              className={input}
            >
              <option value="">بدون مربی</option>
              {coaches.data?.items.map((coach) => (
                <option key={coach.id} value={coach.id}>
                  {coach.firstName} {coach.lastName}
                </option>
              ))}
            </select>
          </Field>
          <Field label="شعبه">
            <select
              name="branchId"
              defaultValue={initial?.branchId ?? ""}
              className={input}
            >
              <option value="">بدون شعبه</option>
              {branches.data?.items.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="md:col-span-2 lg:col-span-3">
            <Field label="توضیحات">
              <textarea
                name="description"
                defaultValue={initial?.description}
                className={`${input} h-24 py-3`}
              />
            </Field>
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <Field label="سوالات متداول">
              <textarea
                name="faqs"
                defaultValue={initial?.faqs
                  ?.map((item) => `${item.question} | ${item.answer}`)
                  .join("\n")}
                className={`${input} min-h-28 py-3`}
                placeholder="هر خط: سوال | پاسخ"
              />
            </Field>
          </div>
        </Card>
        <Card className="grid gap-4 rounded-2xl border border-border bg-surface p-5 md:grid-cols-2 lg:grid-cols-4">
          <Field label="مدل پرداخت">
            <select
              className={input}
              value={pricingModel}
              onChange={(e) =>
                setPricingModel(e.target.value as BusinessClassPricingModel)
              }
            >
              {Object.entries(pricingLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="مبلغ (ریال)">
            <input
              required
              min="0"
              name="price"
              type="number"
              defaultValue={initial?.price ?? 0}
              className={input}
            />
          </Field>
          {pricingModel === "package" && (
            <Field label="تعداد جلسات پکیج">
              <input
                required
                min="1"
                name="packageSessionCount"
                type="number"
                defaultValue={initial?.packageSessionCount ?? 8}
                className={input}
              />
            </Field>
          )}
          <Field label="شروع دوره">
            <input
              required
              name="startDate"
              type="date"
              defaultValue={initial?.startDate}
              className={input}
            />
          </Field>
          <Field label="پایان دوره">
            <input
              required
              name="endDate"
              type="date"
              defaultValue={initial?.endDate}
              className={input}
            />
          </Field>
        </Card>
        <Card className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">برنامه کلاس</h2>
              <p className="mt-1 text-sm text-muted">
                جلسات این بازه به‌صورت خودکار ساخته می‌شوند.
              </p>
            </div>
            {model !== "single" && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onPress={() =>
                  setSchedule((items) => [
                    ...items,
                    { dayOfWeek: 6, startTime: "18:00", durationMinutes: 60 },
                  ])
                }
              >
                <Icon name="plus" />
                افزودن زمان
              </Button>
            )}
          </div>
          <div className="mt-4 grid gap-3">
            {schedule.map((row, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-xl bg-default/30 p-3 md:grid-cols-[1fr_1fr_1fr_auto]"
              >
                <Field label="روز">
                  <select
                    value={row.dayOfWeek}
                    onChange={(e) =>
                      setScheduleField(
                        index,
                        "dayOfWeek",
                        Number(e.target.value),
                      )
                    }
                    className={input}
                  >
                    {weekdays.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="ساعت شروع">
                  <input
                    type="time"
                    value={row.startTime}
                    onChange={(e) =>
                      setScheduleField(index, "startTime", e.target.value)
                    }
                    className={input}
                  />
                </Field>
                <Field label="مدت (دقیقه)">
                  <input
                    type="number"
                    min="15"
                    max="480"
                    value={row.durationMinutes}
                    onChange={(e) =>
                      setScheduleField(
                        index,
                        "durationMinutes",
                        Number(e.target.value),
                      )
                    }
                    className={input}
                  />
                </Field>
                {schedule.length > 1 && (
                  <Button
                    type="button"
                    className="self-end"
                    variant="ghost"
                    onPress={() =>
                      setSchedule((items) =>
                        items.filter((_, i) => i !== index),
                      )
                    }
                  >
                    حذف
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
        <div className="flex gap-2">
          <Button
            type="submit"
            variant="primary"
            isPending={create.isPending || update.isPending}
          >
            {initial ? "ذخیره تغییرات" : "ساخت کلاس"}
          </Button>
          <Button type="button" variant="ghost" onPress={() => router.back()}>
            انصراف
          </Button>
        </div>
      </form>
    </Shell>
  );
}

export function BusinessClassFormScreen({
  clubId,
  classId,
}: {
  clubId?: string;
  classId?: string;
}) {
  const item = useBusinessClass(clubId ?? "", classId ?? "");
  if (classId && item.isPending) return <Loading />;
  if (classId && !item.data)
    return (
      <Shell
        title="کلاس پیدا نشد"
        description="دسترسی یا شناسه کلاس را بررسی کنید"
      >
        <Empty>اطلاعات کلاس قابل دریافت نیست.</Empty>
      </Shell>
    );
  return (
    <ClassForm
      key={item.data?.updatedAt ?? "new"}
      initial={item.data}
      fixedClubId={clubId}
    />
  );
}

export function BusinessClassDetailScreen({
  clubId,
  classId,
}: {
  clubId: string;
  classId: string;
}) {
  const item = useBusinessClass(clubId, classId);
  const sessions = useBusinessClassSessions(clubId, classId);
  const enrollments = useBusinessClassEnrollments(clubId, classId);
  const students = useClubStudents(clubId);
  const classes = useBusinessClasses(clubId);
  const coaches = useClubCoachProfiles(clubId);
  const branches = useClubBranches(clubId);
  const enroll = useEnrollStudentInBusinessClass(clubId, classId);
  const updateEnrollment = useUpdateBusinessClassEnrollment(clubId, classId);
  const transfer = useTransferBusinessClassEnrollment(clubId, classId);
  const updateSession = useUpdateBusinessClassSession(clubId, classId);
  const regenerate = useRegenerateBusinessClassSessions(clubId, classId);
  const calendarFeed = useCreateBusinessCalendarFeed(clubId);
  const revokeCalendarFeed = useRevokeBusinessCalendarFeed(clubId);
  const [showEnroll, setShowEnroll] = useState(false);
  const [chosenSession, setChosenSession] = useState("");
  const sessionId =
    chosenSession ||
    sessions.data?.items.find((session) => session.status === "scheduled")
      ?.id ||
    sessions.data?.items[0]?.id ||
    "";
  const checkIn = useGenerateBusinessClassCheckIn(clubId, classId, sessionId);
  const [credential, setCredential] = useState<{
    code: string;
    qrPayload: string;
    expiresAt: string;
  } | null>(null);
  const attendance = useBusinessClassAttendance(clubId, classId, sessionId);
  const recordAttendance = useRecordBusinessClassAttendance(
    clubId,
    classId,
    sessionId,
  );
  const studentMap = useMemo(
    () =>
      new Map(
        (students.data?.items ?? []).map((student) => [student.id, student]),
      ),
    [students.data?.items],
  );
  const coach = coaches.data?.items.find(
    (value) => value.id === item.data?.coachProfileId,
  );
  const branch = branches.data?.items.find(
    (value) => value.id === item.data?.branchId,
  );
  const attendanceMap = useMemo(
    () =>
      new Map(
        (attendance.data?.items ?? []).map((record) => [
          record.studentId,
          record.status,
        ]),
      ),
    [attendance.data?.items],
  );
  if (item.isPending) return <Loading />;
  if (!item.data)
    return (
      <Shell title="کلاس پیدا نشد" description="">
        <Empty>این کلاس وجود ندارد.</Empty>
      </Shell>
    );
  const attendanceEnrollments =
    enrollments.data?.items.filter((value) =>
      ["active", "completed"].includes(value.status),
    ) ?? [];
  const addStudent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await enroll.mutateAsync({
        studentId: String(data.get("studentId")),
        status: String(data.get("status")) as "active" | "waitlisted",
        agreedPrice: Number(data.get("agreedPrice")),
        paymentStatus: String(data.get("paymentStatus")) as
          "pending" | "paid" | "partial" | "waived",
        totalSessions: data.get("totalSessions")
          ? Number(data.get("totalSessions"))
          : null,
      });
      event.currentTarget.reset();
      setShowEnroll(false);
      toast.success("شاگرد به کلاس اضافه شد");
    } catch {
      toast.danger("افزودن شاگرد انجام نشد؛ ممکن است ظرفیت کلاس پر باشد");
    }
  };
  const mark = (studentId: string, status: "present" | "absent" | "excused") =>
    recordAttendance
      .mutateAsync([{ studentId, status, notes: "" }])
      .then(() => toast.success("حضور ثبت شد"))
      .catch(() => toast.danger("ثبت حضور انجام نشد"));
  return (
    <Shell
      title={item.data.title}
      description={`${modelLabels[item.data.model]} · ${item.data.sport || "بدون رشته"}`}
      action={
        <div className="flex gap-2">
          <Button variant="ghost">
            <Link href={`/clubs/${clubId}/classes/${classId}/edit`}>
              ویرایش کلاس
            </Link>
          </Button>
          <Button
            variant="primary"
            onPress={() => setShowEnroll((value) => !value)}
          >
            <Icon name="plus" />
            افزودن شاگرد
          </Button>
          <Button
            variant="secondary"
            isPending={calendarFeed.isPending}
            onPress={async () => {
              try {
                const feed = await calendarFeed.mutateAsync();
                const url = new URL(
                  feed.feedPath,
                  getApiConfig().baseURL,
                ).toString();
                await navigator.clipboard.writeText(url);
                toast.success("لینک تقویم ساخته و کپی شد");
              } catch {
                toast.danger("ساخت لینک تقویم انجام نشد");
              }
            }}
          >
            تقویم اشتراکی
          </Button>
          <Button
            variant="danger-soft"
            isPending={revokeCalendarFeed.isPending}
            onPress={async () => {
              try {
                const result = await revokeCalendarFeed.mutateAsync();
                toast.success(
                  result.revoked
                    ? "دسترسی تقویم لغو شد"
                    : "لینک فعالی برای لغو وجود ندارد",
                );
              } catch {
                toast.danger("لغو دسترسی تقویم انجام نشد");
              }
            }}
          >
            لغو لینک تقویم
          </Button>
        </div>
      }
    >
      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-sm text-muted">ثبت‌نام فعال</p>
          <p className="mt-2 text-2xl font-semibold">
            {item.data.enrollmentCount} / {item.data.capacity}
          </p>
        </Card>
        <Card className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-sm text-muted">مدل مالی</p>
          <p className="mt-2 font-semibold">
            {pricingLabels[item.data.pricingModel]}
          </p>
          <p className="mt-1 text-sm">{money(item.data.price)} ریال</p>
        </Card>
        <Card className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-sm text-muted">مربی</p>
          <p className="mt-2 font-semibold">
            {coach ? `${coach.firstName} ${coach.lastName}` : "تعیین نشده"}
          </p>
        </Card>
        <Card className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-sm text-muted">شعبه</p>
          <p className="mt-2 font-semibold">{branch?.name ?? "تعیین نشده"}</p>
        </Card>
      </section>
      {showEnroll && (
        <Card className="mt-4 rounded-2xl border border-accent/40 bg-surface p-5">
          <form
            onSubmit={addStudent}
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-5"
          >
            <Field label="شاگرد">
              <select required name="studentId" className={input}>
                <option value="">انتخاب شاگرد</option>
                {students.data?.items
                  .filter(
                    (student) =>
                      student.status === "active" &&
                      !enrollments.data?.items.some(
                        (record) =>
                          record.studentId === student.id &&
                          ["active", "waitlisted"].includes(record.status),
                      ),
                  )
                  .map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.firstName} {student.lastName}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="وضعیت">
              <select name="status" className={input}>
                <option value="active">ثبت‌نام فعال</option>
                <option value="waitlisted">لیست انتظار</option>
              </select>
            </Field>
            <Field label="مبلغ توافقی">
              <input
                required
                name="agreedPrice"
                type="number"
                min="0"
                defaultValue={item.data.price}
                className={input}
              />
            </Field>
            <Field label="وضعیت پرداخت">
              <select name="paymentStatus" className={input}>
                <option value="pending">پرداخت‌نشده</option>
                <option value="paid">پرداخت‌شده</option>
                <option value="partial">بخشی پرداخت شده</option>
                <option value="waived">رایگان</option>
              </select>
            </Field>
            <Field label="تعداد جلسات">
              <input
                name="totalSessions"
                type="number"
                min="1"
                defaultValue={item.data.packageSessionCount ?? undefined}
                className={input}
              />
            </Field>
            <div className="flex gap-2 lg:col-span-5">
              <Button
                type="submit"
                variant="primary"
                isPending={enroll.isPending}
              >
                ثبت عضویت
              </Button>
              <Button
                type="button"
                variant="ghost"
                onPress={() => setShowEnroll(false)}
              >
                انصراف
              </Button>
            </div>
          </form>
        </Card>
      )}
      <section className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_1fr]">
        <Card className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">شاگردهای کلاس</h2>
              <p className="mt-1 text-sm text-muted">
                عضویت، پرداخت و انتقال را مدیریت کنید.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-2">
            {enrollments.isPending ? (
              <Loading />
            ) : !enrollments.data?.items.length ? (
              <Empty>هنوز شاگردی عضو این کلاس نیست.</Empty>
            ) : (
              enrollments.data.items.map((enrollment) => {
                const student = studentMap.get(enrollment.studentId);
                return (
                  <div
                    key={enrollment.id}
                    className="rounded-xl bg-default/30 p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">
                          {student
                            ? `${student.firstName} ${student.lastName}`
                            : "شاگرد حذف‌شده"}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          جلسات باقی‌مانده:{" "}
                          {enrollment.remainingSessions ?? "نامحدود"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <select
                          aria-label="وضعیت عضویت"
                          value={enrollment.status}
                          onChange={(e) =>
                            updateEnrollment.mutate({
                              enrollmentId: enrollment.id,
                              payload: {
                                status: e.target
                                  .value as typeof enrollment.status,
                              },
                            })
                          }
                          className="h-9 rounded-lg border border-border bg-surface px-2 text-xs"
                        >
                          <option value="active">فعال</option>
                          <option value="pending">در انتظار تأیید</option>
                          <option value="waitlisted">انتظار</option>
                          <option value="completed">تمام‌شده</option>
                          <option value="cancelled">لغوشده</option>
                        </select>
                        <select
                          aria-label="وضعیت پرداخت"
                          value={enrollment.paymentStatus}
                          onChange={(e) =>
                            updateEnrollment.mutate({
                              enrollmentId: enrollment.id,
                              payload: {
                                paymentStatus: e.target
                                  .value as typeof enrollment.paymentStatus,
                              },
                            })
                          }
                          className="h-9 rounded-lg border border-border bg-surface px-2 text-xs"
                        >
                          <option value="pending">پرداخت‌نشده</option>
                          <option value="paid">پرداخت‌شده</option>
                          <option value="partial">ناقص</option>
                          <option value="waived">رایگان</option>
                          <option value="failed">ناموفق</option>
                          <option value="refunded">بازپرداخت‌شده</option>
                        </select>
                        <select
                          aria-label="انتقال شاگرد"
                          defaultValue=""
                          onChange={(e) => {
                            if (
                              e.target.value &&
                              window.confirm(
                                "شاگرد به کلاس انتخاب‌شده منتقل شود؟",
                              )
                            )
                              transfer.mutate({
                                enrollmentId: enrollment.id,
                                targetClassId: e.target.value,
                              });
                            e.target.value = "";
                          }}
                          className="h-9 rounded-lg border border-border bg-surface px-2 text-xs"
                        >
                          <option value="">انتقال به...</option>
                          {classes.data?.items
                            .filter(
                              (target) =>
                                target.id !== classId &&
                                target.status === "active",
                            )
                            .map((target) => (
                              <option key={target.id} value={target.id}>
                                {target.title}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
        <Card className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">جلسات و حضور</h2>
              <p className="mt-1 text-sm text-muted">
                حضور‌وغیاب به جلسه واقعی متصل است.
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              isPending={regenerate.isPending}
              onPress={() =>
                regenerate
                  .mutateAsync()
                  .then(() => toast.success("جلسات آینده بازسازی شدند"))
              }
            >
              بازسازی جلسات
            </Button>
          </div>
          <Field label="جلسه">
            <select
              className={`${input} mt-4`}
              value={sessionId}
              onChange={(e) => setChosenSession(e.target.value)}
            >
              {sessions.data?.items.map((session) => (
                <option key={session.id} value={session.id}>
                  {dateTime(session.startsAt)} ·{" "}
                  {session.status === "scheduled"
                    ? "برگزارنشده"
                    : session.status === "completed"
                      ? "تمام‌شده"
                      : "لغوشده"}
                </option>
              ))}
            </select>
          </Field>
          {sessionId && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="primary"
                isPending={checkIn.isPending}
                onPress={async () => {
                  try {
                    setCredential(await checkIn.mutateAsync(15));
                  } catch {
                    toast.danger("ساخت کد ورود انجام نشد");
                  }
                }}
              >
                <Icon name="qr-code" /> کد ورود ۱۵ دقیقه‌ای
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onPress={() =>
                  updateSession.mutate({
                    sessionId,
                    payload: { status: "completed" },
                  })
                }
              >
                اتمام جلسه
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onPress={() =>
                  updateSession.mutate({
                    sessionId,
                    payload: { status: "cancelled" },
                  })
                }
              >
                لغو جلسه
              </Button>
            </div>
          )}
          {credential ? (
            <CheckInCredentialCard credential={credential} />
          ) : null}
          <div className="mt-4 grid gap-2">
            {!sessionId ? (
              <Empty>برای این کلاس جلسه‌ای وجود ندارد.</Empty>
            ) : (
              attendanceEnrollments.map((enrollment) => {
                const student = studentMap.get(enrollment.studentId);
                const current = attendanceMap.get(enrollment.studentId);
                return (
                  <div
                    key={enrollment.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-default/30 p-3"
                  >
                    <span className="text-sm font-medium">
                      {student
                        ? `${student.firstName} ${student.lastName}`
                        : "شاگرد"}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant={current === "present" ? "primary" : "ghost"}
                        onPress={() => mark(enrollment.studentId, "present")}
                      >
                        حاضر
                      </Button>
                      <Button
                        size="sm"
                        variant={current === "absent" ? "danger" : "ghost"}
                        onPress={() => mark(enrollment.studentId, "absent")}
                      >
                        غایب
                      </Button>
                      <Button
                        size="sm"
                        variant={current === "excused" ? "secondary" : "ghost"}
                        onPress={() => mark(enrollment.studentId, "excused")}
                      >
                        موجه
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </section>
    </Shell>
  );
}

function CheckInCredentialCard({
  credential,
}: {
  credential: { code: string; qrPayload: string; expiresAt: string };
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvas.current)
      void QRCode.toCanvas(canvas.current, credential.qrPayload, {
        width: 196,
        margin: 1,
        errorCorrectionLevel: "M",
      });
  }, [credential.qrPayload]);
  return (
    <div className="mt-4 grid justify-items-center rounded-2xl border border-accent/30 bg-default/20 p-4 text-center">
      <canvas ref={canvas} className="rounded-xl bg-white p-2" />
      <p className="mt-3 text-xs text-muted">کد جایگزین ورود</p>
      <strong dir="ltr" className="mt-1 text-3xl tracking-[.35em]">
        {credential.code}
      </strong>
      <p className="mt-2 text-xs text-muted">
        اعتبار تا {dateTime(credential.expiresAt)}
      </p>
    </div>
  );
}
