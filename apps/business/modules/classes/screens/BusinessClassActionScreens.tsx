"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, Card, Input, toast } from "@heroui/react";
import { FormOption, FormSelect } from "@repo/ui/form-select";
import { IranDateInput } from "@repo/ui/iran-date-input";
import { PanelPriceField } from "@/components/form/PanelPriceField";
import {
  useBusinessClass,
  useBusinessClassEnrollments,
  useBusinessClassSessions,
  useClubStudents,
  useEnrollStudentInBusinessClass,
  usePreviewBusinessClassSessionChange,
  useUpdateBusinessClassSession,
} from "@api/business";

const back = (clubId: string, classId: string) =>
  `/clubs/${clubId}/classes/${classId}`;
export function BusinessClassEnrollScreen({
  clubId,
  classId,
}: {
  clubId: string;
  classId: string;
}) {
  const router = useRouter();
  const item = useBusinessClass(clubId, classId);
  const students = useClubStudents(clubId);
  const enrollments = useBusinessClassEnrollments(clubId, classId);
  const enroll = useEnrollStudentInBusinessClass(clubId, classId);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await enroll.mutateAsync({
        studentId: String(data.get("studentId")),
        status: String(data.get("status")) as "active" | "waitlisted",
        agreedPrice: Number(data.get("agreedPrice")),
        paymentStatus: String(data.get("paymentStatus")) as
          "pending" | "paid" | "waived",
        totalSessions: data.get("totalSessions")
          ? Number(data.get("totalSessions"))
          : null,
      });
      toast.success("شاگرد به کلاس اضافه شد");
      router.push(back(clubId, classId));
    } catch {
      toast.danger("ثبت‌نام انجام نشد؛ ظرفیت یا وضعیت شاگرد را بررسی کنید");
    }
  }
  return (
    <main className="flex-1 p-4 lg:p-6">
      <div className="mx-auto max-w-3xl">
        <Link href={back(clubId, classId)} className="text-sm text-accent">
          بازگشت به کلاس
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">
          ثبت‌نام شاگرد در {item.data?.title ?? "کلاس"}
        </h1>
        <Card className="mt-6 p-5">
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm">
              شاگرد
              <FormSelect aria-label="شاگرد" name="studentId" required>
                <FormOption value="">انتخاب شاگرد</FormOption>
                {students.data?.items
                  .filter(
                    (student) =>
                      student.status === "active" &&
                      !enrollments.data?.items.some(
                        (row) =>
                          row.studentId === student.id &&
                          ["active", "waitlisted"].includes(row.status),
                      ),
                  )
                  .map((student) => (
                    <FormOption key={student.id} value={student.id}>
                      {student.firstName} {student.lastName}
                    </FormOption>
                  ))}
              </FormSelect>
            </label>
            <label className="grid gap-2 text-sm">
              وضعیت
              <FormSelect
                aria-label="وضعیت"
                name="status"
                defaultValue="active"
              >
                <FormOption value="active">فعال</FormOption>
                <FormOption value="waitlisted">لیست انتظار</FormOption>
              </FormSelect>
            </label>
            <PanelPriceField
              label="مبلغ توافقی"
              name="agreedPrice"
              minValue={0}
              defaultValue={item.data?.price ?? 0}
              isRequired
            />
            <label className="grid gap-2 text-sm">
              وضعیت پرداخت
              <FormSelect
                aria-label="وضعیت پرداخت"
                name="paymentStatus"
                defaultValue="pending"
              >
                <FormOption value="pending">پرداخت‌نشده</FormOption>
                <FormOption value="paid">پرداخت‌شده</FormOption>
                <FormOption value="waived">رایگان</FormOption>
              </FormSelect>
            </label>
            <label className="grid gap-2 text-sm">
              تعداد جلسات
              <Input
                name="totalSessions"
                type="number"
                min={1}
                defaultValue={item.data?.packageSessionCount ?? undefined}
              />
            </label>
            <div className="flex gap-2 sm:col-span-2">
              <Button
                type="submit"
                variant="primary"
                isPending={enroll.isPending}
              >
                ثبت عضویت
              </Button>
              <Button variant="ghost">
                <Link href={back(clubId, classId)}>انصراف</Link>
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </main>
  );
}

export function BusinessClassRescheduleScreen({
  clubId,
  classId,
  sessionId,
}: {
  clubId: string;
  classId: string;
  sessionId: string;
}) {
  const router = useRouter();
  const sessions = useBusinessClassSessions(clubId, classId);
  const session = sessions.data?.items.find((item) => item.id === sessionId);
  const preview = usePreviewBusinessClassSessionChange(clubId, classId);
  const update = useUpdateBusinessClassSession(clubId, classId);
  const [scope, setScope] = useState<"single" | "future">("single");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      const payload = {
        startsAt: new Date(String(data.get("startsAt"))).toISOString(),
        endsAt: new Date(String(data.get("endsAt"))).toISOString(),
        scope,
      };
      const result = await preview.mutateAsync({ sessionId, payload });
      if (result.conflicts.length) return;
      await update.mutateAsync({ sessionId, payload });
      toast.success("زمان جلسه تغییر کرد");
      router.push(back(clubId, classId));
    } catch {
      toast.danger("جابه‌جایی جلسه انجام نشد");
    }
  }
  const local = (value?: string) =>
    value
      ? new Date(
          new Date(value).getTime() -
            new Date(value).getTimezoneOffset() * 60_000,
        )
          .toISOString()
          .slice(0, 16)
      : "";
  if (sessions.isPending)
    return <main className="p-6">در حال بارگذاری...</main>;
  if (!session) return <main className="p-6">جلسه پیدا نشد.</main>;
  return (
    <main className="flex-1 p-4 lg:p-6">
      <div className="mx-auto max-w-3xl">
        <Link href={back(clubId, classId)} className="text-sm text-accent">
          بازگشت به کلاس
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">جابه‌جایی زمان جلسه</h1>
        <Card className="mt-6 p-5">
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm">
              شروع جدید
              <IranDateInput
                withTime
                name="startsAt"
                required
                defaultValue={local(session.startsAt)}
              />
            </label>
            <label className="grid gap-2 text-sm">
              پایان جدید
              <IranDateInput
                withTime
                name="endsAt"
                required
                defaultValue={local(session.endsAt)}
              />
            </label>
            <label className="grid gap-2 text-sm sm:col-span-2">
              دامنه تغییر
              <FormSelect
                aria-label="دامنه تغییر"
                value={scope}
                onChange={(value) => setScope(value as typeof scope)}
              >
                <FormOption value="single">فقط همین جلسه</FormOption>
                <FormOption value="future">
                  این جلسه و همه جلسات بعدی
                </FormOption>
              </FormSelect>
            </label>
            {!!preview.data?.conflicts.length && (
              <p role="alert" className="text-sm text-danger sm:col-span-2">
                این زمان با{" "}
                {preview.data.conflicts.length.toLocaleString("fa-IR")} برنامه
                دیگر تداخل دارد.
              </p>
            )}
            <div className="flex gap-2 sm:col-span-2">
              <Button
                type="submit"
                variant="primary"
                isPending={preview.isPending || update.isPending}
              >
                بررسی و ثبت
              </Button>
              <Button variant="ghost">
                <Link href={back(clubId, classId)}>انصراف</Link>
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </main>
  );
}
