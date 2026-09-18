"use client";
import { useRecordOnSiteReservationPayment } from "@api";

import { FormSelect, FormOption } from "@repo/ui/form-select";
import { Input as HeroInput } from "@heroui/react";
import { IranDateInput } from "@repo/ui/iran-date-input";
import { tehranLocalDate } from "@repo/ui/iran-date";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button, Card, Checkbox, Spinner, toast } from "@heroui/react";
import { getDayOfWeek, parseDate } from "@internationalized/date";
import { useRouter } from "next/navigation";
import {
  useBusinessCatalog,
  useBusinessClub,
  useBusinessSessions,
  useCancelBusinessSession,
  useClubReservations,
  useCompleteSession,
  useMarkClubReservationNoShow,
  useReservableClubClasses,
  useClubCoaches,
  useClubCourts,
  useCreateSession,
} from "@api/business";
import { useTranslations } from "next-intl";

import { PanelSectionSwitcher } from "@repo/ui/panel-section-switcher";
import { useConfirmActionDialog } from "@repo/ui/confirm-action-dialog";
import type { ReservableSession } from "@api/business";
import Link from "next/link";
import { CourtEditor } from "../components/CourtEditor";

import { PanelNumberField } from "@/components/form/PanelNumberField";
import { PanelPriceField } from "@/components/form/PanelPriceField";

const input = "w-full min-w-0";
const sessionStatusLabels = {
  active: "فعال",
  completed: "برگزارشده",
  cancelled: "لغوشده",
};
const WEEKDAY_OPTIONS = [
  { index: 0, label: "شنبه" },
  { index: 1, label: "یکشنبه" },
  { index: 2, label: "دوشنبه" },
  { index: 3, label: "سه‌شنبه" },
  { index: 4, label: "چهارشنبه" },
  { index: 5, label: "پنج‌شنبه" },
  { index: 6, label: "جمعه" },
] as const;

const parseTimeOfDay = (value: string) => {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
};

const formatCivilTime = (hour: number, minute: number) =>
  `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

const tehranWeekdayIndex = (civilDate: string) =>
  getDayOfWeek(parseDate(civilDate), "fa-IR", "sat");

const isWeekendCivilDate = (civilDate: string) => {
  const day = tehranWeekdayIndex(civilDate);
  return day === 0 || day === 6;
};

type BulkSlotPreview = {
  civilDate: string;
  dayLabel: string;
  startsAt: string;
  endsAt: string;
  price: number;
};

const localDateTime = (value: string) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const part = (name: string) => parts.find((p) => p.type === name)?.value;
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
};

type OptionDraft = {
  type: "equipment" | "amenity";
  resourceId: string;
  availableQuantity: number;
  maxPerReservation: number;
  unitPrice: number;
};

const paymentStatusLabels: Record<string, string> = {
  not_required: "رایگان",
  pending: "در انتظار پرداخت",
  pay_on_arrival: "پرداخت در پذیرش",
  paid: "پرداخت‌شده",
  refunded: "بازپرداخت‌شده",
  failed: "پرداخت ناموفق",
};

export function ReservationManagementScreen({
  clubId,
  formPage,
  editCourtId,
  copySessionId,
}: {
  clubId: string;
  formPage?: "session" | "court";
  editCourtId?: string;
  copySessionId?: string;
}) {
  const router = useRouter();
  const t = useTranslations("businessReservations");
  const club = useBusinessClub(clubId);
  const courts = useClubCourts(clubId);
  const sessions = useBusinessSessions(clubId);
  const reservations = useClubReservations(clubId);
  const onSitePayment = useRecordOnSiteReservationPayment(clubId);
  const coaches = useClubCoaches(clubId);
  const classes = useReservableClubClasses(clubId);
  const equipmentCatalog = useBusinessCatalog("facilities", "equipment");
  const amenitiesCatalog = useBusinessCatalog("facilities", "amenity");
  const createSession = useCreateSession(clubId);
  const completeSession = useCompleteSession(clubId);
  const cancelSession = useCancelBusinessSession(clubId);
  const markNoShow = useMarkClubReservationNoShow(clubId);
  const confirmation = useConfirmActionDialog();
  const [section, setSection] = useState("sessions");
  const [formError, setFormError] = useState("");
  const [formInitialized, setFormInitialized] = useState(false);
  const [reservationSessionId, setReservationSessionId] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [courtFilter, setCourtFilter] = useState("");
  const [occupancyFilter, setOccupancyFilter] = useState<"all" | "empty">(
    "all",
  );
  const [title, setTitle] = useState("");
  const [courtId, setCourtId] = useState("");
  const [coachId, setCoachId] = useState("");
  const [classId, setClassId] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [capacityManual, setCapacityManual] = useState(false);
  const [capacity, setCapacity] = useState(1);
  const [basePrice, setBasePrice] = useState(0);
  const [bulkWeekdays, setBulkWeekdays] = useState<Record<number, boolean>>({
    0: true,
    1: true,
    2: true,
    3: true,
    4: true,
    5: true,
    6: false,
  });
  const [bulkDurationMinutes, setBulkDurationMinutes] = useState(90);
  const [bulkStartTime, setBulkStartTime] = useState("18:00");
  const [bulkScheduleMode, setBulkScheduleMode] = useState<"count" | "until">(
    "count",
  );
  const [bulkSessionsPerDay, setBulkSessionsPerDay] = useState(4);
  const [bulkEndTime, setBulkEndTime] = useState("22:00");
  const [bulkWeekendMultiplier, setBulkWeekendMultiplier] = useState(1.2);
  const [bulkDateFrom, setBulkDateFrom] = useState("");
  const [bulkDateTo, setBulkDateTo] = useState("");
  const [bulkCreating, setBulkCreating] = useState(false);
  const [pricingUnit, setPricingUnit] = useState<
    "per_participant" | "per_session" | "per_court"
  >("per_participant");
  const [policyId, setPolicyId] = useState("");
  const [options, setOptions] = useState<OptionDraft[]>([]);

  const openNewSession = (source?: ReservableSession) => {
    setFormError("");
    setTitle(source?.title ?? "");
    setCourtId(source?.courtId ?? "");
    setCoachId(source?.coachId ?? "");
    setClassId(source?.classId ?? "");
    setCapacityManual(Boolean(source));
    setCapacity(source?.capacity ?? 1);
    setBasePrice(source?.basePrice ?? 0);
    setPricingUnit(source?.pricingUnit ?? "per_participant");
    const policies =
      club.data?.cancellationRules.filter((p) => p.isActive !== false) ?? [];
    setPolicyId(
      source && policies.some((p) => p.id === source.cancellationPolicy.id)
        ? (source.cancellationPolicy.id ?? "")
        : policies.length === 1
          ? (policies[0]!.id ?? "")
          : "",
    );
    setOptions(
      source?.options.map(
        ({
          type,
          resourceId,
          availableQuantity,
          maxPerReservation,
          unitPrice,
        }) => ({
          type,
          resourceId,
          availableQuantity,
          maxPerReservation,
          unitPrice,
        }),
      ) ?? [],
    );
    // Dates must be chosen explicitly when copying; no accidental overlapping sale.
    setStartsAt("");
    setEndsAt("");
  };
  useEffect(() => {
    if (
      formPage !== "session" ||
      formInitialized ||
      !club.data ||
      !sessions.data
    )
      return;
    const source = copySessionId
      ? sessions.data.items.find((item) => item.id === copySessionId)
      : undefined;
    openNewSession(source);
    setFormInitialized(true);
  }, [formPage, formInitialized, club.data, sessions.data, copySessionId]);
  const visibleSessions = (sessions.data?.items ?? [])
    .filter(
      (item) =>
        (!query.trim() || item.title.includes(query.trim())) &&
        (statusFilter === "all" || item.status === statusFilter) &&
        (!courtFilter || item.courtId === courtFilter) &&
        (occupancyFilter === "all" || item.reservedCount === 0),
    )
    .sort(
      (a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
    );

  const selectedCourt = courts.data?.items.find((c) => c.id === courtId);
  const resolveSessionCapacity = () => {
    if (capacityManual && capacity >= 1) return capacity;
    return selectedCourt?.capacity ?? 12;
  };
  const autoCapacityLabel = (
    selectedCourt?.capacity ?? 12
  ).toLocaleString("fa-IR");

  const bulkSlotPreview = useMemo((): BulkSlotPreview[] => {
    if (!bulkDateFrom || !bulkDateTo || !title.trim()) return [];
    let fromDate: ReturnType<typeof parseDate>;
    let toDate: ReturnType<typeof parseDate>;
    try {
      fromDate = parseDate(bulkDateFrom);
      toDate = parseDate(bulkDateTo);
    } catch {
      return [];
    }
    if (fromDate.compare(toDate) > 0) return [];
    const startTime = parseTimeOfDay(bulkStartTime);
    if (!startTime || bulkDurationMinutes < 1) return [];
    const endLimit =
      bulkScheduleMode === "until" ? parseTimeOfDay(bulkEndTime) : null;
    if (bulkScheduleMode === "until" && !endLimit) return [];

    const slots: BulkSlotPreview[] = [];
    let current = fromDate;
    while (current.compare(toDate) <= 0) {
      const civilDate = current.toString();
      if (bulkWeekdays[tehranWeekdayIndex(civilDate)]) {
        const dayLabel = new Intl.DateTimeFormat("fa-IR", {
          timeZone: "Asia/Tehran",
          weekday: "long",
          month: "short",
          day: "numeric",
        }).format(tehranLocalDate(`${civilDate}T12:00`));
        const priceMultiplier = isWeekendCivilDate(civilDate)
          ? bulkWeekendMultiplier
          : 1;
        const slotPrice = Math.round(basePrice * priceMultiplier);

        const addSlot = (hour: number, minute: number) => {
          const startsAtLocal = `${civilDate}T${formatCivilTime(hour, minute)}`;
          const startMs = tehranLocalDate(startsAtLocal).getTime();
          const endMs = startMs + bulkDurationMinutes * 60_000;
          if (Number.isNaN(startMs)) return;
          slots.push({
            civilDate,
            dayLabel,
            startsAt: startsAtLocal,
            endsAt: localDateTime(new Date(endMs).toISOString()),
            price: slotPrice,
          });
        };

        if (bulkScheduleMode === "count") {
          let hour = startTime.hour;
          let minute = startTime.minute;
          for (let i = 0; i < bulkSessionsPerDay; i += 1) {
            addSlot(hour, minute);
            minute += bulkDurationMinutes;
            hour += Math.floor(minute / 60);
            minute %= 60;
          }
        } else {
          let cursorMinutes = startTime.hour * 60 + startTime.minute;
          const endMinutes = endLimit!.hour * 60 + endLimit!.minute;
          while (cursorMinutes + bulkDurationMinutes <= endMinutes) {
            addSlot(
              Math.floor(cursorMinutes / 60),
              cursorMinutes % 60,
            );
            cursorMinutes += bulkDurationMinutes;
          }
        }
      }
      current = current.add({ days: 1 });
    }
    return slots;
  }, [
    bulkDateFrom,
    bulkDateTo,
    bulkWeekdays,
    bulkDurationMinutes,
    bulkStartTime,
    bulkScheduleMode,
    bulkSessionsPerDay,
    bulkEndTime,
    bulkWeekendMultiplier,
    basePrice,
    title,
  ]);

  const defaultDuration = selectedCourt
    ? Math.min(
        selectedCourt.maximumReservationMinutes,
        Math.max(60, selectedCourt.minimumReservationMinutes),
      )
    : 60;

  const sessionMutationErrorMessage = (error: unknown) => {
    const messages: Record<string, string> = {
      COURT_SESSION_OVERLAP:
        "این زمین در زمان انتخاب‌شده سانس دیگری دارد. زمان را تغییر دهید.",
      SESSION_EXCEEDS_COURT_CAPACITY: "ظرفیت سانس از ظرفیت زمین بیشتر است.",
      SESSION_DURATION_INVALID:
        "مدت سانس با حداقل یا حداکثر مدت رزرو زمین سازگار نیست.",
      COURT_NOT_RESERVABLE:
        "پذیرش رزرو این زمین متوقف است. زمین دیگری انتخاب کنید.",
      COACH_SCHEDULE_CONFLICT: "مربی در این بازه برنامه دیگری دارد.",
      CLUB_CLOSED: "باشگاه در زمان انتخاب‌شده بسته است.",
    };
    return messages[(error as { code?: string }).code ?? ""] ?? t("error");
  };

  const addSession = async (event: FormEvent) => {
    event.preventDefault();
    if (createSession.isPending) return;
    setFormError("");
    const policy = club.data?.cancellationRules.find(
      (item) => item.id === policyId && item.isActive !== false,
    );
    if (!policy) {
      toast.danger(t("policyRequired"));
      return;
    }

    const start = tehranLocalDate(startsAt);
    const end = tehranLocalDate(endsAt);
    if (
      !startsAt ||
      !endsAt ||
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end <= start
    ) {
      toast.danger(t("invalidSessionTime"));
      return;
    }

    try {
      await createSession.mutateAsync({
        title: title.trim(),
        courtId: courtId || undefined,
        coachId: coachId || undefined,
        classId: classId || undefined,
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        capacity: resolveSessionCapacity(),
        basePrice,
        currency: "IRR",
        pricingUnit,
        options: options
          .filter((item) => item.resourceId)
          .map((item) => ({
            ...item,
            title: (item.type === "equipment"
              ? equipmentCatalog.data?.items
              : amenitiesCatalog.data?.items
            )?.find((resource) => resource.id === item.resourceId)?.name,
          })),
        cancellationPolicy: policy,
      });
      toast.success(t("sessionCreated"));
      router.push(`/clubs/${clubId}/reservations`);
    } catch (error) {
      setFormError(sessionMutationErrorMessage(error));
    }
  };

  const createBulkSessions = async () => {
    if (bulkCreating || createSession.isPending || !bulkSlotPreview.length)
      return;
    const policy = club.data?.cancellationRules.find(
      (item) => item.id === policyId && item.isActive !== false,
    );
    if (!policy) {
      toast.danger(t("policyRequired"));
      return;
    }
    if (!title.trim()) {
      toast.danger("عنوان سانس را وارد کنید.");
      return;
    }

    setBulkCreating(true);
    setFormError("");
    let created = 0;
    let failed = 0;

    for (const slot of bulkSlotPreview) {
      const start = tehranLocalDate(slot.startsAt);
      const end = tehranLocalDate(slot.endsAt);
      if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime()) ||
        end <= start
      ) {
        failed += 1;
        continue;
      }
      try {
        await createSession.mutateAsync({
          title: title.trim(),
          courtId: courtId || undefined,
          coachId: coachId || undefined,
          classId: classId || undefined,
          startsAt: start.toISOString(),
          endsAt: end.toISOString(),
          capacity: resolveSessionCapacity(),
          basePrice: slot.price,
          currency: "IRR",
          pricingUnit,
          options: options
            .filter((item) => item.resourceId)
            .map((item) => ({
              ...item,
              title: (item.type === "equipment"
                ? equipmentCatalog.data?.items
                : amenitiesCatalog.data?.items
              )?.find((resource) => resource.id === item.resourceId)?.name,
            })),
          cancellationPolicy: policy,
        });
        created += 1;
        toast.info(
          `سانس ${created.toLocaleString("fa-IR")} از ${bulkSlotPreview.length.toLocaleString("fa-IR")} ثبت شد`,
        );
      } catch {
        failed += 1;
      }
    }

    setBulkCreating(false);
    if (created && !failed) {
      toast.success(
        `${created.toLocaleString("fa-IR")} سانس با موفقیت ساخته شد.`,
      );
      router.push(`/clubs/${clubId}/reservations`);
    } else if (created) {
      toast.warning(
        `${created.toLocaleString("fa-IR")} سانس ثبت شد؛ ${failed.toLocaleString("fa-IR")} مورد ناموفق بود.`,
      );
      void sessions.refetch();
    } else {
      toast.danger("هیچ سانسی ساخته نشد. زمان‌ها و تداخل‌ها را بررسی کنید.");
    }
  };

  if (
    club.isPending ||
    courts.isPending ||
    sessions.isPending ||
    reservations.isPending
  )
    return (
      <div className="flex flex-1 justify-center py-20">
        <Spinner aria-label="در حال دریافت سانس‌ها" />
      </div>
    );
  if (
    club.isError ||
    courts.isError ||
    sessions.isError ||
    reservations.isError
  )
    return (
      <main className="p-6">
        <h1 className="text-xl font-bold">دریافت اطلاعات سانس‌ها انجام نشد</h1>
        <p className="my-3 text-muted">
          اتصال را بررسی کنید و دوباره تلاش کنید.
        </p>
        <Button
          onPress={() => {
            void club.refetch();
            void courts.refetch();
            void sessions.refetch();
            void reservations.refetch();
          }}
        >
          تلاش دوباره
        </Button>
      </main>
    );
  if (formPage === "court") {
    const initial = courts.data?.items.find((item) => item.id === editCourtId);
    if (editCourtId && !initial)
      return (
        <main className="p-6">
          زمین موردنظر پیدا نشد.{" "}
          <Link href={`/clubs/${clubId}/reservations`}>بازگشت</Link>
        </main>
      );
    return (
      <main className="flex-1 p-4 lg:p-6">
        <div className="mx-auto max-w-3xl">
          <Link
            href={`/clubs/${clubId}/reservations`}
            className="text-sm text-accent"
          >
            بازگشت به سانس‌ها
          </Link>
          <h1 className="mt-4 text-2xl font-semibold">
            {editCourtId ? "ویرایش زمین" : "افزودن زمین یا فضا"}
          </h1>
          <Card className="mt-6 p-5">
            <CourtEditor
              clubId={clubId}
              initial={initial}
              onCancel={() => router.push(`/clubs/${clubId}/reservations`)}
              onSaved={() => router.push(`/clubs/${clubId}/reservations`)}
            />
          </Card>
        </div>
      </main>
    );
  }
  if (formPage === "session")
    return (
      <main className="flex-1 p-4 lg:p-6">
        <div className="mx-auto max-w-3xl">
          <Link
            href={`/clubs/${clubId}/reservations`}
            className="text-sm text-accent"
          >
            بازگشت به سانس‌ها
          </Link>
          <h1 className="mt-4 text-2xl font-semibold">ساخت سانس</h1>
          <Card className="mt-6 p-5">
            <form
              id="create-session-form"
              aria-label="ساخت سانس"
              onSubmit={addSession}
              className="space-y-5"
            >
              {formError && (
                <p
                  role="alert"
                  className="rounded-xl bg-danger/10 p-3 text-sm text-danger"
                >
                  {formError}
                </p>
              )}
              <fieldset
                disabled={createSession.isPending}
                className="space-y-5"
              >
                <label className="block space-y-2 text-sm">
                  <span>عنوان سانس</span>
                  <HeroInput
                    aria-label="عنوان سانس"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={input}
                    placeholder="مثلاً فوتبال عصرگاهی"
                  />
                </label>
                <label className="block space-y-2 text-sm">
                  <span>زمین یا فضا</span>
                  <FormSelect
                    aria-label="زمین یا فضا"
                    value={courtId}
                    onChange={(id) => {
                      setCourtId(id);
                      const court = courts.data?.items.find((c) => c.id === id);
                      if (court) {
                        if (capacityManual) setCapacity(court.capacity);
                        if (!title) setTitle(court.name);
                      }
                    }}
                    className={input}
                  >
                    <FormOption value="">{t("withoutCourt")}</FormOption>
                    {(courts.data?.items ?? []).map((item) => (
                      <FormOption entity={item} key={item.id} value={item.id}>
                        {item.name}
                      </FormOption>
                    ))}
                  </FormSelect>
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2 text-sm">
                    <span>{t("startsAt")}</span>
                    <IranDateInput
                      required
                      dir="ltr"
                      aria-label="تاریخ و ساعت شروع"
                      withTime
                      value={startsAt}
                      onValueChange={(dateValue) => {
                        setStartsAt(dateValue);
                        if (dateValue && !endsAt)
                          setEndsAt(
                            localDateTime(
                              new Date(
                                tehranLocalDate(dateValue).getTime() +
                                  defaultDuration * 60000,
                              ).toISOString(),
                            ),
                          );
                      }}
                      className={input}
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span>{t("endsAt")}</span>
                    <IranDateInput
                      required
                      dir="ltr"
                      aria-label="تاریخ و ساعت پایان"
                      withTime
                      min={startsAt || undefined}
                      value={endsAt}
                      onValueChange={(dateValue) => setEndsAt(dateValue)}
                      className={input}
                    />
                  </label>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted">مدت سانس:</span>
                  {[60, 90, 120].map((minutes) => (
                    <Button
                      key={minutes}
                      type="button"
                      size="sm"
                      variant="secondary"
                      isDisabled={
                        !startsAt ||
                        Boolean(
                          selectedCourt &&
                          (minutes < selectedCourt.minimumReservationMinutes ||
                            minutes > selectedCourt.maximumReservationMinutes),
                        )
                      }
                      onPress={() =>
                        setEndsAt(
                          localDateTime(
                            new Date(
                              tehranLocalDate(startsAt).getTime() +
                                minutes * 60000,
                            ).toISOString(),
                          ),
                        )
                      }
                    >
                      {minutes.toLocaleString("fa-IR")} دقیقه
                    </Button>
                  ))}
                </div>
                <div className="space-y-3">
                  <Checkbox
                    className="flex gap-2"
                    isSelected={capacityManual}
                    onChange={setCapacityManual}
                  >
                    <Checkbox.Content>
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      تعیین دستی ظرفیت
                    </Checkbox.Content>
                  </Checkbox>
                  {capacityManual ? (
                    <PanelNumberField
                      label="ظرفیت (نفر)"
                      minValue={1}
                      value={capacity}
                      onChange={setCapacity}
                    />
                  ) : (
                    <p className="text-sm text-muted">
                      ظرفیت خودکار: {autoCapacityLabel} نفر (از زمین انتخاب‌شده
                      یا ۱۲)
                    </p>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <PanelPriceField
                    label="قیمت (ریال)"
                    minValue={0}
                    value={basePrice}
                    onChange={setBasePrice}
                  />
                </div>
                <label className="block space-y-2 text-sm">
                  <span>واحد قیمت‌گذاری</span>
                  <FormSelect
                    aria-label="واحد قیمت‌گذاری"
                    className={input}
                    value={pricingUnit}
                    onChange={(event) =>
                      setPricingUnit(event as typeof pricingUnit)
                    }
                  >
                    <FormOption value="per_participant">
                      به‌ازای هر نفر
                    </FormOption>
                    <FormOption value="per_session">کل سانس</FormOption>
                    <FormOption value="per_court">کل زمین</FormOption>
                  </FormSelect>
                </label>
                <label className="block space-y-2 text-sm">
                  <span>قانون لغو این سانس</span>
                  <FormSelect
                    aria-label="قانون لغو این سانس"
                    required
                    className={input}
                    value={policyId}
                    onChange={(event) => setPolicyId(event)}
                  >
                    <FormOption value="">قانون را انتخاب کنید</FormOption>
                    {club.data?.cancellationRules
                      .filter((item) => item.isActive !== false)
                      .map((item) => (
                        <FormOption entity={item} key={item.id} value={item.id}>
                          {item.title}
                        </FormOption>
                      ))}
                  </FormSelect>
                </label>
                {!club.data?.cancellationRules.some(
                  (p) => p.isActive !== false,
                ) && (
                  <p role="alert" className="text-sm text-warning">
                    برای انتشار سانس ابتدا{" "}
                    <Link className="underline" href={`/clubs/${clubId}`}>
                      قانون لغو باشگاه
                    </Link>{" "}
                    را تنظیم کنید.
                  </p>
                )}
                <details className="rounded-xl bg-surface-secondary p-4">
                  <summary className="cursor-pointer text-sm font-semibold">
                    گزینه‌های بیشتر: مربی، کلاس و خدمات اضافه
                  </summary>
                  <div className="mt-4 space-y-4">
                    {" "}
                    <FormSelect
                      aria-label="مربی (اختیاری)"
                      value={coachId}
                      onChange={(e) => setCoachId(e)}
                      className={input}
                    >
                      <FormOption value="">{t("coachOptional")}</FormOption>
                      {(coaches.data?.items ?? []).map((coach) => (
                        <FormOption
                          entity={coach}
                          key={coach.id}
                          value={coach.id}
                        >
                          {coach.displayName}
                        </FormOption>
                      ))}
                    </FormSelect>
                    <FormSelect
                      aria-label="کلاس (اختیاری)"
                      value={classId}
                      onChange={(e) => setClassId(e)}
                      className={input}
                    >
                      <FormOption value="">{t("classOptional")}</FormOption>
                      {(classes.data?.items ?? []).map((item) => (
                        <FormOption entity={item} key={item.id} value={item.id}>
                          {item.title}
                        </FormOption>
                      ))}
                    </FormSelect>
                    <div className="rounded-xl p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">
                          {t("addons")}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onPress={() =>
                              setOptions((items) => [
                                ...items,
                                {
                                  type: "equipment",
                                  resourceId: "",
                                  availableQuantity: 1,
                                  maxPerReservation: 1,
                                  unitPrice: 0,
                                },
                              ])
                            }
                          >
                            {t("addEquipment")}
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onPress={() =>
                              setOptions((items) => [
                                ...items,
                                {
                                  type: "amenity",
                                  resourceId: "",
                                  availableQuantity: 1,
                                  maxPerReservation: 1,
                                  unitPrice: 0,
                                },
                              ])
                            }
                          >
                            {t("addAmenity")}
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 space-y-3">
                        {options.map((option, index) => {
                          const selectedIds =
                            option.type === "equipment"
                              ? club.data?.equipment.map(
                                  (item) => item.equipmentId,
                                )
                              : club.data?.amenities.map(
                                  (item) => item.amenityId,
                                );
                          const catalog =
                            option.type === "equipment"
                              ? equipmentCatalog.data?.items
                              : amenitiesCatalog.data?.items;
                          return (
                            <div
                              key={`${option.type}-${index}`}
                              className="grid gap-2 rounded-lg bg-surface-secondary p-2 md:grid-cols-4"
                            >
                              <FormSelect
                                aria-label={`خدمت اضافه ${index + 1}`}
                                required
                                className={input}
                                value={option.resourceId}
                                onChange={(event) =>
                                  setOptions((items) =>
                                    items.map((item, itemIndex) =>
                                      itemIndex === index
                                        ? { ...item, resourceId: event }
                                        : item,
                                    ),
                                  )
                                }
                              >
                                <FormOption value="">
                                  {t("selectAddon")}
                                </FormOption>
                                {(catalog ?? [])
                                  .filter((item) =>
                                    selectedIds?.includes(item.id),
                                  )
                                  .map((item) => (
                                    <FormOption
                                      entity={item}
                                      key={item.id}
                                      value={item.id}
                                    >
                                      {item.name}
                                    </FormOption>
                                  ))}
                              </FormSelect>
                              {(
                                [
                                  "availableQuantity",
                                  "maxPerReservation",
                                  "unitPrice",
                                ] as const
                              ).map((fieldName) => {
                                const Field =
                                  fieldName === "unitPrice"
                                    ? PanelPriceField
                                    : PanelNumberField;
                                return (
                                  <Field
                                    key={fieldName}
                                    label={t(fieldName)}
                                    minValue={fieldName === "unitPrice" ? 0 : 1}
                                    value={option[fieldName]}
                                    onChange={(next) =>
                                      setOptions((items) =>
                                        items.map((item, itemIndex) =>
                                          itemIndex === index
                                            ? {
                                                ...item,
                                                [fieldName]: next,
                                              }
                                            : item,
                                        ),
                                      )
                                    }
                                  />
                                );
                              })}
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onPress={() =>
                                  setOptions((items) =>
                                    items.filter((_, i) => i !== index),
                                  )
                                }
                              >
                                حذف این خدمت
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </details>
              </fieldset>
            </form>
            <Card className="mt-8 p-5" aria-label="ساخت دسته‌ای سانس">
              <h2 className="text-lg font-semibold">ساخت دسته‌ای سانس</h2>
              <p className="mt-2 text-sm text-muted">
                از عنوان، زمین، قیمت پایه و قانون لغوی همین فرم استفاده
                می‌شود. برای روزهای تعطیل (جمعه و شنبه) ضریب قیمت اعمال
                می‌شود.
              </p>
              <div className="mt-5 space-y-5">
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">روزهای هفته</legend>
                  <div className="flex flex-wrap gap-3">
                    {WEEKDAY_OPTIONS.map(({ index, label }) => (
                      <Checkbox
                        key={index}
                        className="flex gap-2"
                        isSelected={Boolean(bulkWeekdays[index])}
                        onChange={(selected) =>
                          setBulkWeekdays((prev) => ({
                            ...prev,
                            [index]: selected,
                          }))
                        }
                      >
                        <Checkbox.Content>
                          <Checkbox.Control>
                            <Checkbox.Indicator />
                          </Checkbox.Control>
                          {label}
                        </Checkbox.Content>
                      </Checkbox>
                    ))}
                  </div>
                </fieldset>
                <div className="grid gap-4 sm:grid-cols-2">
                  <PanelNumberField
                    label="مدت هر سانس (دقیقه)"
                    minValue={15}
                    maxValue={480}
                    value={bulkDurationMinutes}
                    onChange={setBulkDurationMinutes}
                  />
                  <label className="block space-y-2 text-sm">
                    <span>ساعت شروع روزانه</span>
                    <HeroInput
                      dir="ltr"
                      aria-label="ساعت شروع روزانه"
                      placeholder="۱۸:۰۰"
                      value={bulkStartTime}
                      onChange={(e) => setBulkStartTime(e.target.value)}
                      className={input}
                    />
                  </label>
                </div>
                <label className="block space-y-2 text-sm">
                  <span>نحوه پر کردن روز</span>
                  <FormSelect
                    aria-label="نحوه پر کردن روز"
                    value={bulkScheduleMode}
                    onChange={(value) =>
                      setBulkScheduleMode(value as typeof bulkScheduleMode)
                    }
                    className={input}
                  >
                    <FormOption value="count">
                      تعداد مشخص سانس در هر روز
                    </FormOption>
                    <FormOption value="until">
                      تا ساعت پایان روز
                    </FormOption>
                  </FormSelect>
                </label>
                {bulkScheduleMode === "count" ? (
                  <PanelNumberField
                    label="تعداد سانس در هر روز"
                    minValue={1}
                    maxValue={24}
                    value={bulkSessionsPerDay}
                    onChange={setBulkSessionsPerDay}
                  />
                ) : (
                  <label className="block space-y-2 text-sm">
                    <span>ساعت پایان روز</span>
                    <HeroInput
                      dir="ltr"
                      aria-label="ساعت پایان روز"
                      placeholder="۲۲:۰۰"
                      value={bulkEndTime}
                      onChange={(e) => setBulkEndTime(e.target.value)}
                      className={input}
                    />
                  </label>
                )}
                <label className="block space-y-2 text-sm">
                  <span>ضریب قیمت آخر هفته (جمعه و شنبه)</span>
                  <HeroInput
                    dir="ltr"
                    type="number"
                    step="0.1"
                    min={1}
                    aria-label="ضریب قیمت آخر هفته"
                    value={String(bulkWeekendMultiplier)}
                    onChange={(e) =>
                      setBulkWeekendMultiplier(
                        Math.max(1, Number(e.target.value) || 1),
                      )
                    }
                    className={input}
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2 text-sm">
                    <span>از تاریخ</span>
                    <IranDateInput
                      dir="ltr"
                      aria-label="از تاریخ"
                      value={bulkDateFrom}
                      onValueChange={setBulkDateFrom}
                      className={input}
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span>تا تاریخ</span>
                    <IranDateInput
                      dir="ltr"
                      aria-label="تا تاریخ"
                      min={bulkDateFrom || undefined}
                      value={bulkDateTo}
                      onValueChange={setBulkDateTo}
                      className={input}
                    />
                  </label>
                </div>
                {bulkSlotPreview.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="min-w-full text-sm">
                      <thead className="bg-surface-secondary text-right">
                        <tr>
                          <th className="px-3 py-2 font-medium">روز</th>
                          <th className="px-3 py-2 font-medium">شروع</th>
                          <th className="px-3 py-2 font-medium">پایان</th>
                          <th className="px-3 py-2 font-medium">قیمت (ریال)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkSlotPreview.slice(0, 50).map((slot) => (
                          <tr
                            key={`${slot.startsAt}-${slot.endsAt}`}
                            className="border-t border-border"
                          >
                            <td className="px-3 py-2">{slot.dayLabel}</td>
                            <td className="px-3 py-2" dir="ltr">
                              {slot.startsAt.slice(11, 16)}
                            </td>
                            <td className="px-3 py-2" dir="ltr">
                              {slot.endsAt.slice(11, 16)}
                            </td>
                            <td className="px-3 py-2">
                              {slot.price.toLocaleString("fa-IR")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {bulkSlotPreview.length > 50 ? (
                      <p className="border-t border-border px-3 py-2 text-xs text-muted">
                        {bulkSlotPreview.length.toLocaleString("fa-IR")} سانس
                        ساخته می‌شود؛ ۵۰ مورد اول نمایش داده شده است.
                      </p>
                    ) : (
                      <p className="border-t border-border px-3 py-2 text-xs text-muted">
                        {bulkSlotPreview.length.toLocaleString("fa-IR")} سانس
                        در پیش‌نمایش
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted">
                    عنوان، بازه تاریخ و روزهای هفته را تنظیم کنید تا پیش‌نمایش
                    نمایش داده شود.
                  </p>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  isPending={bulkCreating}
                  isDisabled={
                    !bulkSlotPreview.length ||
                    bulkCreating ||
                    !club.data?.cancellationRules.some(
                      (p) => p.isActive !== false,
                    )
                  }
                  onPress={() => void createBulkSessions()}
                >
                  ساخت همه سانس‌ها ({bulkSlotPreview.length.toLocaleString("fa-IR")})
                </Button>
              </div>
            </Card>
            <div className="mt-5 flex gap-2">
              <Button
                type="submit"
                form="create-session-form"
                isPending={createSession.isPending}
                isDisabled={
                  !club.data?.cancellationRules.some(
                    (p) => p.isActive !== false,
                  )
                }
              >
                ثبت سانس
              </Button>
              <Button variant="secondary">
                <Link href={`/clubs/${clubId}/reservations`}>انصراف</Link>
              </Button>
            </div>
          </Card>
        </div>
      </main>
    );
  return (
    <main className="flex-1 overflow-auto p-4 lg:p-6">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">مدیریت سانس‌ها</h1>
            <p className="mt-2 text-sm text-muted">
              {club.data?.name} · زمان‌ها، ظرفیت و رزروها در یک نگاه
            </p>
          </div>
          <Button>
            <Link href={`/clubs/${clubId}/reservations/sessions/new`}>
              ساخت سانس
            </Link>
          </Button>
        </header>
        <div className="my-6">
          <PanelSectionSwitcher
            label="بخش مدیریت سانس"
            value={section}
            onChange={setSection}
            items={[
              {
                value: "sessions",
                label: `سانس‌ها (${sessions.data?.items.length ?? 0})`,
              },
              {
                value: "reservations",
                label: `رزروها (${reservations.data?.items.length ?? 0})`,
              },
              { value: "courts", label: "زمین‌ها و فضاها" },
            ]}
          />
        </div>
        {confirmation.dialog}

        {section === "courts" && (
          <section aria-label="زمین‌ها و فضاها">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">زمین‌ها و فضاها</h2>
              <Button variant="secondary">
                <Link href={`/clubs/${clubId}/reservations/courts/new`}>
                  افزودن زمین
                </Link>
              </Button>
            </div>
            <p className="mb-4 text-sm text-muted">
              اطلاعات هر فضا را یک‌بار ثبت کنید و در سانس‌ها از آن استفاده کنید.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {(courts.data?.items ?? []).map((item) => (
                <Card key={item.id} className="p-4">
                  <strong>{item.name}</strong>
                  <p className="text-sm text-muted">
                    ظرفیت {item.capacity.toLocaleString("fa-IR")} نفر ·{" "}
                    {item.status === "active" && item.isReservable
                      ? "رزرو فعال"
                      : "فروش متوقف"}
                  </p>
                  <Button
                    variant="secondary"
                    aria-label={`ویرایش زمین ${item.name}`}
                  >
                    <Link
                      href={`/clubs/${clubId}/reservations/courts/${item.id}/edit`}
                    >
                      ویرایش زمین
                    </Link>
                  </Button>
                </Card>
              ))}
            </div>
            {!courts.data?.items.length && (
              <p className="py-8 text-center text-muted">
                هنوز زمینی اضافه نکرده‌اید. ساخت سانس بدون زمین هم امکان‌پذیر
                است.
              </p>
            )}
          </section>
        )}
        {section === "sessions" && (
          <section className="mt-5" aria-label="فهرست سانس‌ها">
            <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <HeroInput
                aria-label="جستجوی سانس"
                placeholder="جستجوی عنوان سانس"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <FormSelect
                aria-label="فیلتر وضعیت سانس"
                value={statusFilter}
                onChange={setStatusFilter}
              >
                <FormOption value="all">همه وضعیت‌ها</FormOption>
                <FormOption value="active">فعال</FormOption>
                <FormOption value="completed">برگزارشده</FormOption>
                <FormOption value="cancelled">لغوشده</FormOption>
              </FormSelect>
              <FormSelect
                aria-label="فیلتر زمین"
                value={courtFilter}
                onChange={setCourtFilter}
              >
                <FormOption value="">همه زمین‌ها</FormOption>
                {courts.data?.items.map((c) => (
                  <FormOption key={c.id} value={c.id}>
                    {c.name}
                  </FormOption>
                ))}
              </FormSelect>
              <FormSelect
                aria-label="فیلتر ظرفیت رزرو"
                value={occupancyFilter}
                onChange={(value) =>
                  setOccupancyFilter(value as typeof occupancyFilter)
                }
              >
                <FormOption value="all">همه سانس‌ها</FormOption>
                <FormOption value="empty">فقط خالی (بدون رزرو)</FormOption>
              </FormSelect>
            </div>

            <h2 className="text-lg font-semibold">{t("sessions")}</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {visibleSessions.map((item) => (
                <Card
                  key={item.id}
                  variant="transparent"
                  className="app-card shadow-none active:scale-100 p-4"
                >
                  <div className="flex justify-between gap-3">
                    <div>
                      <strong>{item.title}</strong>
                      <p className="mt-1 text-xs text-muted">
                        {sessionStatusLabels[item.status]} ·{" "}
                        {courts.data?.items.find((c) => c.id === item.courtId)
                          ?.name ?? "بدون زمین"}
                      </p>
                    </div>
                    <span className="text-sm text-muted">
                      {item.reservedCount.toLocaleString("fa-IR")} از{" "}
                      {item.capacity.toLocaleString("fa-IR")} نفر
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted">
                    {new Intl.DateTimeFormat("fa-IR", {
                      timeZone: "Asia/Tehran",
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(item.startsAt))}
                  </p>
                  <p className="mt-2 text-sm text-muted">
                    تا{" "}
                    {new Intl.DateTimeFormat("fa-IR", {
                      timeZone: "Asia/Tehran",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(item.endsAt))}{" "}
                    · {item.basePrice.toLocaleString("fa-IR")} ریال{" "}
                    {item.pricingUnit === "per_participant"
                      ? "برای هر نفر"
                      : "برای کل سانس"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary">
                      <Link
                        href={`/clubs/${clubId}/reservations/sessions/new?copy=${item.id}`}
                      >
                        ساخت مشابه
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onPress={() => {
                        setReservationSessionId(item.id);
                        setSection("reservations");
                      }}
                    >
                      مشاهده رزروها
                    </Button>
                  </div>
                  {item.status === "active" ? (
                    <div className="mt-3 flex gap-2">
                      {new Date(item.endsAt) <= new Date() ? (
                        <Button
                          size="sm"
                          variant="primary"
                          isPending={completeSession.isPending}
                          onPress={() =>
                            completeSession
                              .mutateAsync(item.id)
                              .then(() => toast.success(t("sessionCompleted")))
                              .catch(() =>
                                toast.danger(t("sessionActionError")),
                              )
                          }
                        >
                          {t("completeSession")}
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="danger"
                        isPending={cancelSession.isPending}
                        onPress={async () => {
                          if (
                            !(await confirmation.confirm(
                              t("cancelSessionConfirm"),
                            ))
                          )
                            return;
                          cancelSession
                            .mutateAsync(item.id)
                            .then(() => toast.success(t("sessionCancelled")))
                            .catch(() => toast.danger(t("sessionActionError")));
                        }}
                      >
                        {t("cancelSession")}
                      </Button>
                    </div>
                  ) : null}
                </Card>
              ))}
            </div>
            {!visibleSessions.length && (
              <div className="rounded-2xl bg-surface p-8 text-center">
                <h3 className="font-semibold">
                  {sessions.data?.items.length
                    ? "سانسی با این فیلتر پیدا نشد"
                    : "اولین سانس را بسازید"}
                </h3>
                <p className="my-3 text-sm text-muted">
                  {sessions.data?.items.length
                    ? "جست‌وجو یا فیلترها را تغییر دهید."
                    : "زمان، ظرفیت و قیمت را تعیین کنید تا سانس برای رزرو آماده شود."}
                </p>
                {!sessions.data?.items.length && (
                  <Button>
                    <Link href={`/clubs/${clubId}/reservations/sessions/new`}>
                      ساخت اولین سانس
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </section>
        )}
        {section === "reservations" && (
          <section className="mt-8">
            <h2 className="text-lg font-semibold">رزروهای ثبت‌شده</h2>
            <FormSelect
              aria-label="سانس رزروها"
              className="my-4 max-w-md"
              value={reservationSessionId}
              onChange={setReservationSessionId}
            >
              <FormOption value="">همه سانس‌ها</FormOption>
              {sessions.data?.items.map((item) => (
                <FormOption key={item.id} value={item.id}>
                  {item.title}
                </FormOption>
              ))}
            </FormSelect>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {(reservations.data?.items ?? [])
                .filter(
                  (item) =>
                    !reservationSessionId ||
                    item.sessionId === reservationSessionId,
                )
                .map((item) => (
                  <Card
                    key={item.id}
                    variant="transparent"
                    className="app-card shadow-none active:scale-100 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <strong>{item.sessionTitle}</strong>
                        <p className="mt-1 text-xs text-muted">
                          کاربر {item.userId.slice(-8)} ·{" "}
                          {item.participantCount.toLocaleString("fa-IR")} نفر
                        </p>
                      </div>
                      <span className="text-xs text-muted">{item.status}</span>
                    </div>
                    <p className="mt-2 text-sm text-muted">
                      {new Intl.DateTimeFormat("fa-IR", {
                        timeZone: "Asia/Tehran",
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(item.sessionStartsAt))}
                      {" · "}
                      {item.totalPrice.toLocaleString("fa-IR")} ریال
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      پرداخت: {paymentStatusLabels[item.paymentStatus]}
                      {item.paymentMethod === "cash"
                        ? " · نقدی"
                        : item.paymentMethod === "pos"
                          ? " · کارت‌خوان"
                          : ""}
                    </p>
                    {(item.status === "reserved" &&
                      item.paymentStatus === "pay_on_arrival") ||
                    (["cancelled", "no_show"].includes(item.status) &&
                      item.paymentStatus === "paid" &&
                      item.paymentMethod &&
                      item.paymentMethod !== "online" &&
                      (item.refundAmount ?? 0) > 0) ? (
                      <Button
                        className="mt-3"
                        size="sm"
                        isPending={onSitePayment.isPending}
                        onPress={async () => {
                          const refund = item.status !== "reserved";
                          const amount = refund
                            ? item.refundAmount!
                            : item.totalPrice;
                          if (
                            !(await confirmation.confirm(
                              `آیا مبلغ ${amount.toLocaleString("fa-IR")} ریال را ${refund ? "به مشتری بازگردانده‌اید" : "از مشتری دریافت کرده‌اید"}؟`,
                            ))
                          )
                            return;
                          try {
                            await onSitePayment.mutateAsync({
                              id: item.id,
                              action: refund ? "refund" : "collect",
                              expectedAmount: amount,
                            });
                            toast.success(
                              refund
                                ? "بازپرداخت حضوری ثبت شد"
                                : "دریافت وجه ثبت شد",
                            );
                          } catch {
                            toast.danger(
                              "ثبت پرداخت انجام نشد؛ اطلاعات را به‌روز کنید.",
                            );
                          }
                        }}
                      >
                        {item.status === "reserved"
                          ? "ثبت دریافت وجه در پذیرش"
                          : "ثبت بازپرداخت حضوری"}
                      </Button>
                    ) : null}
                    {item.status === "reserved" &&
                    item.paymentStatus !== "pending" &&
                    new Date(item.sessionStartsAt) <= new Date() ? (
                      <Button
                        className="mt-3"
                        size="sm"
                        variant="danger"
                        isPending={markNoShow.isPending}
                        onPress={() =>
                          markNoShow
                            .mutateAsync(item.id)
                            .then(() => toast.success("عدم حضور ثبت شد"))
                            .catch(() => toast.danger("ثبت عدم حضور انجام نشد"))
                        }
                      >
                        ثبت عدم حضور
                      </Button>
                    ) : null}
                  </Card>
                ))}
              {!(reservations.data?.items ?? []).some(
                (item) =>
                  !reservationSessionId ||
                  item.sessionId === reservationSessionId,
              ) ? (
                <p className="py-6 text-sm text-muted">
                  هنوز رزروی ثبت نشده است.
                </p>
              ) : null}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
