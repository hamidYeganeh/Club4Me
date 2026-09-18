"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, Card, Input, toast } from "@heroui/react";
import { FormOption, FormSelect } from "@repo/ui/form-select";
import { IranDateInput } from "@repo/ui/iran-date-input";
import { PanelPriceField } from "@/components/form/PanelPriceField";
import { useSelectedClub } from "@/lib/use-selected-club";
import { useCreateBusinessDiscount } from "@api/business";

export function DiscountFormScreen({
  requestedClubId,
}: {
  requestedClubId?: string;
}) {
  const router = useRouter();
  const { clubs, clubId: defaultClubId } = useSelectedClub();
  const clubId = clubs.data?.items.some((club) => club.id === requestedClubId)
    ? requestedClubId!
    : defaultClubId;
  const create = useCreateBusinessDiscount(clubId);
  const [kind, setKind] = useState<"percent" | "fixed">("percent");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await create.mutateAsync({
        code: String(data.get("code")).trim().toUpperCase(),
        title: String(data.get("title")).trim(),
        kind,
        value: Number(data.get("value")),
        maxDiscount: data.get("maxDiscount")
          ? Number(data.get("maxDiscount"))
          : null,
        minOrderAmount: Number(data.get("minOrderAmount")),
        budget: Number(data.get("budget")),
        perUserLimit: Number(data.get("perUserLimit")),
        usageLimit: data.get("usageLimit")
          ? Number(data.get("usageLimit"))
          : null,
        firstPurchaseOnly: data.get("firstPurchaseOnly") === "on",
        startsAt: new Date(String(data.get("startsAt"))).toISOString(),
        endsAt: new Date(String(data.get("endsAt"))).toISOString(),
      });
      toast.success("کد تخفیف ساخته شد");
      router.push("/discounts");
    } catch {
      toast.danger("ساخت کد تخفیف انجام نشد؛ شرایط و یکتایی کد را بررسی کنید");
    }
  }
  const field = "grid gap-1.5 text-sm";
  return (
    <main className="flex-1 p-4 lg:p-6">
      <div className="mx-auto max-w-3xl">
        <Link href="/discounts" className="text-sm text-accent">
          بازگشت به کدها
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">کد تخفیف جدید</h1>
        <Card className="mt-6 app-card p-5 shadow-none active:scale-100">
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <p className="text-sm text-muted sm:col-span-2">
              باشگاه:{" "}
              {clubs.data?.items.find((club) => club.id === clubId)?.name ??
                "—"}
            </p>
            <label className={field}>
              کد
              <Input variant="secondary" name="code" required minLength={3} dir="ltr" />
            </label>
            <label className={field}>
              عنوان
              <Input variant="secondary" name="title" required minLength={3} />
            </label>
            <label className={field}>
              نوع تخفیف
              <FormSelect
                aria-label="نوع تخفیف"
                value={kind}
                onChange={(value) => setKind(value as typeof kind)}
              >
                <FormOption value="percent">درصدی</FormOption>
                <FormOption value="fixed">مبلغ ثابت</FormOption>
              </FormSelect>
            </label>
            {kind === "percent" ? (
              <label className={field}>
                درصد
                <Input
                  variant="secondary"
                  name="value"
                  type="number"
                  required
                  min={1}
                  max={100}
                />
              </label>
            ) : (
              <PanelPriceField
                label="مبلغ (ریال)"
                name="value"
                minValue={1}
                isRequired
              />
            )}
            <PanelPriceField label="حداکثر تخفیف (ریال)" name="maxDiscount" minValue={1} />
            <PanelPriceField
              label="حداقل خرید (ریال)"
              name="minOrderAmount"
              minValue={0}
              defaultValue={0}
              isRequired
            />
            <PanelPriceField
              label="بودجه کل (ریال)"
              name="budget"
              minValue={1}
              isRequired
            />
            <label className={field}>
              سقف استفاده کل
              <Input variant="secondary" name="usageLimit" type="number" min={1} />
            </label>
            <label className={field}>
              سقف استفاده هر کاربر
              <Input
                variant="secondary"
                name="perUserLimit"
                type="number"
                min={1}
                max={100}
                defaultValue={1}
                required
              />
            </label>
            <label className={field}>
              شروع
              <IranDateInput name="startsAt" withTime required />
            </label>
            <label className={field}>
              پایان
              <IranDateInput name="endsAt" withTime required />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input name="firstPurchaseOnly" type="checkbox" /> فقط اولین خرید
            </label>
            <div className="flex gap-2 sm:col-span-2">
              <Button
                type="submit"
                variant="primary"
                isPending={create.isPending}
                isDisabled={!clubId}
              >
                ساخت
              </Button>
              <Button variant="ghost">
                <Link href="/discounts">انصراف</Link>
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </main>
  );
}
