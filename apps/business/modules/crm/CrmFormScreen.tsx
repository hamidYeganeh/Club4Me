"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Button, Card, Input, toast } from "@heroui/react";
import { FormOption, FormSelect } from "@repo/ui/form-select";
import { tehranLocalValue } from "@repo/ui/iran-date";
import { IranDateInput } from "@repo/ui/iran-date-input";
import {
  useBusinessCrmCampaigns,
  useCreateBusinessCrmCampaign,
  useUpdateBusinessCrmCampaign,
  useCrmAudiencePreview,
  useBusinessDiscounts,
  type CrmAudienceFilter,
  type CrmCampaign,
} from "@api/business";
import { useSelectedClub } from "@/lib/use-selected-club";

const selectClass = "w-full max-w-md";
export function CrmFormScreen({
  campaignId,
  requestedClubId,
}: {
  campaignId?: string;
  requestedClubId?: string;
}) {
  const router = useRouter();
  const { clubs, clubId: defaultClubId } = useSelectedClub();
  const candidate = requestedClubId;
  const clubId = clubs.data?.items.some((club) => club.id === candidate)
    ? candidate!
    : defaultClubId;
  const campaigns = useBusinessCrmCampaigns(clubId);
  const existing = campaigns.data?.items.find((item) => item.id === campaignId);
  const create = useCreateBusinessCrmCampaign(clubId);
  const update = useUpdateBusinessCrmCampaign(clubId);
  const preview = useCrmAudiencePreview(clubId);
  const discounts = useBusinessDiscounts(clubId);
  const [kind, setKind] = useState<"push" | "news">("push");
  const [audience, setAudience] = useState<
    "all_students" | "selected_students"
  >("all_students");
  const [filter, setFilter] = useState<CrmAudienceFilter>({ kind: "all" });
  const [selected, setSelected] = useState<string[]>([]);
  const [draft, setDraft] = useState<CrmCampaign | null>(null);

  useEffect(() => {
    if (!existing || draft?.id === existing.id) return;
    setDraft(existing);
    setKind(existing.kind);
    setAudience(existing.audience);
    setSelected(existing.studentIds);
  }, [existing, draft?.id]);

  function changeFilter(next: CrmAudienceFilter) {
    setFilter(next);
    setSelected([]);
    preview.reset();
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      kind === "push" &&
      audience === "selected_students" &&
      !selected.length
    ) {
      toast.danger("حداقل یک شاگرد انتخاب کنید");
      return;
    }
    const form = event.currentTarget;
    const data = new FormData(form);
    const date = new Date(String(data.get("scheduledAt")));
    if (
      Number.isNaN(date.getTime()) ||
      (kind === "push" && date <= new Date())
    ) {
      toast.danger(
        kind === "push"
          ? "زمان ارسال پوش باید در آینده باشد"
          : "تاریخ انتشار معتبر نیست",
      );
      return;
    }
    const payload = {
      title: String(data.get("title")).trim(),
      body: String(data.get("body")).trim(),
      scheduledAt: date.toISOString(),
      kind,
      audience: kind === "news" ? ("all_students" as const) : audience,
      studentIds:
        kind === "push" && audience === "selected_students" ? selected : [],
    };
    try {
      if (campaignId) await update.mutateAsync({ id: campaignId, payload });
      else await create.mutateAsync(payload);
      toast.success("برای بررسی ادمین ثبت شد");
      router.push("/crm");
    } catch {
      toast.danger(
        "ثبت انجام نشد؛ زمان، گیرندگان و دسترسی باشگاه را بررسی کنید",
      );
    }
  }

  if (campaignId && campaigns.isPending)
    return <main className="p-6">در حال بارگذاری...</main>;
  if (campaignId && !existing)
    return (
      <main className="p-6">
        پیام پیدا نشد. <Link href="/crm">بازگشت</Link>
      </main>
    );
  return (
    <main className="min-w-0 flex-1 p-4 lg:p-6">
      <div className="mx-auto max-w-3xl">
        <Link href="/crm" className="text-sm text-accent">
          بازگشت به پیام‌ها
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">
          {campaignId ? "ویرایش پیام یا خبر" : "ایجاد پیام یا خبر"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          هر تغییر دوباره برای تأیید ادمین ارسال می‌شود.
        </p>
        <Card className="mt-6 app-card p-5 shadow-none active:scale-100">
          <form
            key={draft?.id ?? clubId}
            onSubmit={submit}
            className="grid gap-5"
          >
            <p className="text-sm text-muted">
              باشگاه:{" "}
              {clubs.data?.items.find((club) => club.id === clubId)?.name ??
                "—"}
            </p>
            <label className="grid gap-2 text-sm">
              نوع محتوا
              <FormSelect
                aria-label="نوع محتوا"
                value={kind}
                onChange={(value) => setKind(value as typeof kind)}
                className={selectClass}
              >
                <FormOption value="push">پوش نوتیفیکیشن</FormOption>
                <FormOption value="news">فید خبری باشگاه</FormOption>
              </FormSelect>
            </label>
            <label className="grid gap-2 text-sm">
              عنوان
              <Input
                variant="secondary"
                name="title"
                required
                minLength={3}
                maxLength={180}
                defaultValue={draft?.title}
              />
            </label>
            <label className="grid gap-2 text-sm">
              متن
              <textarea
                name="body"
                required
                minLength={3}
                maxLength={1000}
                rows={5}
                defaultValue={draft?.body}
                className="w-full rounded-xl border border-default p-3"
              />
            </label>
            <label className="grid gap-2 text-sm">
              {kind === "news" ? "تاریخ و ساعت انتشار" : "تاریخ و ساعت ارسال"}
              <IranDateInput
                name="scheduledAt"
                withTime
                required
                defaultValue={
                  draft
                    ? tehranLocalValue(draft.scheduledAt).slice(0, 16)
                    : undefined
                }
              />
            </label>
            {kind === "news" ? (
              <p className="text-sm text-muted">
                خبر در تاریخ انتشار، در صفحهٔ عمومی همین باشگاه دیده می‌شود و
                پوش ارسال نمی‌کند.
              </p>
            ) : (
              <>
                <label className="grid gap-2 text-sm">
                  گیرندگان
                  <FormSelect
                    aria-label="گیرندگان"
                    value={audience}
                    onChange={(value) => setAudience(value as typeof audience)}
                    className={selectClass}
                  >
                    <FormOption value="all_students">
                      همهٔ شاگردان فعال دارای حساب
                    </FormOption>
                    <FormOption value="selected_students">
                      شاگردان انتخابی
                    </FormOption>
                  </FormSelect>
                </label>
                {audience === "selected_students" && (
                  <section className="grid gap-4 rounded-2xl border border-default p-4">
                    <h2 className="font-medium">فیلتر شاگردها</h2>
                    <FormSelect
                      aria-label="فیلتر شاگردها"
                      value={filter.kind}
                      onChange={(value) =>
                        changeFilter({
                          kind: value as CrmAudienceFilter["kind"],
                        })
                      }
                      className={selectClass}
                    >
                      <FormOption value="all">همهٔ شاگردان</FormOption>
                      <FormOption value="membership_expiring">
                        نزدیک پایان قرارداد
                      </FormOption>
                      <FormOption value="inactive">
                        بدون حضور در باشگاه
                      </FormOption>
                      <FormOption value="reservation_date">
                        دارای رزرو در یک تاریخ
                      </FormOption>
                      <FormOption value="discount_unused">
                        استفاده‌نکرده از کد تخفیف
                      </FormOption>
                    </FormSelect>
                    {["membership_expiring", "inactive"].includes(
                      filter.kind,
                    ) && (
                      <label className="grid gap-2 text-sm">
                        تعداد روز
                        <Input
                          variant="secondary"
                          type="number"
                          min={1}
                          max={365}
                          value={String(
                            filter.days ??
                              (filter.kind === "inactive" ? 30 : 7),
                          )}
                          onChange={(event) =>
                            changeFilter({
                              ...filter,
                              days: Number(event.target.value),
                            })
                          }
                        />
                      </label>
                    )}
                    {filter.kind === "reservation_date" && (
                      <label className="grid gap-2 text-sm">
                        تاریخ رزرو
                        <IranDateInput
                          value={filter.date ?? ""}
                          onValueChange={(date) =>
                            changeFilter({
                              ...filter,
                              date,
                            })
                          }
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          onPress={() =>
                            changeFilter({
                              ...filter,
                              date: tehranLocalValue(
                                new Date().toISOString(),
                              ).slice(0, 10),
                            })
                          }
                        >
                          امروز
                        </Button>
                      </label>
                    )}
                    {filter.kind === "discount_unused" && (
                      <label className="grid gap-2 text-sm">
                        کد تخفیف
                        <FormSelect
                          aria-label="کد تخفیف"
                          value={filter.discountId ?? ""}
                          onChange={(value) =>
                            changeFilter({ ...filter, discountId: value })
                          }
                          className={selectClass}
                        >
                          <FormOption value="">انتخاب کد</FormOption>
                          {discounts.data?.items
                            .filter(
                              (item) =>
                                item.isActive &&
                                new Date(item.endsAt) >= new Date(),
                            )
                            .map((item) => (
                              <FormOption key={item.id} value={item.id}>
                                {item.code} · {item.title}
                              </FormOption>
                            ))}
                        </FormSelect>
                      </label>
                    )}
                    <Button
                      type="button"
                      variant="secondary"
                      isPending={preview.isPending}
                      isDisabled={
                        (filter.kind === "reservation_date" && !filter.date) ||
                        (filter.kind === "discount_unused" &&
                          !filter.discountId)
                      }
                      onPress={async () => {
                        try {
                          await preview.mutateAsync(filter);
                        } catch {
                          toast.danger("دریافت فهرست شاگردها انجام نشد");
                        }
                      }}
                    >
                      نمایش شاگردهای مطابق
                    </Button>
                    {preview.data && (
                      <>
                        <p className="text-sm text-muted">
                          {preview.data.total.toLocaleString("fa-IR")} شاگرد
                          مطابق · {selected.length.toLocaleString("fa-IR")} نفر
                          انتخاب شده
                        </p>
                        {preview.data.total > preview.data.items.length && (
                          <p className="text-xs text-warning">
                            فقط{" "}
                            {preview.data.items.length.toLocaleString("fa-IR")}{" "}
                            نتیجهٔ اول نمایش داده می‌شود؛ فیلتر را محدودتر کنید.
                          </p>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          onPress={() =>
                            setSelected(
                              preview.data!.items.map((item) => item.id),
                            )
                          }
                        >
                          انتخاب همهٔ نتایج
                        </Button>
                        <div className="max-h-72 overflow-auto rounded-xl border border-default p-3">
                          {preview.data.items.map((student) => (
                            <label
                              key={student.id}
                              className="flex items-center gap-2 py-1 text-sm"
                            >
                              <input
                                type="checkbox"
                                checked={selected.includes(student.id)}
                                onChange={(event) =>
                                  setSelected((current) =>
                                    event.target.checked
                                      ? [...current, student.id]
                                      : current.filter(
                                          (id) => id !== student.id,
                                        ),
                                  )
                                }
                              />
                              {student.firstName} {student.lastName}
                            </label>
                          ))}
                          {!preview.data.items.length && (
                            <p className="text-sm text-muted">
                              شاگردی مطابق این شرایط پیدا نشد.
                            </p>
                          )}
                        </div>
                      </>
                    )}
                    {!!selected.length && !preview.data && (
                      <p className="text-xs text-muted">
                        {selected.length.toLocaleString("fa-IR")} شاگرد از نسخهٔ
                        قبلی انتخاب شده‌اند.
                      </p>
                    )}
                  </section>
                )}
                <p className="text-xs text-muted">
                  پوش فقط به شاگردان فعال دارای حساب کاربری ارسال می‌شود.
                </p>
              </>
            )}
            <div className="flex gap-3">
              <Button
                type="submit"
                variant="primary"
                isPending={create.isPending || update.isPending}
                isDisabled={!clubId}
              >
                ثبت برای تأیید
              </Button>
              <Button variant="ghost">
                <Link href="/crm">انصراف</Link>
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </main>
  );
}
