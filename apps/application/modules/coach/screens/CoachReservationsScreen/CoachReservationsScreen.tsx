"use client";

import { type FormEvent, useMemo, useState } from "react";
import { Button, Card, Chip, toast, Typography } from "@heroui/react";
import {
  useCancelCoachSession,
  useCoachClassEnrollments,
  useCoachBookings,
  useCoachCalendar,
  useCoachClasses,
  useCoachOfferings,
  useCoachSessionAttendance,
  useCreateCoachOffering,
  useCreateCoachSession,
  usePublicCatalogResource,
  useRecordCoachSessionAttendance,
  useRescheduleCoachSession,
  useUpdateClassEnrollmentStatus,
  useUpdateCoachBookingStatus,
  useUpdateCoachOfferingStatus,
  type AttendanceStatus,
} from "@api";

import { AthleteScreenHeaderSection } from "@modules/athlete/sections/AthleteScreenHeaderSection";
import {
  CompactCardListSkeleton,
  DashboardPageSkeleton,
} from "@/components/loading-skeletons";

const inputClass =
  "h-11 w-full rounded-xl border border-white/10 bg-surface-secondary px-3 text-sm outline-none focus:border-accent";

const statusLabels: Record<string, string> = {
  pending: "در انتظار تأیید",
  active: "فعال",
  confirmed: "تأییدشده",
  rejected: "ردشده",
  cancelled: "لغوشده",
  cancelled_by_athlete: "لغو توسط ورزشکار",
  cancelled_by_coach: "لغو توسط مربی",
  completed: "انجام‌شده",
  no_show: "عدم حضور",
};

const paymentStatusLabels: Record<string, string> = {
  not_required: "رایگان",
  pending: "در انتظار پرداخت",
  paid: "پرداخت‌شده",
  refunded: "بازپرداخت‌شده",
  failed: "پرداخت ناموفق",
};

const attendanceStatusLabels: Record<AttendanceStatus, string> = {
  unrecorded: "ثبت‌نشده",
  present: "حاضر",
  absent: "غایب",
  late: "با تأخیر",
  excused: "غیبت موجه",
};

export function CoachReservationsScreen() {
  const sports = usePublicCatalogResource("sports", "sport");
  const offerings = useCoachOfferings();
  const calendar = useCoachCalendar();
  const coachClasses = useCoachClasses();
  const bookings = useCoachBookings();
  const createOffering = useCreateCoachOffering();
  const publishOffering = useUpdateCoachOfferingStatus();
  const createSession = useCreateCoachSession();
  const cancelSession = useCancelCoachSession();
  const rescheduleSession = useRescheduleCoachSession();
  const updateBooking = useUpdateCoachBookingStatus();

  const [serviceTitle, setServiceTitle] = useState("");
  const [sportId, setSportId] = useState("");
  const [mode, setMode] = useState<"club" | "online" | "home" | "outdoor">(
    "club",
  );
  const [duration, setDuration] = useState(60);
  const [serviceCapacity, setServiceCapacity] = useState(1);
  const [price, setPrice] = useState(0);
  const [offeringId, setOfferingId] = useState("");
  const [sessionTitle, setSessionTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [address, setAddress] = useState("");
  const [onlineUrl, setOnlineUrl] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [attendanceSessionId, setAttendanceSessionId] = useState("");
  const [attendanceDraft, setAttendanceDraft] = useState<
    Record<string, Exclude<AttendanceStatus, "unrecorded"> | "unrecorded">
  >({});
  const [attendanceNotes, setAttendanceNotes] = useState<
    Record<string, string>
  >({});
  const activeClassId =
    selectedClassId || coachClasses.data?.items[0]?.id || "";
  const activeAttendanceSessionId =
    attendanceSessionId || calendar.data?.items[0]?.id || "";
  const classEnrollments = useCoachClassEnrollments(activeClassId);
  const updateEnrollment = useUpdateClassEnrollmentStatus(activeClassId);
  const attendance = useCoachSessionAttendance(activeAttendanceSessionId);
  const recordAttendance = useRecordCoachSessionAttendance(
    activeAttendanceSessionId,
  );

  const publishedOfferings = useMemo(
    () =>
      (offerings.data?.items ?? []).filter(
        (item) => item.status === "published",
      ),
    [offerings.data?.items],
  );
  const selectedOffering = publishedOfferings.find(
    (item) => item.id === offeringId,
  );

  const addOffering = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await createOffering.mutateAsync({
        sportId,
        title: serviceTitle,
        type: serviceCapacity === 1 ? "private" : "semi_private",
        deliveryModes: [mode],
        durationMinutes: duration,
        capacity: serviceCapacity,
        price: { amount: price, currency: "IRR" },
      });
      setServiceTitle("");
      toast.success("خدمت مربی ساخته شد؛ حالا آن را منتشر کنید");
    } catch {
      toast.danger(
        "ساخت خدمت انجام نشد؛ اطلاعات و وضعیت پروفایل را بررسی کنید",
      );
    }
  };

  const addSession = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedOffering) return;
    const start = new Date(startsAt);
    const end = new Date(
      start.getTime() + selectedOffering.durationMinutes * 60_000,
    );
    try {
      await createSession.mutateAsync({
        offeringId: selectedOffering.id,
        sportId: selectedOffering.sportId,
        title: sessionTitle || selectedOffering.title,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        deliveryMode: selectedOffering.deliveryModes[0] ?? "club",
        venue:
          selectedOffering.deliveryModes[0] === "online" && onlineUrl
            ? { onlineUrl }
            : address
              ? { address }
              : undefined,
        capacity: selectedOffering.capacity,
      });
      setSessionTitle("");
      setStartsAt("");
      toast.success("سانس قابل رزرو ساخته شد");
    } catch {
      toast.danger(
        "ساخت سانس انجام نشد؛ زمان، تداخل و اطلاعات محل را بررسی کنید",
      );
    }
  };

  if (
    offerings.isPending ||
    calendar.isPending ||
    bookings.isPending ||
    coachClasses.isPending ||
    sports.isPending
  ) {
    return <DashboardPageSkeleton />;
  }

  return (
    <main className="app-page gap-6">
      <AthleteScreenHeaderSection title="رزروهای مربی" />

      <Card className="rounded-3xl bg-surface p-5 shadow-none">
        <Typography type="h5" weight="bold">
          تعریف خدمت قابل رزرو
        </Typography>
        <form className="mt-4 grid gap-3" onSubmit={addOffering}>
          <input
            required
            minLength={2}
            className={inputClass}
            value={serviceTitle}
            onChange={(event) => setServiceTitle(event.target.value)}
            placeholder="مثلاً جلسه خصوصی بدنسازی"
          />
          <select
            required
            className={inputClass}
            value={sportId}
            onChange={(event) => setSportId(event.target.value)}
          >
            <option value="">انتخاب رشته ورزشی</option>
            {(sports.data?.items ?? []).map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <select
            className={inputClass}
            value={mode}
            onChange={(event) => setMode(event.target.value as typeof mode)}
          >
            <option value="club">در باشگاه</option>
            <option value="online">آنلاین</option>
            <option value="home">در محل ورزشکار</option>
            <option value="outdoor">فضای باز</option>
          </select>
          <div className="grid grid-cols-3 gap-2">
            <NumberInput
              label="مدت (دقیقه)"
              value={duration}
              min={15}
              onChange={setDuration}
            />
            <NumberInput
              label="ظرفیت"
              value={serviceCapacity}
              min={1}
              onChange={setServiceCapacity}
            />
            <NumberInput
              label="قیمت (ریال)"
              value={price}
              min={0}
              onChange={setPrice}
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            isPending={createOffering.isPending}
          >
            ساخت خدمت
          </Button>
        </form>
        <div className="mt-5 flex flex-col gap-2">
          {(offerings.data?.items ?? []).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-2xl bg-surface-secondary p-3"
            >
              <div>
                <p className="text-sm font-bold">{item.title}</p>
                <p className="mt-1 text-xs text-muted">
                  {item.price.amount.toLocaleString("fa-IR")} ریال ·{" "}
                  {item.durationMinutes.toLocaleString("fa-IR")} دقیقه
                </p>
              </div>
              {item.status === "draft" ? (
                <Button
                  size="sm"
                  variant="secondary"
                  isPending={publishOffering.isPending}
                  onPress={() =>
                    void publishOffering
                      .mutateAsync({ offeringId: item.id, status: "published" })
                      .then(() => toast.success("خدمت منتشر شد"))
                      .catch(() =>
                        toast.danger(
                          "برای انتشار، پروفایل مربی باید تأیید شده باشد",
                        ),
                      )
                  }
                >
                  انتشار
                </Button>
              ) : (
                <Chip size="sm" color="success">
                  منتشرشده
                </Chip>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card className="rounded-3xl bg-surface p-5 shadow-none">
        <Typography type="h5" weight="bold">
          ساخت سانس آزاد
        </Typography>
        <form className="mt-4 grid gap-3" onSubmit={addSession}>
          <select
            required
            className={inputClass}
            value={offeringId}
            onChange={(event) => setOfferingId(event.target.value)}
          >
            <option value="">انتخاب خدمت منتشرشده</option>
            {publishedOfferings.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
          <input
            className={inputClass}
            value={sessionTitle}
            onChange={(event) => setSessionTitle(event.target.value)}
            placeholder="عنوان سانس (اختیاری)"
          />
          <input
            required
            type="datetime-local"
            className={inputClass}
            value={startsAt}
            onChange={(event) => setStartsAt(event.target.value)}
          />
          {selectedOffering?.deliveryModes[0] === "online" ? (
            <input
              required
              type="url"
              className={inputClass}
              value={onlineUrl}
              onChange={(event) => setOnlineUrl(event.target.value)}
              placeholder="لینک جلسه آنلاین (پس از رزرو نمایش داده می‌شود)"
            />
          ) : (
            <input
              required={
                selectedOffering?.deliveryModes[0] === "club" ||
                selectedOffering?.deliveryModes[0] === "outdoor"
              }
              className={inputClass}
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="آدرس یا توضیح محل برگزاری"
            />
          )}
          <Button
            type="submit"
            variant="primary"
            isPending={createSession.isPending}
            isDisabled={!selectedOffering}
          >
            ساخت سانس
          </Button>
        </form>
        <div className="mt-5 flex flex-col gap-2">
          {(calendar.data?.items ?? [])
            .filter((item) => new Date(item.endAt) > new Date())
            .map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-2xl bg-surface-secondary p-3"
              >
                <div>
                  <p className="text-sm font-bold">{item.title}</p>
                  <p className="mt-1 text-xs text-muted">
                    {new Date(item.startAt).toLocaleString("fa-IR")} ·{" "}
                    {item.bookedCount.toLocaleString("fa-IR")} از{" "}
                    {item.capacity.toLocaleString("fa-IR")}
                  </p>
                </div>
                {item.managedBy !== "club" &&
                !["cancelled", "completed"].includes(item.status) ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      isPending={rescheduleSession.isPending}
                      onPress={() => {
                        const value = window.prompt(
                          "زمان جدید را با قالب 2026-09-10T18:30 وارد کنید:",
                        );
                        if (!value) return;
                        const start = new Date(value);
                        const duration = new Date(item.endAt).getTime() - new Date(item.startAt).getTime();
                        if (Number.isNaN(start.getTime())) {
                          toast.danger("زمان واردشده معتبر نیست");
                          return;
                        }
                        void rescheduleSession.mutateAsync({
                          sessionId: item.id,
                          startAt: start.toISOString(),
                          endAt: new Date(start.getTime() + duration).toISOString(),
                        }).then(() => toast.success("زمان سانس تغییر کرد"))
                          .catch(() => toast.danger("تغییر زمان سانس انجام نشد"));
                      }}
                    >
                      تغییر زمان
                    </Button>
                    <Button
                      size="sm"
                      variant="danger-soft"
                      isPending={cancelSession.isPending}
                      onPress={() =>
                        void cancelSession
                          .mutateAsync({
                            sessionId: item.id,
                            reason: "لغو سانس توسط مربی",
                          })
                          .then(() =>
                            toast.success("سانس و رزروهای فعال لغو شدند"),
                          )
                          .catch(() => toast.danger("لغو سانس انجام نشد"))
                      }
                    >
                      لغو
                    </Button>
                  </div>
                ) : (
                  <Chip size="sm">
                    {item.managedBy === "club" ? "مدیریت باشگاه" : "لغوشده"}
                  </Chip>
                )}
              </div>
            ))}
        </div>
      </Card>

      <Card className="rounded-3xl bg-surface p-5 shadow-none">
        <Typography type="h5" weight="bold">
          شاگردان کلاس
        </Typography>
        <label className="mt-4 grid gap-2 text-sm text-muted">
          انتخاب کلاس
          <select
            className={inputClass}
            value={activeClassId}
            onChange={(event) => setSelectedClassId(event.target.value)}
          >
            <option value="">یک کلاس را انتخاب کنید</option>
            {(coachClasses.data?.items ?? []).map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        {classEnrollments.isPending && activeClassId ? (
          <div className="mt-4">
            <CompactCardListSkeleton count={3} />
          </div>
        ) : classEnrollments.isError ? (
          <Button
            className="mt-4"
            variant="secondary"
            onPress={() => classEnrollments.refetch()}
          >
            تلاش دوباره
          </Button>
        ) : (
          <div className="mt-4 grid gap-3">
            {(classEnrollments.data?.items ?? []).map((item) => {
              const athleteName = [
                item.athlete?.firstName,
                item.athlete?.lastName,
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <div
                  key={item.id}
                  className="rounded-2xl bg-surface-secondary p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-bold">
                        {athleteName || "ورزشکار Gym4Me"}
                      </p>
                      <p className="mt-1 text-xs text-muted" dir="ltr">
                        {item.athlete?.phone ?? item.athleteId}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <Chip size="sm">
                        {statusLabels[item.status] ?? item.status}
                      </Chip>
                      <span className="text-xs text-muted">
                        {paymentStatusLabels[item.paymentStatus]}
                      </span>
                    </div>
                  </div>
                  {item.status === "pending" ? (
                    item.paymentStatus === "pending" ? (
                      <p className="mt-3 text-xs text-warning">
                        تأیید مربی پس از تکمیل پرداخت فعال می‌شود.
                      </p>
                    ) : (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant="primary"
                          isPending={updateEnrollment.isPending}
                          onPress={() =>
                            void updateEnrollment
                              .mutateAsync({
                                enrollmentId: item.id,
                                status: "active",
                              })
                              .then(() => toast.success("شاگرد تأیید شد"))
                              .catch(() =>
                                toast.danger("تأیید شاگرد انجام نشد"),
                              )
                          }
                        >
                          تأیید
                        </Button>
                        <Button
                          size="sm"
                          variant="danger-soft"
                          isDisabled={updateEnrollment.isPending}
                          onPress={() =>
                            void updateEnrollment
                              .mutateAsync({
                                enrollmentId: item.id,
                                status: "rejected",
                              })
                              .then(() => toast.success("درخواست رد شد"))
                              .catch(() => toast.danger("رد درخواست انجام نشد"))
                          }
                        >
                          رد
                        </Button>
                      </div>
                    )
                  ) : item.status === "active" ? (
                    <Button
                      className="mt-3"
                      size="sm"
                      variant="danger-soft"
                      isPending={updateEnrollment.isPending}
                      onPress={() =>
                        void updateEnrollment
                          .mutateAsync({
                            enrollmentId: item.id,
                            status: "cancelled",
                          })
                          .then(() => toast.success("عضویت شاگرد لغو شد"))
                          .catch(() => toast.danger("لغو عضویت انجام نشد"))
                      }
                    >
                      لغو عضویت
                    </Button>
                  ) : null}
                </div>
              );
            })}
            {activeClassId && !classEnrollments.data?.items.length ? (
              <p className="py-8 text-center text-sm text-muted">
                هنوز شاگردی در این کلاس ثبت‌نام نکرده است.
              </p>
            ) : null}
          </div>
        )}
      </Card>

      <Card className="rounded-3xl bg-surface p-5 shadow-none">
        <Typography type="h5" weight="bold">
          حضور و غیاب
        </Typography>
        <label className="mt-4 grid gap-2 text-sm text-muted">
          انتخاب جلسه
          <select
            className={inputClass}
            value={activeAttendanceSessionId}
            onChange={(event) => {
              setAttendanceSessionId(event.target.value);
              setAttendanceDraft({});
              setAttendanceNotes({});
            }}
          >
            <option value="">یک جلسه را انتخاب کنید</option>
            {(calendar.data?.items ?? []).map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}، {new Date(item.startAt).toLocaleString("fa-IR")}
              </option>
            ))}
          </select>
        </label>
        {attendance.isPending && activeAttendanceSessionId ? (
          <div className="mt-4">
            <CompactCardListSkeleton count={3} />
          </div>
        ) : attendance.isError ? (
          <Button
            className="mt-4"
            variant="secondary"
            onPress={() => attendance.refetch()}
          >
            تلاش دوباره
          </Button>
        ) : (
          <div className="mt-4 grid gap-3">
            {(attendance.data?.items ?? []).map((item) => {
              const currentStatus =
                attendanceDraft[item.athleteId] ?? item.status;
              const athleteName = [
                item.athlete?.firstName,
                item.athlete?.lastName,
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <div
                  key={item.athleteId}
                  className="rounded-2xl bg-surface-secondary p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-bold">
                        {athleteName || "ورزشکار Gym4Me"}
                      </p>
                      <p className="mt-1 text-xs text-muted" dir="ltr">
                        {item.athlete?.phone ?? item.athleteId}
                      </p>
                    </div>
                    <Chip size="sm">
                      {attendanceStatusLabels[currentStatus]}
                    </Chip>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {(["present", "late", "absent", "excused"] as const).map(
                      (status) => (
                        <Button
                          key={status}
                          size="sm"
                          variant={
                            currentStatus === status ? "primary" : "secondary"
                          }
                          onPress={() =>
                            setAttendanceDraft((current) => ({
                              ...current,
                              [item.athleteId]: status,
                            }))
                          }
                        >
                          {attendanceStatusLabels[status]}
                        </Button>
                      ),
                    )}
                  </div>
                  <label className="mt-3 grid gap-2 text-xs text-muted">
                    یادداشت (اختیاری)
                    <input
                      className={inputClass}
                      value={attendanceNotes[item.athleteId] ?? item.note ?? ""}
                      onChange={(event) =>
                        setAttendanceNotes((current) => ({
                          ...current,
                          [item.athleteId]: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
              );
            })}
            {activeAttendanceSessionId && !attendance.data?.items.length ? (
              <p className="py-8 text-center text-sm text-muted">
                شرکت‌کننده‌ای برای این جلسه وجود ندارد.
              </p>
            ) : null}
            {attendance.data?.items.length ? (
              <Button
                variant="primary"
                isPending={recordAttendance.isPending}
                isDisabled={attendance.data.items.some(
                  (item) =>
                    (attendanceDraft[item.athleteId] ?? item.status) ===
                    "unrecorded",
                )}
                onPress={() => {
                  const items = attendance.data.items.flatMap((item) => {
                    const status =
                      attendanceDraft[item.athleteId] ?? item.status;
                    return status && status !== "unrecorded"
                      ? [
                          {
                            athleteId: item.athleteId,
                            status,
                            note:
                              attendanceNotes[item.athleteId] ??
                              item.note ??
                              undefined,
                          },
                        ]
                      : [];
                  });
                  void recordAttendance
                    .mutateAsync(items)
                    .then(() => toast.success("حضور و غیاب ذخیره شد"))
                    .catch(() => toast.danger("ذخیره حضور و غیاب انجام نشد"));
                }}
              >
                ذخیره حضور و غیاب
              </Button>
            ) : null}
          </div>
        )}
      </Card>

      <section>
        <Typography type="h5" weight="bold">
          درخواست‌ها و رزروها
        </Typography>
        <div className="mt-3 flex flex-col gap-3">
          {(bookings.data?.items ?? []).map((item) => (
            <Card
              key={item.id}
              className="rounded-2xl bg-surface p-4 shadow-none"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{item.sessionTitle}</p>
                  <p className="mt-1 text-xs text-muted">
                    {new Date(item.sessionStartsAt).toLocaleString("fa-IR")} ·{" "}
                    {item.priceSnapshot.amount.toLocaleString("fa-IR")} ریال
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    پرداخت: {paymentStatusLabels[item.paymentStatus]}
                  </p>
                </div>
                <Chip size="sm">
                  {statusLabels[item.status] ?? item.status}
                </Chip>
              </div>
              {item.status === "confirmed" ? (
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onPress={() =>
                      void updateBooking.mutateAsync({
                        bookingId: item.id,
                        status: "completed",
                      })
                    }
                  >
                    انجام شد
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onPress={() =>
                      void updateBooking.mutateAsync({
                        bookingId: item.id,
                        status: "no_show",
                      })
                    }
                  >
                    عدم حضور
                  </Button>
                  <Button
                    size="sm"
                    variant="danger-soft"
                    onPress={() =>
                      void updateBooking.mutateAsync({
                        bookingId: item.id,
                        status: "cancelled_by_coach",
                        reason: "لغو توسط مربی",
                      })
                    }
                  >
                    لغو
                  </Button>
                </div>
              ) : null}
            </Card>
          ))}
          {!bookings.data?.items.length ? (
            <p className="py-8 text-center text-sm text-muted">
              هنوز رزروی ثبت نشده است.
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function NumberInput({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-1 text-xs text-muted">
      {label}
      <input
        required
        type="number"
        min={min}
        className={inputClass}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
