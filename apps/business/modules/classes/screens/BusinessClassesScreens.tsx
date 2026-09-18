"use client";
import { CatalogMultiSelect } from "@repo/ui/catalog-multi-select";
import { MediaPicker } from "@/components/form/MediaPicker";
import { EnrollmentTransfer } from "../components/EnrollmentTransfer";

import { FormSelect, FormOption } from "@repo/ui/form-select";
import { Input as HeroInput, TextArea as HeroTextArea } from "@heroui/react";
import { useSelectedClub } from "@/lib/use-selected-club";
import { AttendanceHistory } from "@/components/attendance-history";
import { IranDateInput } from "@repo/ui/iran-date-input";

import {
  useBusinessClass,
  useBusinessClassAttendance,
  useBusinessClassEnrollments,
  useBusinessClasses,
  useBusinessClassSessions,
  useClubBranches,
  useClubCoachProfiles,
  useClubStudents,
  useCreateBusinessClass,
  useCreateBusinessCalendarFeed,
  useRevokeBusinessCalendarFeed,
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
import { ApiError, getApiConfig, usePublicCatalogResource } from "@api";
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

import {
  createListColumnHelper,
  DataTable,
  ListPagePanel,
} from "@/components/data-table";
import { PanelNumberField } from "@/components/form/PanelNumberField";
import { PanelPriceField } from "@/components/form/PanelPriceField";
import QRCode from "qrcode";

const input = "w-full min-w-0";
const dateTime = (value: string) =>
  new Intl.DateTimeFormat("fa-IR", {
    timeZone: "Asia/Tehran",
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

const classColumnHelper = createListColumnHelper<BusinessTrainingClass>();

const scheduleHint = (item: BusinessTrainingClass) => {
  const first = item.schedule[0];
  if (!first) return "بدون برنامه";
  const day = weekdays.find((entry) => entry.value === first.dayOfWeek)?.label;
  const extra = item.schedule.length > 1 ? ` +${item.schedule.length - 1}` : "";
  return `${day ?? "—"} ${first.startTime}${extra}`;
};

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
    <div className="grid min-h-52 place-items-center rounded-2xl p-8 text-center text-sm text-muted">
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
  const { clubs, clubId, setClubId: setPicked } = useSelectedClub();
  const classes = useBusinessClasses(clubId);
  const [draftFilters, setDraftFilters] = useState({
    query: "",
    status: "" as "" | BusinessClassStatus,
    model: "" as "" | BusinessClassModel,
  });
  const [filters, setFilters] = useState({
    query: "",
    status: "" as "" | BusinessClassStatus,
    model: "" as "" | BusinessClassModel,
  });

  const items = useMemo(() => classes.data?.items ?? [], [classes.data?.items]);
  const filtered = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    return items.filter((item) => {
      if (filters.status && item.status !== filters.status) return false;
      if (filters.model && item.model !== filters.model) return false;
      if (!query) return true;
      return (
        item.title.toLowerCase().includes(query) ||
        item.sport.toLowerCase().includes(query) ||
        item.level.toLowerCase().includes(query)
      );
    });
  }, [filters, items]);

  const filterActiveCount =
    (filters.query.trim() ? 1 : 0) +
    (filters.status ? 1 : 0) +
    (filters.model ? 1 : 0);

  const columns = useMemo(
    () =>
      classColumnHelper.columns([
        classColumnHelper.accessor("title", {
          header: "عنوان",
          cell: (info) => {
            const item = info.row.original;
            return (
              <div className="min-w-0">
                <p className="font-medium">{item.title}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {item.sport || "رشته ثبت نشده"}
                  {item.level ? ` · ${item.level}` : ""}
                </p>
              </div>
            );
          },
        }),
        classColumnHelper.accessor("model", {
          header: "مدل",
          cell: (info) => (
            <Chip size="sm" variant="soft">
              {modelLabels[info.getValue()]}
            </Chip>
          ),
        }),
        classColumnHelper.accessor("status", {
          header: "وضعیت",
          cell: (info) => (
            <Chip
              size="sm"
              color={info.getValue() === "active" ? "success" : "default"}
              variant="soft"
            >
              {statusLabels[info.getValue()]}
            </Chip>
          ),
        }),
        classColumnHelper.display({
          id: "capacity",
          header: "ظرفیت",
          cell: (info) => {
            const item = info.row.original;
            return (
              <span className="tabular-nums">
                {item.enrollmentCount.toLocaleString("fa-IR")} از{" "}
                {item.capacity.toLocaleString("fa-IR")}
              </span>
            );
          },
        }),
        classColumnHelper.display({
          id: "schedule",
          header: "برنامه",
          cell: (info) => (
            <span className="text-sm text-muted">
              {scheduleHint(info.row.original)}
            </span>
          ),
        }),
        classColumnHelper.display({
          id: "actions",
          header: "عملیات",
          cell: (info) => (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="ghost">
                <Link href={`/clubs/${clubId}/classes/${info.row.original.id}`}>
                  جزئیات
                </Link>
              </Button>
              <Button size="sm" variant="secondary">
                <Link
                  href={`/clubs/${clubId}/classes/${info.row.original.id}/edit`}
                >
                  ویرایش
                </Link>
              </Button>
            </div>
          ),
        }),
      ]),
    [clubId],
  );

  return (
    <Shell
      title="کلاس‌ها"
      description="کلاس‌ها، ظرفیت، برنامه و شاگردهای ثبت‌نام‌شده را مدیریت کنید"
      action={
        <div className="flex items-end gap-2">
          <Field label="باشگاه">
            <FormSelect
              aria-label="انتخاب گزینه"
              className={`${input} min-w-52`}
              value={clubId}
              onChange={(e) => setPicked(e)}
            >
              {clubs.data?.items.map((club) => (
                <FormOption entity={club} key={club.id} value={club.id}>
                  {club.name}
                </FormOption>
              ))}
            </FormSelect>
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
      <ListPagePanel
        title="فهرست کلاس‌ها"
        description={`${filtered.length.toLocaleString("fa-IR")} کلاس`}
        filterActiveCount={filterActiveCount}
        filterTitle="فیلتر کلاس‌ها"
        onFilterApply={() => setFilters(draftFilters)}
        onFilterReset={() => {
          const empty = {
            query: "",
            status: "" as const,
            model: "" as const,
          };
          setDraftFilters(empty);
          setFilters(empty);
        }}
        filterContent={
          <>
            <label className="grid gap-1.5 text-sm">
              <span className="text-muted">جست‌وجو</span>
              <HeroInput
                variant="secondary"
                className={input}
                value={draftFilters.query}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    query: event.target.value,
                  }))
                }
                placeholder="عنوان، رشته یا سطح"
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="text-muted">وضعیت</span>
              <FormSelect
                aria-label="انتخاب گزینه"
                className={input}
                value={draftFilters.status}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    status: event as "" | BusinessClassStatus,
                  }))
                }
              >
                <FormOption value="">همه</FormOption>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <FormOption key={value} value={value}>
                    {label}
                  </FormOption>
                ))}
              </FormSelect>
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="text-muted">مدل کلاس</span>
              <FormSelect
                aria-label="انتخاب گزینه"
                className={input}
                value={draftFilters.model}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    model: event as "" | BusinessClassModel,
                  }))
                }
              >
                <FormOption value="">همه</FormOption>
                {Object.entries(modelLabels).map(([value, label]) => (
                  <FormOption key={value} value={value}>
                    {label}
                  </FormOption>
                ))}
              </FormSelect>
            </label>
          </>
        }
      >
        <DataTable
          ariaLabel="فهرست کلاس‌ها"
          data={filtered}
          columns={columns}
          getRowId={(row) => row.id}
          rowHeaderColumnId="title"
          isLoading={classes.isPending}
          emptyContent={
            <Empty>
              <div>
                <Icon name="calendar-plus" size={28} />
                <p className="mt-3">
                  هنوز کلاسی برای این باشگاه ساخته نشده است.
                </p>
              </div>
            </Empty>
          }
        />
      </ListPagePanel>
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
  const {
    clubs,
    clubId: preferredClubId,
    setClubId: setClubChoice,
  } = useSelectedClub();
  const clubId = fixedClubId || preferredClubId;
  const coaches = useClubCoachProfiles(clubId);
  const branches = useClubBranches(clubId);
  const levels = usePublicCatalogResource("sports", "skill-level", {
    limit: 100,
  });
  const sports = usePublicCatalogResource("sports", "sport", { limit: 100 });
  const equipment = usePublicCatalogResource("facilities", "equipment", {
    limit: 100,
  });
  const amenities = usePublicCatalogResource("facilities", "amenity", {
    limit: 100,
  });
  const [coverMediaIds, setCoverMediaIds] = useState<string[]>(
    initial?.coverMediaId ? [initial.coverMediaId] : [],
  );
  const [galleryMediaIds, setGalleryMediaIds] = useState<string[]>(
    initial?.galleryMediaIds ?? [],
  );
  const [requiredEquipmentIds, setRequiredEquipmentIds] = useState<string[]>(
    initial?.requiredEquipmentIds ?? [],
  );
  const [amenityIds, setAmenityIds] = useState<string[]>(
    initial?.amenityIds ?? [],
  );
  const [coverBusy, setCoverBusy] = useState(false);
  const [galleryBusy, setGalleryBusy] = useState(false);
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
  const [saveError, setSaveError] = useState("");
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveError("");
    if (!schedule.length) {
      setSaveError("حداقل یک زمان در بخش برنامهٔ کلاس اضافه کنید.");
      return;
    }
    if (coverBusy || galleryBusy) return;
    const data = new FormData(event.currentTarget);
    const payload: BusinessClassPayload = {
      title: String(data.get("title")),
      description: String(data.get("description")),
      faqs: parseFaqRows(String(data.get("faqs") ?? "")),
      sport: String(data.get("sport") ?? initial?.sport ?? ""),
      skillLevelId: String(data.get("skillLevelId")) || null,
      level:
        levels.data?.items.find(
          (item) => item.id === String(data.get("skillLevelId")),
        )?.name ??
        initial?.level ??
        "",
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
      coverMediaId: coverMediaIds[0] ?? null,
      galleryMediaIds,
      prerequisites: parseLineList(String(data.get("prerequisites") ?? "")),
      requiredEquipmentIds,
      amenityIds,
      minAge: data.get("minAge") === "" ? null : Number(data.get("minAge")),
      maxAge: data.get("maxAge") === "" ? null : Number(data.get("maxAge")),
      registrationStartAt: localDateTime(
        String(data.get("registrationStartAt") ?? ""),
      ),
      registrationEndAt: localDateTime(
        String(data.get("registrationEndAt") ?? ""),
      ),
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
    } catch (error) {
      const message =
        error instanceof ApiError && error.code !== "VALIDATION_ERROR"
          ? error.message
          : "ذخیرهٔ کلاس انجام نشد. تاریخ‌ها، برنامه، ظرفیت و محدودیت سنی را بررسی کنید و دوباره ذخیره کنید.";
      setSaveError(message);
      toast.danger(message);
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
      description="اطلاعات اصلی و برنامه کلاس را وارد کنید؛ جزئیات تکمیلی را می‌توانید بعداً اضافه کنید."
    >
      <form onSubmit={save} className="mt-6 grid gap-5">
        <Card className="grid gap-4 app-card shadow-none active:scale-100 p-5 md:grid-cols-2 lg:grid-cols-3">
          {!fixedClubId && (
            <Field label="باشگاه">
              <FormSelect
                aria-label="انتخاب گزینه"
                required
                className={input}
                value={clubId}
                onChange={(e) => setClubChoice(e)}
              >
                {clubs.data?.items.map((club) => (
                  <FormOption entity={club} key={club.id} value={club.id}>
                    {club.name}
                  </FormOption>
                ))}
              </FormSelect>
            </Field>
          )}
          <Field label="نام کلاس">
            <HeroInput
              variant="secondary"
              required
              minLength={2}
              name="title"
              defaultValue={initial?.title}
              className={input}
            />
          </Field>
          <Field label="رشته">
            <FormSelect
              name="sport"
              aria-label="رشته"
              defaultValue={initial?.sport ?? ""}
              disabled={sports.isPending || sports.isError}
            >
              <FormOption value="">انتخاب رشته</FormOption>
              {initial?.sport &&
                !sports.data?.items.some(
                  (item) => item.name === initial.sport,
                ) && (
                  <FormOption value={initial.sport}>{initial.sport}</FormOption>
                )}
              {sports.data?.items.map((item) => (
                <FormOption key={item.id} value={item.name}>
                  {item.name}
                </FormOption>
              ))}
            </FormSelect>
            {sports.isError && (
              <Button
                type="button"
                variant="ghost"
                onPress={() => void sports.refetch()}
              >
                دریافت دوباره رشته‌ها
              </Button>
            )}
          </Field>
          <Field label="سطح">
            <FormSelect
              aria-label="سطح کلاس"
              name="skillLevelId"
              defaultValue={initial?.skillLevelId ?? ""}
              className={input}
            >
              <FormOption value="">تعیین نشده</FormOption>
              {initial?.skillLevelId &&
              !levels.data?.items.some(
                (item) => item.id === initial.skillLevelId,
              ) ? (
                <FormOption value={initial.skillLevelId}>
                  {initial.level || "سطح ثبت‌شده"}
                </FormOption>
              ) : null}
              {levels.data?.items.map((item) => (
                <FormOption entity={item} key={item.id} value={item.id}>
                  {item.name}
                </FormOption>
              ))}
            </FormSelect>
          </Field>
          <Field label="مدل کلاس">
            <FormSelect
              aria-label="انتخاب گزینه"
              className={input}
              value={model}
              onChange={(e) => setModel(e as BusinessClassModel)}
            >
              {Object.entries(modelLabels).map(([value, label]) => (
                <FormOption key={value} value={value}>
                  {label}
                </FormOption>
              ))}
            </FormSelect>
          </Field>
          <Field label="ظرفیت">
            <PanelNumberField
              name="capacity"
              minValue={1}
              maxValue={model === "private" ? 4 : 1000}
              defaultValue={initial?.capacity ?? (model === "private" ? 1 : 12)}
              isRequired
              aria-label="ظرفیت"
            />
          </Field>
          <Field label="مربی">
            <FormSelect
              aria-label="مربی کلاس"
              name="coachProfileId"
              defaultValue={initial?.coachProfileId ?? ""}
              className={input}
            >
              <FormOption value="">بدون مربی</FormOption>
              {coaches.data?.items.map((coach) => (
                <FormOption entity={coach} key={coach.id} value={coach.id}>
                  {coach.firstName} {coach.lastName}
                </FormOption>
              ))}
            </FormSelect>
          </Field>
          <Field label="شعبه">
            <FormSelect
              aria-label="شعبه کلاس"
              name="branchId"
              defaultValue={initial?.branchId ?? ""}
              className={input}
            >
              <FormOption value="">بدون شعبه</FormOption>
              {branches.data?.items.map((branch) => (
                <FormOption entity={branch} key={branch.id} value={branch.id}>
                  {branch.name}
                </FormOption>
              ))}
            </FormSelect>
          </Field>
        </Card>
        <details className="rounded-3xl bg-surface p-5">
          <summary className="cursor-pointer py-2 font-bold">
            تصاویر و جزئیات تکمیلی (اختیاری)
          </summary>
          <p className="mt-2 text-sm text-muted">
            توضیحات، امکانات، محدودیت سنی و تصاویر کلاس
          </p>
          <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <Field label="وضعیت">
              <FormSelect
                aria-label="وضعیت کلاس"
                name="status"
                defaultValue={initial?.status ?? "draft"}
                className={input}
              >
                {Object.entries(statusLabels).map(([value, label]) => (
                  <FormOption key={value} value={value}>
                    {label}
                  </FormOption>
                ))}
              </FormSelect>
            </Field>
            <Field label="نمایش در اپ ورزشکار">
              <FormSelect
                aria-label="نمایش در اپ ورزشکار"
                name="visibility"
                defaultValue={initial?.visibility ?? "public"}
                className={input}
              >
                <FormOption value="public">عمومی و قابل ثبت‌نام</FormOption>
                <FormOption value="private">
                  خصوصی و فقط مدیریت باشگاه
                </FormOption>
              </FormSelect>
            </Field>
            <Field label="روش تأیید ثبت‌نام">
              <FormSelect
                aria-label="روش تأیید ثبت‌نام"
                name="enrollmentMode"
                defaultValue={initial?.enrollmentMode ?? "automatic"}
                className={input}
              >
                <FormOption value="automatic">خودکار پس از پرداخت</FormOption>
                <FormOption value="requires_approval">
                  نیازمند تأیید باشگاه
                </FormOption>
              </FormSelect>
            </Field>

            <div className="md:col-span-2 lg:col-span-3">
              <Field label="توضیحات">
                <HeroTextArea
                  variant="secondary"
                  name="description"
                  defaultValue={initial?.description}
                  className={`${input} h-24 py-3`}
                />
              </Field>
            </div>
            <Field label="حداقل سن">
              <PanelNumberField
                name="minAge"
                minValue={0}
                maxValue={120}
                defaultValue={initial?.minAge ?? undefined}
                aria-label="حداقل سن"
              />
            </Field>
            <Field label="حداکثر سن">
              <PanelNumberField
                name="maxAge"
                minValue={0}
                maxValue={120}
                defaultValue={initial?.maxAge ?? undefined}
                aria-label="حداکثر سن"
              />
            </Field>
            <div className="md:col-span-2 lg:col-span-3 grid gap-5 sm:grid-cols-2">
              <MediaPicker
                label="کاور کلاس"
                value={coverMediaIds}
                onChange={setCoverMediaIds}
                limit={1}
                onBusyChange={setCoverBusy}
              />
              <MediaPicker
                label="تصاویر گالری"
                value={galleryMediaIds}
                onChange={setGalleryMediaIds}
                onBusyChange={setGalleryBusy}
              />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <Field label="پیش‌نیازها (هر خط یک مورد)">
                <HeroTextArea
                  variant="secondary"
                  name="prerequisites"
                  defaultValue={initial?.prerequisites.join("\n")}
                  className={`${input} min-h-24 py-3`}
                />
              </Field>
            </div>
            <div className="md:col-span-2 lg:col-span-3 grid gap-5 sm:grid-cols-2">
              <CatalogMultiSelect
                label="تجهیزات لازم"
                options={equipment.data?.items ?? []}
                value={requiredEquipmentIds}
                onChange={setRequiredEquipmentIds}
                isPending={equipment.isPending}
                isError={equipment.isError}
                onRetry={() => void equipment.refetch()}
              />
              <CatalogMultiSelect
                label="امکانات کلاس"
                options={amenities.data?.items ?? []}
                value={amenityIds}
                onChange={setAmenityIds}
                isPending={amenities.isPending}
                isError={amenities.isError}
                onRetry={() => void amenities.refetch()}
              />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <Field label="سوالات متداول">
                <HeroTextArea
                  variant="secondary"
                  name="faqs"
                  defaultValue={initial?.faqs
                    ?.map((item) => `${item.question} | ${item.answer}`)
                    .join("\n")}
                  className={`${input} min-h-28 py-3`}
                  placeholder="هر خط: سوال | پاسخ"
                />
              </Field>
            </div>
          </div>
        </details>
        <Card className="grid gap-4 app-card shadow-none active:scale-100 p-5 md:grid-cols-2 lg:grid-cols-4">
          <h2 className="col-span-full font-bold">هزینه و بازه برگزاری</h2>
          <Field label="مدل پرداخت">
            <FormSelect
              aria-label="انتخاب گزینه"
              className={input}
              value={pricingModel}
              onChange={(e) => setPricingModel(e as BusinessClassPricingModel)}
            >
              {Object.entries(pricingLabels).map(([value, label]) => (
                <FormOption key={value} value={value}>
                  {label}
                </FormOption>
              ))}
            </FormSelect>
          </Field>
          <Field label="مبلغ (ریال)">
            <PanelPriceField
              name="price"
              minValue={0}
              defaultValue={initial?.price ?? 0}
              isRequired
              aria-label="مبلغ (ریال)"
            />
          </Field>
          {pricingModel === "package" && (
            <Field label="تعداد جلسات پکیج">
              <PanelNumberField
                name="packageSessionCount"
                minValue={1}
                defaultValue={initial?.packageSessionCount ?? 8}
                isRequired
                aria-label="تعداد جلسات پکیج"
              />
            </Field>
          )}
          <Field label="شروع دوره">
            <IranDateInput
              required
              name="startDate"

              defaultValue={initial?.startDate}
              className={input}
            />
          </Field>
          <Field label="پایان دوره">
            <IranDateInput
              required
              name="endDate"

              defaultValue={initial?.endDate}
              className={input}
            />
          </Field>
          <Field label="شروع ثبت‌نام">
            <IranDateInput
              withTime
              name="registrationStartAt"
              defaultValue={toLocalInput(initial?.registrationStartAt)}
              className={input}
            />
          </Field>
          <Field label="پایان ثبت‌نام">
            <IranDateInput
              withTime
              name="registrationEndAt"
              defaultValue={toLocalInput(initial?.registrationEndAt)}
              className={input}
            />
          </Field>
        </Card>
        <Card className="app-card shadow-none active:scale-100 p-5">
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
                  <FormSelect
                    aria-label="انتخاب گزینه"
                    value={row.dayOfWeek}
                    onChange={(e) =>
                      setScheduleField(index, "dayOfWeek", Number(e))
                    }
                    className={input}
                  >
                    {weekdays.map((day) => (
                      <FormOption key={day.value} value={day.value}>
                        {day.label}
                      </FormOption>
                    ))}
                  </FormSelect>
                </Field>
                <Field label="ساعت شروع">
                  <HeroInput
                    variant="secondary"
                    type="time"
                    dir="ltr"
                    value={row.startTime}
                    onChange={(e) =>
                      setScheduleField(index, "startTime", e.target.value)
                    }
                    className={input}
                  />
                </Field>
                <Field label="مدت (دقیقه)">
                  <PanelNumberField
                    minValue={15}
                    maxValue={480}
                    value={row.durationMinutes}
                    onChange={(next) =>
                      setScheduleField(index, "durationMinutes", next)
                    }
                    aria-label="مدت (دقیقه)"
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
        {saveError ? (
          <p
            role="alert"
            className="rounded-2xl bg-danger/10 p-4 text-sm leading-7 text-danger"
          >
            {saveError}
          </p>
        ) : null}
        <div className="flex gap-2">
          <Button
            type="submit"
            variant="primary"
            isPending={create.isPending || update.isPending}
            isDisabled={coverBusy || galleryBusy}
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

function parseLineList(value: string) {
  return value
    .split(/\n|،|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}
function localDateTime(value: string) {
  return value ? new Date(value).toISOString() : null;
}
function toLocalInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
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
  const updateEnrollment = useUpdateBusinessClassEnrollment(clubId, classId);
  const transfer = useTransferBusinessClassEnrollment(clubId, classId);
  const updateSession = useUpdateBusinessClassSession(clubId, classId);
  const regenerate = useRegenerateBusinessClassSessions(clubId, classId);
  const calendarFeed = useCreateBusinessCalendarFeed(clubId);
  const revokeCalendarFeed = useRevokeBusinessCalendarFeed(clubId);
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
  const mark = (
    studentId: string,
    status: "present" | "absent" | "excused",
    checkedOut = false,
  ) =>
    recordAttendance
      .mutateAsync([
        {
          studentId,
          status,
          checkedOut,
          notes:
            attendance.data?.items.find((row) => row.studentId === studentId)
              ?.notes ?? "",
        },
      ])
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
          <Button variant="primary">
            <Link href={`/clubs/${clubId}/classes/${classId}/enroll`}>
              افزودن شاگرد
            </Link>
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
        <Card className="app-card shadow-none active:scale-100 p-4">
          <p className="text-sm text-muted">ثبت‌نام فعال</p>
          <p className="mt-2 text-2xl font-semibold">
            {item.data.enrollmentCount} / {item.data.capacity}
          </p>
        </Card>
        <Card className="app-card shadow-none active:scale-100 p-4">
          <p className="text-sm text-muted">مدل مالی</p>
          <p className="mt-2 font-semibold">
            {pricingLabels[item.data.pricingModel]}
          </p>
          <p className="mt-1 text-sm">{money(item.data.price)} ریال</p>
        </Card>
        <Card className="app-card shadow-none active:scale-100 p-4">
          <p className="text-sm text-muted">مربی</p>
          <p className="mt-2 font-semibold">
            {coach ? `${coach.firstName} ${coach.lastName}` : "تعیین نشده"}
          </p>
        </Card>
        <Card className="app-card shadow-none active:scale-100 p-4">
          <p className="text-sm text-muted">شعبه</p>
          <p className="mt-2 font-semibold">{branch?.name ?? "تعیین نشده"}</p>
        </Card>
      </section>
      {item.data.readiness && !item.data.readiness.ready ? (
        <Card className="mt-4 rounded-2xl bg-warning/8 p-4 shadow-none">
          <strong>موارد پیشنهادی پیش از عرضه عمومی</strong>
          <p className="mt-2 text-sm text-muted">
            {item.data.readiness.missing
              .map(
                (key) =>
                  ({
                    title: "عنوان",
                    description: "توضیحات",
                    skillLevelId: "سطح",
                    minAge: "حداقل سن",
                    maxAge: "حداکثر سن",
                    branchId: "شعبه",
                    media: "تصویر",
                    schedule: "برنامه",
                  })[key] ?? key,
              )
              .join("، ")}
          </p>
        </Card>
      ) : null}
      <section className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_1fr]">
        <Card className="app-card shadow-none active:scale-100 p-5">
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
                        <FormSelect
                          aria-label="وضعیت عضویت"
                          value={enrollment.status}
                          onChange={(e) =>
                            updateEnrollment.mutate(
                              {
                                enrollmentId: enrollment.id,
                                payload: {
                                  status: e as typeof enrollment.status,
                                },
                              },
                              {
                                onError: () =>
                                  toast.danger(
                                    "تغییر وضعیت انجام نشد؛ دوباره تلاش کنید.",
                                  ),
                              },
                            )
                          }
                          disabled={updateEnrollment.isPending}
                          className="h-9 rounded-lg border border-border bg-surface px-2 text-xs"
                        >
                          <FormOption value="active">فعال</FormOption>
                          <FormOption value="pending">
                            در انتظار تأیید
                          </FormOption>
                          <FormOption value="waitlisted">انتظار</FormOption>
                          <FormOption value="completed">تمام‌شده</FormOption>
                          {!enrollment.transferRequiresRefund ? (
                            <FormOption value="cancelled">لغوشده</FormOption>
                          ) : null}
                        </FormSelect>
                        <a
                          className="rounded-lg px-3 py-2 text-xs"
                          href={`/payments?studentId=${enrollment.studentId}`}
                        >
                          حساب شهریه و رسیدها
                        </a>
                        <EnrollmentTransfer
                          enrollment={enrollment}
                          classes={classes.data?.items ?? []}
                          onRefund={() =>
                            updateEnrollment.mutateAsync({
                              enrollmentId: enrollment.id,
                              payload: { status: "cancelled" },
                            })
                          }
                          onTransfer={(targetClassId) =>
                            transfer.mutateAsync({
                              enrollmentId: enrollment.id,
                              targetClassId,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
        <Card className="app-card shadow-none active:scale-100 p-5">
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
            <FormSelect
              aria-label="انتخاب گزینه"
              className={`${input} mt-4`}
              value={sessionId}
              onChange={(e) => setChosenSession(e)}
            >
              {sessions.data?.items.map((session) => (
                <FormOption
                  entity={session}
                  key={session.id}
                  value={session.id}
                >
                  {dateTime(session.startsAt)} ·{" "}
                  {session.status === "scheduled"
                    ? "برگزارنشده"
                    : session.status === "completed"
                      ? "تمام‌شده"
                      : "لغوشده"}
                </FormOption>
              ))}
            </FormSelect>
          </Field>
          {sessions.data?.items.find((session) => session.id === sessionId)
            ?.status === "scheduled" && (
            <Field label="مربی جانشین این جلسه">
              <FormSelect
                aria-label="مربی جانشین این جلسه"
                value={
                  sessions.data?.items.find(
                    (session) => session.id === sessionId,
                  )?.substituteCoachId ?? ""
                }
                disabled={updateSession.isPending}
                onChange={async (value) => {
                  try {
                    await updateSession.mutateAsync({
                      sessionId,
                      payload: { substituteCoachId: value || null },
                    });
                    toast.success("مربی جلسه به‌روز شد");
                  } catch {
                    toast.danger(
                      "تغییر مربی انجام نشد؛ مربی فعال و جلسه آینده را انتخاب کنید.",
                    );
                  }
                }}
              >
                <FormOption value="">مربی اصلی کلاس</FormOption>
                {coaches.data?.items
                  .filter((coach) => coach.status === "active")
                  .map((coach) => (
                    <FormOption key={coach.id} value={coach.id}>
                      {coach.firstName} {coach.lastName}
                    </FormOption>
                  ))}
              </FormSelect>
              <p className="mt-2 text-xs text-muted">
                این انتخاب فقط برای همین جلسه است. دسترسی‌های مربی از بخش اعضای
                تیم مدیریت می‌شود.
              </p>
            </Field>
          )}
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
              <Button size="sm" variant="secondary">
                <Link
                  href={`/clubs/${clubId}/classes/${classId}/sessions/${sessionId}/reschedule`}
                >
                  جابه‌جایی زمان
                </Link>
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
                        isDisabled={recordAttendance.isPending}
                        onPress={() => mark(enrollment.studentId, "present")}
                      >
                        حاضر
                      </Button>
                      <Button
                        size="sm"
                        variant={current === "absent" ? "danger" : "ghost"}
                        isDisabled={recordAttendance.isPending}
                        onPress={() => mark(enrollment.studentId, "absent")}
                      >
                        غایب
                      </Button>
                      <Button
                        size="sm"
                        variant={current === "excused" ? "secondary" : "ghost"}
                        isDisabled={recordAttendance.isPending}
                        onPress={() => mark(enrollment.studentId, "excused")}
                      >
                        موجه
                      </Button>
                    </div>
                    {current === "present" ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        isDisabled={
                          recordAttendance.isPending ||
                          Boolean(
                            attendance.data?.items.find(
                              (row) => row.studentId === enrollment.studentId,
                            )?.checkedOutAt,
                          )
                        }
                        onPress={() =>
                          mark(enrollment.studentId, "present", true)
                        }
                      >
                        {attendance.data?.items.find(
                          (row) => row.studentId === enrollment.studentId,
                        )?.checkedOutAt
                          ? "خروج ثبت شده"
                          : "ثبت خروج"}
                      </Button>
                    ) : null}
                    <AttendanceHistory
                      changes={
                        attendance.data?.items.find(
                          (row) => row.studentId === enrollment.studentId,
                        )?.changes
                      }
                    />
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
    <div className="mt-4 grid justify-items-center rounded-2xl bg-default/20 p-4 text-center">
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
