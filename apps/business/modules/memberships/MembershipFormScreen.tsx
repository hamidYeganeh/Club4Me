"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, Card, Input, toast } from "@heroui/react";
import { FormOption, FormSelect } from "@repo/ui/form-select";
import { PanelPriceField } from "@/components/form/PanelPriceField";
import { useCreateBenefitProduct, type BenefitProduct } from "@api";
import { useInviteBusinessClubMember } from "@api/business";
import { IRANIAN_PHONE_INPUT_PATTERN } from "@/lib/phone";
import { useSelectedClub } from "@/lib/use-selected-club";

export function MembershipFormScreen({
  requestedClubId,
  mode,
}: {
  requestedClubId?: string;
  mode: "product" | "invite";
}) {
  const router = useRouter();
  const { clubs, clubId: defaultClubId } = useSelectedClub();
  const clubId = clubs.data?.items.some((club) => club.id === requestedClubId)
    ? requestedClubId!
    : defaultClubId;
  const create = useCreateBenefitProduct(clubId);
  const invite = useInviteBusinessClubMember(clubId);
  const [type, setType] = useState<BenefitProduct["type"]>("session_pack");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      if (mode === "invite")
        await invite.mutateAsync({
          phone: String(data.get("phone")),
          role: String(data.get("role")) as
            "manager" | "receptionist" | "finance" | "coach",
          permissions: [],
        });
      else
        await create.mutateAsync({
          accessClubIds: data.getAll("accessClubIds").map(String),
          title: String(data.get("title")),
          description: String(data.get("description") ?? ""),
          type,
          price: Number(data.get("price")),
          validityDays: Number(data.get("validityDays")),
          maxPauseDays: Number(data.get("maxPauseDays")),
          sessionCount:
            type === "session_pack" ? Number(data.get("limit")) : null,
          weeklyLimit:
            type === "time_membership" ? Number(data.get("limit")) : null,
          sessionTypes: data.getAll(
            "sessionTypes",
          ) as BenefitProduct["sessionTypes"],
        });
      toast.success(mode === "invite" ? "دعوت ثبت شد" : "محصول عضویت ساخته شد");
      router.push("/memberships");
    } catch {
      toast.danger("ثبت انجام نشد؛ داده‌ها را بررسی کنید");
    }
  }
  const field = "grid gap-2 text-sm";
  return (
    <main className="flex-1 p-4 lg:p-6">
      <div className="mx-auto max-w-3xl">
        <Link href="/memberships" className="text-sm text-accent">
          بازگشت به عضویت‌ها
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">
          {mode === "invite" ? "دعوت عضو تیم" : "محصول عضویت جدید"}
        </h1>
        <Card className="mt-6 app-card p-5 shadow-none active:scale-100">
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <p className="text-sm text-muted sm:col-span-2">
              باشگاه:{" "}
              {clubs.data?.items.find((club) => club.id === clubId)?.name ??
                "—"}
            </p>
            {mode === "invite" ? (
              <>
                <label className={field}>
                  شماره موبایل
                  <Input
                    variant="secondary"
                    name="phone"
                    type="tel"
                    dir="ltr"
                    inputMode="tel"
                    required
                    pattern={IRANIAN_PHONE_INPUT_PATTERN}
                    title="مثال: 09383729627، 9383729627 یا 989383729627"
                  />
                </label>
                <label className={field}>
                  نقش
                  <FormSelect
                    aria-label="نقش"
                    name="role"
                    defaultValue="manager"
                  >
                    <FormOption value="manager">مدیر</FormOption>
                    <FormOption value="receptionist">پذیرش</FormOption>
                    <FormOption value="finance">مالی</FormOption>
                    <FormOption value="coach">مربی</FormOption>
                  </FormSelect>
                </label>
              </>
            ) : (
              <>
                <label className={field}>
                  عنوان
                  <Input variant="secondary" name="title" minLength={3} required />
                </label>
                <label className={field}>
                  نوع
                  <FormSelect
                    aria-label="نوع"
                    value={type}
                    onChange={(value) =>
                      setType(value as BenefitProduct["type"])
                    }
                  >
                    <FormOption value="session_pack">بسته تعدادجلسه</FormOption>
                    <FormOption value="time_membership">عضویت زمانی</FormOption>
                  </FormSelect>
                </label>
                <PanelPriceField
                  label="قیمت (ریال)"
                  name="price"
                  minValue={1}
                  isRequired
                />
                <label className={field}>
                  اعتبار (روز)
                  <Input
                    variant="secondary"
                    name="validityDays"
                    type="number"
                    min={1}
                    max={730}
                    defaultValue={30}
                    required
                  />
                </label>
                <label className={field}>
                  حداکثر توقف (روز)
                  <Input
                    variant="secondary"
                    name="maxPauseDays"
                    type="number"
                    min={0}
                    max={90}
                    defaultValue={0}
                  />
                </label>
                <label className={field}>
                  {type === "session_pack"
                    ? "تعداد جلسه"
                    : "حداکثر استفاده هفتگی"}
                  <Input
                    variant="secondary"
                    name="limit"
                    type="number"
                    min={1}
                    required
                  />
                </label>
                <fieldset className="sm:col-span-2">
                  <legend>قابل استفاده برای</legend>
                  {[
                    ["court", "زمین"],
                    ["class", "کلاس"],
                    ["coached_session", "جلسه مربی"],
                  ].map(([value, label]) => (
                    <label
                      key={value}
                      className="ms-3 inline-flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        name="sessionTypes"
                        value={value}
                        defaultChecked
                      />
                      {label}
                    </label>
                  ))}
                </fieldset>
                <fieldset className="sm:col-span-2">
                  <legend>باشگاه‌های مجاز دیگر</legend>
                  {clubs.data?.items
                    .filter((club) => club.id !== clubId)
                    .map((club) => (
                      <label key={club.id} className="block py-1 text-sm">
                        <input
                          type="checkbox"
                          name="accessClubIds"
                          value={club.id}
                        />{" "}
                        {club.name}
                      </label>
                    ))}
                </fieldset>
                <label className={`${field} sm:col-span-2`}>
                  توضیح
                  <textarea
                    name="description"
                    rows={3}
                    className="rounded-xl border border-default p-3"
                  />
                </label>
              </>
            )}
            <div className="flex gap-2 sm:col-span-2">
              <Button
                type="submit"
                variant="primary"
                isDisabled={!clubId}
                isPending={create.isPending || invite.isPending}
              >
                ثبت
              </Button>
              <Button variant="ghost">
                <Link href="/memberships">انصراف</Link>
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </main>
  );
}
