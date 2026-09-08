"use client";

import { IranDateInput } from "@repo/ui/iran-date-input";
import {
  tehranLocalDate,
  tehranLocalValue,
  parseIranDateInput,
  iranDateInputValue,
} from "@repo/ui/iran-date";

import Link from "@/components/app-link";
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
  useCreateCoachSession,
  useRecordCoachSessionAttendance,
  useRescheduleCoachSession,
  useUpdateClassEnrollmentStatus,
  useUpdateCoachBookingStatus,
  useUpdateCoachOfferingStatus,
  type AttendanceStatus,
  type CoachSession,
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
  const [workspaceView, setWorkspaceView] = useState("bookings");
  const offerings = useCoachOfferings();
  const calendar = useCoachCalendar();
  const coachClasses = useCoachClasses();
  const bookings = useCoachBookings();
  const publishOffering = useUpdateCoachOfferingStatus();
  const createSession = useCreateCoachSession();
  const cancelSession = useCancelCoachSession();
  const rescheduleSession = useRescheduleCoachSession();
  const updateBooking = useUpdateCoachBookingStatus();

  const [offeringId, setOfferingId] = useState("");
  const [sessionTitle, setSessionTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [address, setAddress] = useState("");
  const [onlineUrl, setOnlineUrl] = useState("");
  const [sessionMode, setSessionMode] =
    useState<CoachSession["deliveryMode"]>("club");
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
        (item) =>
          item.status === "published",
      ),
    [offerings.data?.items],
  );
  const selectedOffering = publishedOfferings.find(
    (item) => item.id === offeringId,
  );

  const selectedDeliveryMode = selectedOffering?.deliveryModes.includes(
    sessionMode,
  )
    ? sessionMode
    : (selectedOffering?.deliveryModes[0] ?? "club");

  const addSession = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedOffering) return;
    const start = tehranLocalDate(startsAt);
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
        deliveryMode: selectedDeliveryMode,
        venue:
          selectedDeliveryMode === "online" && onlineUrl
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
    coachClasses.isPending
  ) {
    return <DashboardPageSkeleton />;
  }

  return (
    <main className="app-page coach-workspace gap-6">
      <AthleteScreenHeaderSection title="رزروهای مربی" />
      <nav aria-label="بخش‌های مدیریت رزرو" className="workspace-navigation">
        {[
          { id: "bookings", title: "رزروها" },
          { id: "sessions", title: "جلسات" },
          { id: "enrollments", title: "ثبت‌نام‌ها" },
          { id: "attendance", title: "حضور‌وغیاب" },
          { id: "services", title: "خدمات" },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={workspaceView === item.id}
            onClick={() => setWorkspaceView(item.id)}
          >
            {item.title}
          </button>
        ))}
      </nav>

      <Card
        hidden={workspaceView !== "services"}
        className="app-card p-5 shadow-none"
      >
        <Typography type="h5" weight="bold">
          تعریف خدمت قابل رزرو
        </Typography>
        <Link
          href="/coach/services/new"
          className="mt-4 inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-4 font-bold text-accent-foreground"
        >
          تعریف خدمت جدید
        </Link>
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
              <div className="flex items-center gap-2">
                {item.status !== "archived" ? (
                  <Link
                    href={`/coach/services/${item.id}/edit`}
                    className="inline-flex min-h-11 items-center px-3 text-sm text-accent"
                  >
                    ویرایش
                  </Link>
                ) : null}
                {item.status === "draft" ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    isPending={publishOffering.isPending}
                    onPress={() =>
                      void publishOffering
                        .mutateAsync({
                          offeringId: item.id,
                          status: "published",
                        })
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
                    {item.status === "archived" ? "بایگانی‌شده" : "منتشرشده"}
                  </Chip>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card
        hidden={workspaceView !== "sessions"}
        className="app-card p-5 shadow-none"
      >
        <Typography type="h5" weight="bold">
          ساخت سانس آزاد
        </Typography>
        <form className="mt-4 grid gap-3" onSubmit={addSession}>
          <select
            required
            className={inputClass}
            aria-label="خدمت مربوط به سانس"
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
          {selectedOffering ? (
            <label className="grid gap-2 text-sm">
              شیوه برگزاری سانس
              <select
                className={inputClass}
                value={selectedDeliveryMode}
                onChange={(event) =>
                  setSessionMode(
                    event.target.value as CoachSession["deliveryMode"],
                  )
                }
              >
                {selectedOffering.deliveryModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {
                      {
                        club: "باشگاه",
                        online: "آنلاین",
                        home: "محل ورزشکار",
                        outdoor: "فضای باز",
                      }[mode]
                    }
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <input
            className={inputClass}
            aria-label="عنوان سانس (اختیاری)"
            value={sessionTitle}
            onChange={(event) => setSessionTitle(event.target.value)}
            placeholder="عنوان سانس (اختیاری)"
          />
          <IranDateInput
            required
            withTime
            className={inputClass}
            aria-label="تاریخ و ساعت شروع سانس"
            value={startsAt}
            onValueChange={(dateValue) => setStartsAt(dateValue)}
          />
          {selectedDeliveryMode === "online" ? (
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
                selectedDeliveryMode === "club" ||
                selectedDeliveryMode === "outdoor"
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
                    {new Date(item.startAt).toLocaleString("fa-IR", {
                      timeZone: "Asia/Tehran",
                    })}{" "}
                    · {item.bookedCount.toLocaleString("fa-IR")} از{" "}
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
                          "تاریخ شمسی و ساعت تهران، مثل ۱۴۰۵/۰۶/۲۱ ۱۸:۳۰:",
                          iranDateInputValue(
                            tehranLocalValue(item.startAt),
                            true,
                          ),
                        );
                        if (!value) return;
                        const start = tehranLocalDate(
                          parseIranDateInput(value, true) ?? "",
                        );
                        const duration =
                          new Date(item.endAt).getTime() -
                          new Date(item.startAt).getTime();
                        if (Number.isNaN(start.getTime())) {
                          toast.danger("زمان واردشده معتبر نیست");
                          return;
                        }
                        void rescheduleSession
                          .mutateAsync({
                            sessionId: item.id,
                            startAt: start.toISOString(),
                            endAt: new Date(
                              start.getTime() + duration,
                            ).toISOString(),
                          })
                          .then(() => toast.success("زمان سانس تغییر کرد"))
                          .catch(() =>
                            toast.danger("تغییر زمان سانس انجام نشد"),
                          );
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

      <Card
        hidden={workspaceView !== "enrollments"}
        className="app-card p-5 shadow-none"
      >
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

      <Card
        hidden={workspaceView !== "attendance"}
        className="app-card p-5 shadow-none"
      >
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
                {item.title}،{" "}
                {new Date(item.startAt).toLocaleString("fa-IR", {
                  timeZone: "Asia/Tehran",
                })}
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

      <section hidden={workspaceView !== "bookings"}>
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
                    {new Date(item.sessionStartsAt).toLocaleString("fa-IR", {
                      timeZone: "Asia/Tehran",
                    })}{" "}
                    · {item.priceSnapshot.amount.toLocaleString("fa-IR")} ریال
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
