"use client";
import { FormSelect, FormOption } from "@repo/ui/form-select";
import { Input as HeroInput } from "@heroui/react";
import { useAccountPreference } from "@api/preferences";
import { useSelectedClub, SelectedClubScope } from "@/lib/use-selected-club";
import {
  BranchesScreen,
  CoachesScreen,
} from "@modules/operations/screens/BusinessOperationsScreens";
import { DataExchangeScreen } from "@modules/operations/screens/DataExchangeScreen/DataExchangeScreen";
import { ReservationManagementScreen } from "@modules/clubs/screens/ReservationManagementScreen";
import { StudentAccounts } from "./student-accounts";
import { ReceptionDesk } from "./reception-desk";
import { AttendanceHistory } from "./attendance-history";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Spinner, toast } from "@heroui/react";
import { useBusinessBenefitProducts } from "@api";
import {
  useLogout,
  useClubStudents,
  useCreateClubStudent,
  useClubPayments,
  useCreateClubPayment,
  useBusinessClasses,
  useBusinessClassSessions,
  useBusinessClassEnrollments,
  useBusinessClassAttendance,
  useRecordBusinessClassAttendance,
} from "@api/business";
import { IranDateInput } from "@repo/ui/iran-date-input";
import {
  asciiDigits,
  tehranLocalDate,
  tehranLocalValue,
} from "@repo/ui/iran-date";
import { BusinessClassFormScreen } from "@modules/classes/screens/BusinessClassesScreens";

const field =
  "h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm";
const when = (date: string) =>
  new Date(date).toLocaleString("fa-IR", { timeZone: "Asia/Tehran" });

export function StaffWorkspace({
  initialClubId = "",
  initialClassId = "",
}: {
  initialClubId?: string;
  initialClassId?: string;
}) {
  const { clubs, clubId: savedClubId, setClubId: saveClub } = useSelectedClub();
  const router = useRouter();
  const logout = useLogout();
  const [selection, setSelection] = useState(initialClubId);
  const picked = selection || savedClubId;
  const setPicked = (id: string) => {
    setSelection(id);
    saveClub(id);
  };
  const [selectedClass, setSelectedClass] = useState(initialClassId);
  const club =
    clubs.data?.items.find((item) => item.id === picked) ??
    clubs.data?.items[0];
  const [tab, setTab] = useAccountPreference(`staff-tab:${club?.id ?? ""}`);
  const can = (permission: string) =>
    Boolean(club?.permissions?.includes(permission));
  const tabs = [
    { id: "reception", label: "میز پذیرش", allowed: can("reception.read") },
    { id: "classes", label: "کلاس و حضور", allowed: can("classes.read") },
    { id: "coaches", label: "مربیان", allowed: can("coaches.write") },
    { id: "branches", label: "شعبه‌ها", allowed: can("branches.write") },
    {
      id: "reservations",
      label: "زمین و سانس",
      allowed: can("courts.write") && can("reservations.write"),
    },
    {
      id: "reports",
      label: "گزارش و تبادل داده",
      allowed: can("reports.read"),
    },
    { id: "students", label: "شاگردان", allowed: can("students.read") },
    { id: "payments", label: "پرداخت‌ها", allowed: can("payments.read") },
    {
      id: "memberships",
      label: "قراردادهای عضویت",
      allowed: can("memberships.read"),
    },
  ].filter((item) => item.allowed);
  const active = tabs.some((item) => item.id === tab) ? tab : tabs[0]?.id;
  if (clubs.isPending) return <Spinner aria-label="دریافت دسترسی باشگاه" />;
  return (
    <main className="business-panel mx-auto min-h-screen w-full max-w-5xl space-y-5 p-5">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-surface p-5">
        <div>
          <h1 className="text-2xl font-bold">محیط کار پرسنل</h1>
          <p className="mt-2 text-sm text-muted">
            عملیات مجاز شما در باشگاه انتخاب‌شده
          </p>
        </div>
        <Button
          variant="ghost"
          isPending={logout.isPending}
          onPress={() =>
            void logout
              .mutateAsync()
              .catch(() => undefined)
              .finally(() => router.replace("/auth"))
          }
        >
          خروج
        </Button>
      </header>
      {clubs.isError ? (
        <Card className="p-5">
          <p role="alert">دسترسی قابل دریافت نیست.</p>
          <Button onPress={() => void clubs.refetch()}>تلاش دوباره</Button>
        </Card>
      ) : !club ? (
        <Card className="p-5">
          دعوت فعالی ندارید؛ دعوت باشگاه را با حساب خودتان بپذیرید.
        </Card>
      ) : (
        <>
          <label className="grid gap-2 text-sm">
            باشگاه
            <FormSelect
              aria-label="باشگاه محل کار"
              className={field}
              value={club.id}
              onChange={(event) => {
                setPicked(event);
                setTab("");
              }}
            >
              {clubs.data?.items.map((item) => (
                <FormOption entity={item} key={item.id} value={item.id}>
                  {item.name}
                </FormOption>
              ))}
            </FormSelect>
          </label>
          <nav className="flex flex-wrap gap-2" aria-label="عملیات پرسنل">
            {tabs.map((item) => (
              <Button
                key={item.id}
                variant={active === item.id ? "primary" : "secondary"}
                onPress={() => setTab(item.id)}
              >
                {item.label}
              </Button>
            ))}
          </nav>
          <SelectedClubScope.Provider value={club.id}>
            <div key={`${club.id}-${active}`}>
              {active === "coaches" && <CoachesScreen />}
              {active === "branches" && <BranchesScreen />}
              {active === "reports" && <DataExchangeScreen />}
              {active === "reservations" && (
                <ReservationManagementScreen clubId={club.id} />
              )}
              {active === "reception" && (
                <ReceptionDesk
                  clubId={club.id}
                  onOpenClass={(id) => {
                    setSelectedClass(id);
                    setTab("classes");
                  }}
                />
              )}
              {active === "students" && (
                <StaffStudents
                  clubId={club.id}
                  writable={can("students.write")}
                />
              )}
              {active === "payments" && (
                <StaffPayments
                  clubId={club.id}
                  writable={can("payments.write")}
                />
              )}
              {active === "classes" && (
                <StaffClasses
                  clubId={club.id}
                  writable={can("attendance.write")}
                  canCreate={can("classes.write")}
                  initialClassId={selectedClass}
                />
              )}
              {active === "memberships" && (
                <StaffMemberships clubId={club.id} />
              )}
            </div>
          </SelectedClubScope.Provider>
        </>
      )}
    </main>
  );
}
function StaffStudents({
  clubId,
  writable,
}: {
  clubId: string;
  writable: boolean;
}) {
  const query = useClubStudents(clubId);
  const create = useCreateClubStudent(clubId);
  const [search, setSearch] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await create.mutateAsync({
        firstName: String(data.get("firstName")),
        lastName: String(data.get("lastName")),
        phone: asciiDigits(String(data.get("phone"))),
        sport: "",
        membershipTitle: "",
        membershipEndsAt: null,
        status: "active",
        notes: "",
      });
      form.reset();
      toast.success("شاگرد ثبت شد");
    } catch {
      toast.danger("ثبت شاگرد انجام نشد؛ شماره و دسترسی را بررسی کنید");
    }
  };
  return (
    <Card className="space-y-4 p-5">
      <h2 className="font-bold">شاگردان باشگاه</h2>
      {writable && (
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <label>
            نام
            <HeroInput
              required
              minLength={2}
              name="firstName"
              className={field}
            />
          </label>
          <label>
            نام خانوادگی
            <HeroInput
              required
              minLength={2}
              name="lastName"
              className={field}
            />
          </label>
          <label>
            موبایل
            <HeroInput
              required
              name="phone"
              inputMode="tel"
              className={field}
            />
          </label>
          <Button type="submit" isPending={create.isPending}>
            ثبت شاگرد
          </Button>
        </form>
      )}
      <HeroInput
        aria-label="جست‌وجوی شاگرد"
        placeholder="نام یا موبایل"
        className={field}
        value={search}
        onChange={(event) => setSearch(asciiDigits(event.target.value))}
      />
      {query.isError ? (
        <p role="alert">فهرست شاگردان قابل دریافت نیست.</p>
      ) : query.isPending ? (
        <Spinner />
      ) : (
        <ul className="divide-y divide-border">
          {query.data?.items
            .filter((item) =>
              `${item.firstName} ${item.lastName} ${item.phone}`.includes(
                search,
              ),
            )
            .map((item) => (
              <li key={item.id} className="py-3">
                {item.firstName} {item.lastName}
                <span className="ms-3 text-muted" dir="ltr">
                  {item.phone}
                </span>
              </li>
            ))}
        </ul>
      )}
    </Card>
  );
}
function StaffPayments({
  clubId,
  writable,
}: {
  clubId: string;
  writable: boolean;
}) {
  const [studentId, setStudentId] = useState("");
  const query = useClubPayments(clubId);
  const students = useClubStudents(clubId);
  const create = useCreateClubPayment(clubId);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await create.mutateAsync({
        studentId,
        type: "tuition",
        title: String(data.get("title")),
        amount: Number(asciiDigits(String(data.get("amount")))),
        currency: "IRR",
        paidAt: tehranLocalDate(`${data.get("paidAt")}T12:00`).toISOString(),
        method: String(data.get("method")) as "cash",
        notes: "",
      });
      form.reset();
      toast.success("رسید پرداخت دستی ثبت شد");
    } catch {
      toast.danger("ثبت رسید انجام نشد؛ مبلغ، شاگرد و دسترسی را بررسی کنید");
    }
  };
  return (
    <div>
      <StudentAccounts
        clubId={clubId}
        writable={writable}
        selectedStudentId={studentId}
        onStudentChange={setStudentId}
      />
      <Card className="space-y-4 p-5">
        <h2 className="font-bold">پرداخت‌های ثبت‌شده</h2>
        {writable && (
          <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
            <p className="text-sm sm:col-span-2">
              رسید برای:{" "}
              {students.data?.items
                .filter((item) => item.id === studentId)
                .map((item) => `${item.firstName} ${item.lastName}`)
                .join("") || "ابتدا حساب شاگرد را انتخاب کنید"}
            </p>
            <label>
              عنوان رسید
              <HeroInput
                required
                minLength={2}
                name="title"
                className={field}
              />
            </label>
            <label>
              مبلغ (ریال)
              <HeroInput
                required
                name="amount"
                inputMode="numeric"
                className={field}
              />
            </label>
            <label>
              تاریخ پرداخت
              <IranDateInput
                required
                name="paidAt"
                defaultValue={tehranLocalValue(new Date().toISOString()).slice(
                  0,
                  10,
                )}
                className={field}
              />
            </label>
            <label>
              روش پرداخت
              <FormSelect
                aria-label="روش پرداخت"
                name="method"
                className={field}
              >
                <FormOption value="card">کارتخوان</FormOption>
                <FormOption value="cash">نقدی</FormOption>
                <FormOption value="transfer">کارت‌به‌کارت</FormOption>
              </FormSelect>
            </label>
            <Button
              type="submit"
              isDisabled={!studentId}
              isPending={create.isPending}
            >
              ثبت رسید دستی
            </Button>
            <p className="text-xs text-muted sm:col-span-2">
              این فرم فقط رسیدِ پرداخت انجام‌شده را ثبت می‌کند. پرداخت درون اپ
              همچنان شبیه‌سازی است.
            </p>
          </form>
        )}
        {query.isError ? (
          <p role="alert">فهرست پرداخت‌ها قابل دریافت نیست.</p>
        ) : query.isPending ? (
          <Spinner />
        ) : (
          <ul className="divide-y divide-border">
            {query.data?.items
              .filter((item) => !studentId || item.studentId === studentId)
              .map((item) => (
                <li key={item.id} className="py-3">
                  {item.title} · {item.amount.toLocaleString("fa-IR")}{" "}
                  {item.currency === "IRR" ? "ریال" : item.currency}
                  <p className="text-xs text-muted">
                    {when(item.paidAt)}
                    {item.voidedAt
                      ? " · باطل‌شده"
                      : (item.refundedAmount ?? 0) > 0
                        ? ` · برگشتی: ${item.refundedAmount?.toLocaleString("fa-IR")} ریال`
                        : ""}
                  </p>
                </li>
              ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
function StaffClasses({
  clubId,
  writable,
  canCreate,
  initialClassId,
}: {
  clubId: string;
  writable: boolean;
  canCreate: boolean;
  initialClassId?: string;
}) {
  const classes = useBusinessClasses(clubId);
  const [classId, setClassId] = useState(initialClassId ?? "");
  const [sessionId, setSessionId] = useState("");
  const [creating, setCreating] = useState(false);
  const current = classId || classes.data?.items[0]?.id || "";
  const sessions = useBusinessClassSessions(clubId, current);
  const enrollments = useBusinessClassEnrollments(clubId, current);
  const attendance = useBusinessClassAttendance(clubId, current, sessionId);
  const record = useRecordBusinessClassAttendance(clubId, current, sessionId);
  if (creating)
    return (
      <>
        <Button variant="ghost" onPress={() => setCreating(false)}>
          بازگشت به کلاس‌ها
        </Button>
        <BusinessClassFormScreen clubId={clubId} />
      </>
    );
  return (
    <Card className="space-y-4 p-5">
      <div className="flex justify-between">
        <h2 className="font-bold">کلاس و حضور</h2>
        {canCreate && (
          <Button onPress={() => setCreating(true)}>کلاس جدید</Button>
        )}
      </div>
      {classes.isError ? (
        <p role="alert">کلاس‌ها قابل دریافت نیستند.</p>
      ) : classes.isPending ? (
        <Spinner />
      ) : (
        <>
          <label>
            کلاس
            <FormSelect
              aria-label="کلاس"
              className={field}
              value={current}
              onChange={(event) => {
                setClassId(event);
                setSessionId("");
              }}
            >
              {classes.data?.items.map((item) => (
                <FormOption entity={item} key={item.id} value={item.id}>
                  {item.title}
                </FormOption>
              ))}
            </FormSelect>
          </label>
          <label>
            جلسه
            <FormSelect
              aria-label="جلسه"
              className={field}
              value={sessionId}
              onChange={(event) => setSessionId(event)}
            >
              <FormOption value="">انتخاب جلسه</FormOption>
              {sessions.data?.items
                .filter((item) => item.status !== "cancelled")
                .map((item) => (
                  <FormOption entity={item} key={item.id} value={item.id}>
                    {when(item.startsAt)}
                  </FormOption>
                ))}
            </FormSelect>
          </label>
          {enrollments.isError || attendance.isError ? (
            <p role="alert">فهرست حضور قابل دریافت نیست.</p>
          ) : (
            <ul className="divide-y divide-border">
              {enrollments.data?.items
                .filter((item) => ["active", "completed"].includes(item.status))
                .map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <span>
                      {item.studentName || `شاگرد ${item.studentId.slice(-6)}`}
                    </span>
                    <span>
                      {(
                        {
                          present: "حاضر",
                          absent: "غایب",
                          excused: "موجه",
                        } as Record<string, string>
                      )[
                        attendance.data?.items.find(
                          (row) => row.studentId === item.studentId,
                        )?.status ?? ""
                      ] ?? "ثبت نشده"}
                    </span>
                    {writable && sessionId && (
                      <div className="flex gap-2">
                        {(
                          [
                            ["present", "حاضر"],
                            ["absent", "غایب"],
                            ["excused", "موجه"],
                          ] as const
                        ).map(([status, label]) => (
                          <Button
                            key={status}
                            size="sm"
                            isDisabled={record.isPending}
                            onPress={() =>
                              void record
                                .mutateAsync([
                                  {
                                    studentId: item.studentId,
                                    status,
                                    notes: "",
                                  },
                                ])
                                .then(() => toast.success("حضور ثبت شد"))
                                .catch(() =>
                                  toast.danger(
                                    "حضور ثبت نشد؛ عضویت و دسترسی را بررسی کنید",
                                  ),
                                )
                            }
                          >
                            {label}
                          </Button>
                        ))}
                      </div>
                    )}
                    <AttendanceHistory
                      changes={
                        attendance.data?.items.find(
                          (row) => row.studentId === item.studentId,
                        )?.changes
                      }
                    />
                  </li>
                ))}
            </ul>
          )}
        </>
      )}
    </Card>
  );
}
function StaffMemberships({ clubId }: { clubId: string }) {
  const products = useBusinessBenefitProducts(clubId);
  return (
    <Card className="space-y-3 p-5">
      <h2 className="font-bold">قراردادهای عضویت</h2>
      {products.isError ? (
        <p role="alert">قراردادها قابل دریافت نیستند.</p>
      ) : (
        products.data?.items.map((item) => (
          <div key={item.id}>
            {item.title} · {item.price.toLocaleString("fa-IR")} ریال ·{" "}
            {item.validityDays.toLocaleString("fa-IR")} روز
          </div>
        ))
      )}
    </Card>
  );
}
