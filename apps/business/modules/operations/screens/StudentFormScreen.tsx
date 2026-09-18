"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, Card, Input, toast } from "@heroui/react";
import { FormOption, FormSelect } from "@repo/ui/form-select";
import { IranDateInput } from "@repo/ui/iran-date-input";
import { usePublicCatalogResource } from "@api";
import {
  useClubStudents,
  useCreateClubStudent,
  useUpdateClubStudent,
} from "@api/business";
import { IRANIAN_PHONE_INPUT_PATTERN } from "@/lib/phone";
import { useSelectedClub } from "@/lib/use-selected-club";

export function StudentFormScreen({
  requestedClubId,
  studentId,
}: {
  requestedClubId?: string;
  studentId?: string;
}) {
  const router = useRouter();
  const { clubs, clubId: defaultClubId } = useSelectedClub();
  const clubId = clubs.data?.items.some((club) => club.id === requestedClubId)
    ? requestedClubId!
    : defaultClubId;
  const club = clubs.data?.items.find((item) => item.id === clubId);
  const students = useClubStudents(clubId);
  const student = students.data?.items.find((item) => item.id === studentId);
  const sports = usePublicCatalogResource("sports", "sport", { limit: 100 });
  const allowed = (sports.data?.items ?? []).filter((item) =>
    club?.sportIds.includes(item.id),
  );
  const create = useCreateClubStudent(clubId);
  const update = useUpdateClubStudent(clubId);
  const [sport, setSport] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = {
      firstName: String(data.get("firstName")).trim(),
      lastName: String(data.get("lastName")).trim(),
      phone: String(data.get("phone")).trim(),
      sport: sport ?? student?.sport ?? "",
      membershipTitle: String(data.get("membershipTitle") ?? ""),
      membershipEndsAt: data.get("membershipEndsAt")
        ? new Date(String(data.get("membershipEndsAt"))).toISOString()
        : null,
      notes: String(data.get("notes") ?? ""),
      status: student?.status ?? ("active" as const),
    };
    try {
      if (studentId) await update.mutateAsync({ id: studentId, payload });
      else await create.mutateAsync(payload);
      toast.success("پروندهٔ شاگرد ذخیره شد");
      router.push("/students");
    } catch {
      toast.danger("ذخیره شاگرد انجام نشد؛ شماره تماس و رشته را بررسی کنید");
    }
  }
  if (studentId && students.isPending)
    return <main className="p-6">در حال بارگذاری...</main>;
  if (studentId && !student)
    return <main className="p-6">شاگرد پیدا نشد.</main>;
  return (
    <main className="flex-1 p-4 lg:p-6">
      <div className="mx-auto max-w-3xl">
        <Link href="/students" className="text-sm text-accent">
          بازگشت به شاگردها
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">
          {studentId ? "ویرایش شاگرد" : "ثبت شاگرد"}
        </h1>
        <p className="mt-1 text-sm text-muted">باشگاه: {club?.name ?? "—"}</p>
        <Card className="mt-6 app-card p-5 shadow-none active:scale-100">
          <form
            key={student?.id ?? clubId}
            onSubmit={submit}
            className="grid gap-4 sm:grid-cols-2"
          >
            <label className="grid gap-2 text-sm">
              نام
              <Input
                variant="secondary"
                name="firstName"
                required
                minLength={2}
                defaultValue={student?.firstName}
              />
            </label>
            <label className="grid gap-2 text-sm">
              نام خانوادگی
              <Input
                variant="secondary"
                name="lastName"
                required
                minLength={2}
                defaultValue={student?.lastName}
              />
            </label>
            <label className="grid gap-2 text-sm">
              شماره تماس
              <Input
                variant="secondary"
                name="phone"
                required
                type="tel"
                dir="ltr"
                inputMode="tel"
                pattern={IRANIAN_PHONE_INPUT_PATTERN}
                title="مثال: 09383729627، 9383729627 یا 989383729627"
                defaultValue={student?.phone}
              />
            </label>
            <label className="grid gap-2 text-sm">
              ورزش
              <FormSelect
                aria-label="ورزش"
                required
                value={sport ?? student?.sport ?? ""}
                onChange={setSport}
                disabled={!allowed.length}
              >
                <FormOption value="">انتخاب از ورزش‌های باشگاه</FormOption>
                {allowed.map((item) => (
                  <FormOption key={item.id} value={item.name}>
                    {item.name}
                  </FormOption>
                ))}
              </FormSelect>
            </label>
            <label className="grid gap-2 text-sm">
              عنوان عضویت
              <Input
                variant="secondary"
                name="membershipTitle"
                defaultValue={student?.membershipTitle}
              />
            </label>
            <label className="grid gap-2 text-sm">
              پایان عضویت
              <IranDateInput
                name="membershipEndsAt"
                defaultValue={student?.membershipEndsAt?.slice(0, 10)}
              />
            </label>
            <label className="grid gap-2 text-sm sm:col-span-2">
              یادداشت
              <textarea
                name="notes"
                rows={4}
                defaultValue={student?.notes}
                className="rounded-xl border border-default p-3"
              />
            </label>
            <div className="flex gap-2 sm:col-span-2">
              <Button
                type="submit"
                variant="primary"
                isPending={create.isPending || update.isPending}
                isDisabled={!clubId || !allowed.length}
              >
                ذخیره
              </Button>
              <Button variant="ghost">
                <Link href="/students">انصراف</Link>
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </main>
  );
}
