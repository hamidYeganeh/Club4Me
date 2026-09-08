"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { Button, Card, Chip, toast, Typography } from "@heroui/react";
import {
  useCoachClubClass,
  useCoachClubClassAttendance,
  useCoachClubClassEnrollments,
  useCreateCoachCalendarFeed,
  useRevokeCoachCalendarFeed,
  useGenerateCoachClassCheckIn,
  useRecordCoachClubClassAttendance,
  useUpdateCoachClubClassSession,
  type CoachClubClassAttendance,
} from "@api";
import { getApiConfig } from "@api";
import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";
import {
  CompactCardListSkeleton,
  DashboardPageSkeleton,
} from "@/components/loading-skeletons";

const statusLabel: Record<string, string> = {
  pending: "در انتظار تأیید",
  active: "فعال",
  waitlisted: "لیست انتظار",
  completed: "تمام‌شده",
  cancelled: "لغوشده",
};

export function CoachClubClassScreen({ classId }: { classId: string }) {
  const detail = useCoachClubClass(classId);
  const enrollments = useCoachClubClassEnrollments(classId);
  const sessions = detail.data?.sessions ?? [];
  const [pickedSession, setPickedSession] = useState("");
  const sessionId =
    pickedSession ||
    sessions.find((item) => item.status === "scheduled")?.id ||
    sessions[0]?.id ||
    "";
  const attendance = useCoachClubClassAttendance(classId, sessionId);
  const record = useRecordCoachClubClassAttendance(classId, sessionId);
  const updateSession = useUpdateCoachClubClassSession(classId);
  const calendarFeed = useCreateCoachCalendarFeed();
  const revokeCalendarFeed = useRevokeCoachCalendarFeed();
  const generateCheckIn = useGenerateCoachClassCheckIn(classId, sessionId);
  const [credential, setCredential] = useState<{
    code: string;
    qrPayload: string;
    expiresAt: string;
  } | null>(null);
  const [draft, setDraft] = useState<
    Record<string, "present" | "absent" | "excused">
  >({});
  const rows = attendance.data?.items ?? [];
  const currentSession = sessions.find((item) => item.id === sessionId);
  const stats = useMemo(
    () => ({
      active:
        enrollments.data?.items.filter((item) => item.status === "active")
          .length ?? 0,
      paid:
        enrollments.data?.items.filter((item) =>
          ["paid", "waived"].includes(item.paymentStatus),
        ).length ?? 0,
    }),
    [enrollments.data?.items],
  );

  if (detail.isPending) return <DashboardPageSkeleton />;
  const item = detail.data;
  if (!item)
    return (
      <main className="app-page coach-workspace">
        <SecondaryHeader showFilter={false} title="کلاس باشگاه" />
        <Card className="app-card p-6 text-center shadow-none">
          این کلاس به شما تخصیص داده نشده است.
        </Card>
      </main>
    );

  const saveAttendance = async () => {
    const items = rows.map((row) => ({
      studentId: row.studentId,
      status:
        draft[row.studentId] ??
        (row.status === "unrecorded" ? "absent" : row.status),
      notes: row.notes,
    })) as Array<{
      studentId: string;
      status: "present" | "absent" | "excused";
      notes: string;
    }>;
    if (!items.length) return;
    try {
      await record.mutateAsync(items);
      setDraft({});
      toast.success("حضور‌وغیاب ذخیره شد");
    } catch {
      toast.danger("ذخیره حضور‌وغیاب انجام نشد");
    }
  };
  const changeSession = async (status: "completed" | "cancelled") => {
    if (!currentSession) return;
    try {
      await updateSession.mutateAsync({
        sessionId: currentSession.id,
        payload: { status },
      });
      toast.success(
        status === "completed" ? "جلسه تمام‌شده ثبت شد" : "جلسه لغو شد",
      );
    } catch {
      toast.danger("تغییر وضعیت جلسه انجام نشد");
    }
  };

  return (
    <main className="app-page coach-workspace gap-5">
      <SecondaryHeader showFilter={false} title="مدیریت کلاس باشگاه" />
      <Card className="app-card rounded-3xl bg-linear-to-t from-accent/15 to-surface p-5 shadow-none">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Typography type="h3" weight="bold">
              {item.title}
            </Typography>
            <p className="mt-2 text-sm text-muted">
              {item.club.name}
              {item.branch ? ` · ${item.branch.name}` : ""}
            </p>
          </div>
          <Chip
            size="sm"
            color={item.status === "active" ? "success" : "default"}
            variant="soft"
          >
            {item.status === "active" ? "فعال" : item.status}
          </Chip>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          <Stat value={stats.active} label="شاگرد فعال" />
          <Stat value={stats.paid} label="تسویه‌شده" />
          <Stat value={sessions.length} label="جلسه" />
        </div>
        <Button
          className="mt-4 w-full"
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
          اشتراک تقویم کلاس‌ها
        </Button>
        <Button
          className="mt-2 w-full"
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
      </Card>

      <Card className="app-card rounded-3xl p-5 shadow-none">
        <Card.Title>جلسه و حضور‌وغیاب</Card.Title>
        <p className="mt-2 mb-4 text-sm leading-7 text-muted">جلسه را انتخاب کنید؛ سپس وضعیت حضور شاگردها را ثبت کنید.</p>
        <select
          className="mt-4 h-11 w-full rounded-xl border border-white/10 bg-surface-secondary px-3 text-sm"
          value={sessionId}
          onChange={(event) => setPickedSession(event.target.value)}
        >
          {!sessions.length ? (
            <option value="">جلسه‌ای وجود ندارد</option>
          ) : null}
          {sessions.map((session) => (
            <option key={session.id} value={session.id}>
              {new Date(session.startsAt).toLocaleString("fa-IR", {
                dateStyle: "medium",
                timeStyle: "short",
              })}{" "}
              ·{" "}
              {session.status === "scheduled"
                ? "برنامه‌ریزی‌شده"
                : session.status === "completed"
                  ? "تمام‌شده"
                  : "لغوشده"}
            </option>
          ))}
        </select>
        {attendance.isPending && sessionId ? (
          <div className="mt-5">
            <CompactCardListSkeleton count={3} />
          </div>
        ) : null}
        <div className="mt-4 flex flex-col gap-3">
          {rows.map((row) => (
            <AttendanceRow
              key={row.studentId}
              row={row}
              value={draft[row.studentId] ?? row.status}
              onChange={(value) =>
                setDraft((current) => ({ ...current, [row.studentId]: value }))
              }
            />
          ))}
          {!attendance.isPending && sessionId && !rows.length ? (
            <p className="py-4 text-center text-sm text-muted">
              شاگرد فعالی برای حضور‌وغیاب وجود ندارد.
            </p>
          ) : null}
        </div>
        {rows.length ? (
          <Button
            className="mt-4 w-full"
            variant="primary"
            isPending={record.isPending}
            onPress={() => void saveAttendance()}
          >
            ذخیره حضور‌وغیاب
          </Button>
        ) : null}
        {currentSession?.status === "scheduled" ? (
          <Button
            className="mt-3 w-full"
            variant="primary"
            isPending={generateCheckIn.isPending}
            onPress={async () => {
              try {
                setCredential(await generateCheckIn.mutateAsync(15));
              } catch {
                toast.danger("ساخت کد ورود انجام نشد");
              }
            }}
          >
            ساخت QR و کد ۵ رقمی ورود
          </Button>
        ) : null}
        {credential ? <CoachCheckInCard credential={credential} /> : null}
        {currentSession?.status === "scheduled" ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              onPress={() => void changeSession("completed")}
            >
              اتمام جلسه
            </Button>
            <Button
              variant="danger-soft"
              onPress={() => void changeSession("cancelled")}
            >
              لغو جلسه
            </Button>
          </div>
        ) : null}
      </Card>

      <Card className="app-card rounded-3xl p-5 shadow-none">
        <Card.Title>شاگردهای کلاس</Card.Title>
        <p className="mt-2 text-sm leading-7 text-muted">فهرست اعضا و وضعیت ثبت‌نام در این کلاس.</p>
        <div className="mt-4 flex flex-col gap-2">
          {(enrollments.data?.items ?? []).map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between gap-3 rounded-2xl bg-surface-secondary p-3"
            >
              <div>
                <p className="text-sm font-bold">
                  {entry.student?.name ?? "شاگرد"}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {entry.student?.phone}
                </p>
              </div>
              <div className="text-end">
                <Chip
                  size="sm"
                  variant="soft"
                  color={
                    entry.status === "active"
                      ? "success"
                      : entry.status === "pending"
                        ? "warning"
                        : "default"
                  }
                >
                  {statusLabel[entry.status] ?? entry.status}
                </Chip>
                <p className="mt-1 text-[11px] text-muted">
                  {["paid", "waived"].includes(entry.paymentStatus)
                    ? "تسویه"
                    : "پرداخت‌نشده"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </main>
  );
}

function CoachCheckInCard({
  credential,
}: {
  credential: { code: string; qrPayload: string; expiresAt: string };
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvas.current)
      void QRCode.toCanvas(canvas.current, credential.qrPayload, {
        width: 220,
        margin: 1,
      });
  }, [credential.qrPayload]);
  return (
    <div className="mt-4 grid justify-items-center rounded-2xl bg-surface-secondary p-4 text-center">
      <canvas ref={canvas} className="rounded-xl bg-white p-2" />
      <p className="mt-3 text-xs text-muted">کد جایگزین</p>
      <strong dir="ltr" className="mt-1 text-3xl tracking-[.35em]">
        {credential.code}
      </strong>
      <p className="mt-2 text-xs text-muted">
        معتبر تا{" "}
        {new Date(credential.expiresAt).toLocaleTimeString("fa-IR", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-background/35 p-3">
      <strong className="block text-xl">{value.toLocaleString("fa-IR")}</strong>
      <span className="mt-1 block text-xs text-muted">{label}</span>
    </div>
  );
}
function AttendanceRow({
  row,
  value,
  onChange,
}: {
  row: CoachClubClassAttendance;
  value: CoachClubClassAttendance["status"];
  onChange: (value: "present" | "absent" | "excused") => void;
}) {
  return (
    <div className="rounded-2xl bg-surface-secondary p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold">{row.student.name}</p>
          <p className="text-xs text-muted">{row.student.phone}</p>
        </div>
        <div className="flex gap-1">
          {(["present", "absent", "excused"] as const).map((status) => (
            <Button
              key={status}
              size="sm"
              variant={value === status ? "primary" : "ghost"}
              onPress={() => onChange(status)}
            >
              {status === "present"
                ? "حاضر"
                : status === "absent"
                  ? "غایب"
                  : "موجه"}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
