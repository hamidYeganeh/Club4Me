"use client";
import { ResourceUnavailablePage } from "@/components/resource-unavailable-page";
import { FormSectionNavigation, FormSectionHeading } from "@/components/form-section-navigation";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button, Card, Spinner, toast } from "@heroui/react";
import {
  useCoachOffering,
  useCreateCoachOffering,
  useUpdateCoachOffering,
  useCreateMedia,
  useMedia,
  type CoachOffering,
  type CreateCoachOfferingPayload,
} from "@api";
import { useCatalogClubs, usePublicCatalogResource } from "@api/discovery";
import { DiscoveryPageHeader } from "@modules/discovery/components/DiscoveryPageHeader";

const field =
  "mt-2 min-h-11 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm";
const modes = {
  club: "در باشگاه",
  online: "آنلاین",
  home: "محل ورزشکار",
  outdoor: "فضای باز",
} as const;
const types = {
  private: "خصوصی",
  semi_private: "نیمه‌خصوصی",
  group: "گروهی",
  assessment: "ارزیابی",
} as const;

export function CoachOfferingFormScreen({
  offeringId = "",
}: {
  offeringId?: string;
}) {
  return offeringId ? (
    <ExistingOfferingEditor key={offeringId} offeringId={offeringId} />
  ) : (
    <OfferingEditor key="new" />
  );
}

function ExistingOfferingEditor({ offeringId }: { offeringId: string }) {
  const query = useCoachOffering(offeringId);
  const [initial, setInitial] = useState<CoachOffering>();
  useEffect(() => {
    if (
      initial ||
      !query.data ||
      !query.isFetchedAfterMount ||
      !query.isSuccess
    )
      return;
    const data = query.data;
    const frame = requestAnimationFrame(() => setInitial(data));
    return () => cancelAnimationFrame(frame);
  }, [initial, query.data, query.isFetchedAfterMount, query.isSuccess]);
  if (initial) return <OfferingEditor initial={initial} />;
  if (!query.isError)
    return (
      <div className="grid min-h-64 place-items-center">
        <Spinner />
      </div>
    );
  return (
    <ResourceUnavailablePage title="ویرایش خدمت" onRetry={() => void query.refetch()} />
  );
}

function OfferingEditor({ initial }: { initial?: CoachOffering }) {
  const router = useRouter();
  const create = useCreateCoachOffering();
  const update = useUpdateCoachOffering(initial?.id ?? "");
  const upload = useCreateMedia();
  const media = useMedia(
    initial?.coverMediaId ? [initial.coverMediaId] : undefined,
  );
  const sports = usePublicCatalogResource("sports", "sport");
  const levels = usePublicCatalogResource("sports", "skill-level");
  const [clubSearch, setClubSearch] = useState("");
  const clubs = useCatalogClubs({ q: clubSearch, limit: 20 });
  const [draft, setDraft] = useState<CreateCoachOfferingPayload>(() =>
    initial
      ? {
          title: initial.title,
          sportId: initial.sportId,
          description: initial.description,
          type: initial.type,
          deliveryModes: [...initial.deliveryModes],
          durationMinutes: initial.durationMinutes,
          capacity: initial.capacity,
          price: { ...initial.price },
          pricingType: initial.pricingType,
          minAge: initial.minAge ?? null,
          maxAge: initial.maxAge ?? null,
          skillLevelId: initial.skillLevelId ?? null,
          sessionCount: initial.sessionCount ?? null,
          venueClubIds: [...initial.venueClubIds],
          requiredEquipmentText: initial.requiredEquipmentText ?? "",
          coverMediaId: initial.coverMediaId ?? null,
          cancellationPolicy: { ...initial.cancellationPolicy },
        }
      : {
          title: "",
          description: "",
          sportId: "",
          type: "private",
          deliveryModes: ["club"],
          durationMinutes: 60,
          capacity: 1,
          price: { amount: 0, currency: "IRR" },
          pricingType: "per_session",
          venueClubIds: [],
          requiredEquipmentText: "",
          cancellationPolicy: {
            title: "قانون لغو مربی",
            tiers: [
              { hoursBefore: 24, refundPercent: 80 },
              { hoursBefore: 0, refundPercent: 0 },
            ],
            ownerCancellationRefundPercent: 100,
          },
          minAge: null,
          maxAge: null,
          sessionCount: null,
          skillLevelId: null,
          coverMediaId: null,
        },
  );
  const [policyDirty, setPolicyDirty] = useState(false);
  const [tiers, setTiers] = useState<
    Array<{ hoursBefore: number; refundPercent: number }>
  >(() => {
    const values = draft.cancellationPolicy?.tiers;
    const normalized = Array.isArray(values)
      ? values.flatMap((item) =>
          typeof item?.hoursBefore === "number" &&
          typeof item?.refundPercent === "number"
            ? [
                {
                  hoursBefore: Math.max(0, item.hoursBefore),
                  refundPercent: Math.max(0, Math.min(100, item.refundPercent)),
                },
              ]
            : [],
        )
      : [];
    if (!normalized.some((item) => item.hoursBefore === 0))
      normalized.push({ hoursBefore: 0, refundPercent: 0 });
    return normalized.sort((a, b) => b.hoursBefore - a.hoursBefore);
  });
  const patch = (value: Partial<CreateCoachOfferingPayload>) =>
    setDraft((current) => ({ ...current, ...value }));
  const saving = create.isPending || update.isPending || upload.isPending;
  const cover = media.data?.items.find(
    (item) => item.id === draft.coverMediaId,
  );
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving || initial?.status === "archived") return;
    if (!draft.deliveryModes.length) {
      toast.danger("حداقل یک شیوه ارائه انتخاب کنید");
      return;
    }
    if (
      draft.minAge != null &&
      draft.maxAge != null &&
      draft.minAge > draft.maxAge
    ) {
      toast.danger("حداقل سن از حداکثر سن بیشتر است");
      return;
    }
    if (draft.pricingType === "package" && !draft.sessionCount) {
      toast.danger("تعداد جلسات بسته را وارد کنید");
      return;
    }
    if (
      policyDirty &&
      new Set(tiers.map((tier) => tier.hoursBefore)).size !== tiers.length
    ) {
      toast.danger("ساعت بندهای لغو نباید تکراری باشد");
      return;
    }
    const payload = {
      ...draft,
      ...(policyDirty
        ? {
            cancellationPolicy: {
              ...draft.cancellationPolicy,
              tiers: [...tiers].sort((a, b) => b.hoursBefore - a.hoursBefore),
            },
          }
        : {}),
    };
    try {
      if (initial) await update.mutateAsync(payload);
      else await create.mutateAsync(payload);
      toast.success(
        draft.pricingType === "per_session"
          ? "خدمت ذخیره شد؛ برای فروش آن را منتشر کنید"
          : "اطلاعات خدمت ذخیره شد",
      );
      router.replace("/coach/reservations");
    } catch {
      toast.danger("ذخیره خدمت انجام نشد؛ اطلاعات را بررسی کنید");
    }
  };
  return (
    <main className="app-page gap-5">
      <DiscoveryPageHeader
        title={initial ? "ویرایش خدمت مربی" : "خدمت جدید مربی"}
        description="رشته، شرایط حضور و قیمت خدمت را مشخص کنید."
      />
      {initial?.status === "archived" ? (
        <p role="alert">خدمت بایگانی‌شده قابل ویرایش نیست.</p>
      ) : null}
      <FormSectionNavigation sections={[{"id": "service-basics", "title": "معرفی"}, {"id": "service-pricing", "title": "قیمت و ظرفیت"}, {"id": "service-policy", "title": "قوانین"}]} />
      <Card className="app-card coach-editor p-5 shadow-none">
        <form onSubmit={submit}>
          <fieldset
            className="space-y-5"
            disabled={saving || initial?.status === "archived"}
          >
            <FormSectionHeading id="service-basics" title="خدمت شما" description="ورزشکار چه خدمتی و به چه شیوه‌ای دریافت می‌کند؟" />
          <label className="block text-sm">
              عنوان
              <input
                className={field}
                required
                minLength={2}
                maxLength={140}
                value={draft.title}
                onChange={(event) => patch({ title: event.target.value })}
              />
            </label>
            <label className="block text-sm">
              توضیحات
              <textarea
                className={field}
                rows={4}
                maxLength={4000}
                value={draft.description}
                onChange={(event) => patch({ description: event.target.value })}
              />
            </label>
            <label className="block text-sm">
              رشته ورزشی
              <select
                className={field}
                required
                value={draft.sportId}
                onChange={(event) => patch({ sportId: event.target.value })}
              >
                <option value="">انتخاب رشته</option>
                {draft.sportId &&
                !sports.data?.items.some(
                  (item) => item.id === draft.sportId,
                ) ? (
                  <option value={draft.sportId}>رشته ثبت‌شده</option>
                ) : null}
                {sports.data?.items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            {sports.isError ? (
              <Button size="sm" onPress={() => void sports.refetch()}>
                دریافت دوباره رشته‌ها
              </Button>
            ) : null}
            <label className="block text-sm">
              نوع خدمت
              <select
                className={field}
                value={draft.type}
                onChange={(event) =>
                  patch({ type: event.target.value as CoachOffering["type"] })
                }
              >
                {Object.entries(types).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <fieldset className="rounded-xl border border-border p-3">
              <legend className="px-2 text-sm">شیوه ارائه</legend>
              <div className="flex flex-wrap gap-4">
                {Object.entries(modes).map(([value, label]) => {
                  const mode = value as CoachOffering["deliveryModes"][number];
                  return (
                    <label
                      key={value}
                      className="flex min-h-11 items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={draft.deliveryModes.includes(mode)}
                        onChange={(event) =>
                          patch({
                            deliveryModes: event.target.checked
                              ? [...draft.deliveryModes, mode]
                              : draft.deliveryModes.filter(
                                  (item) => item !== mode,
                                ),
                          })
                        }
                      />
                      {label}
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <FormSectionHeading id="service-pricing" title="قیمت و ظرفیت" description="مدت جلسه و شرایط رزرو را مشخص کنید." />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Numeric
                label="مدت جلسه (دقیقه)"
                value={draft.durationMinutes}
                min={15}
                max={480}
                onChange={(value) => patch({ durationMinutes: value ?? 60 })}
              />
              <Numeric
                label="ظرفیت"
                value={draft.capacity}
                min={1}
                max={10000}
                onChange={(value) => patch({ capacity: value ?? 1 })}
              />
            </div>
            <label className="block text-sm">
              سطح ورزشکار
              <select
                className={field}
                value={draft.skillLevelId ?? ""}
                onChange={(event) =>
                  patch({ skillLevelId: event.target.value || null })
                }
              >
                <option value="">همه سطوح</option>
                {draft.skillLevelId &&
                !levels.data?.items.some(
                  (item) => item.id === draft.skillLevelId,
                ) ? (
                  <option value={draft.skillLevelId}>سطح ثبت‌شده</option>
                ) : null}
                {levels.data?.items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Numeric
                label="حداقل سن (اختیاری)"
                optional
                value={draft.minAge}
                min={0}
                max={120}
                onChange={(minAge) => patch({ minAge })}
              />
              <Numeric
                label="حداکثر سن (اختیاری)"
                optional
                value={draft.maxAge}
                min={0}
                max={120}
                onChange={(maxAge) => patch({ maxAge })}
              />
            </div>
            <label className="block text-sm">
              واحد فروش
              <select
                className={field}
                value={draft.pricingType}
                onChange={(event) =>
                  patch({
                    pricingType: event.target
                      .value as CoachOffering["pricingType"],
                  })
                }
              >
                <option value="per_session">جلسه‌ای</option>
                <option value="package">بسته جلسات</option>
                <option value="per_month">ماهانه</option>
              </select>
            </label>
            {draft.pricingType !== "per_session" ? (
              <p className="rounded-xl bg-warning/10 p-3 text-sm">
                ورزشکار ابتدا این خدمت را می‌خرد؛ سپس سانس‌های همین خدمت را با اعتبار آن رزرو می‌کند. خدمت ماهانه ۳۰ روز از زمان پرداخت معتبر است و تمدید خودکار ندارد. لغو مربی یا لغو با بازپرداخت کامل، اعتبار جلسه را برمی‌گرداند.
              </p>
            ) : null}
            <Numeric
              label={`قیمت (${draft.price.currency === "IRR" ? "ریال" : draft.price.currency})`}
              value={draft.price.amount}
              min={0}
              max={1000000000000}
              onChange={(amount) =>
                patch({ price: { ...draft.price, amount: amount ?? 0 } })
              }
            />
            {draft.pricingType !== "per_session" ? (
              <Numeric
                label={draft.pricingType === "package" ? "تعداد جلسات بسته" : "سقف جلسات ماهانه (خالی = نامحدود)"}
                value={draft.sessionCount}
                min={1}
                max={1000}
                onChange={(sessionCount) => patch({ sessionCount })}
              />
            ) : null}
            <label className="block text-sm">
              وسایل لازم
              <textarea
                className={field}
                rows={3}
                maxLength={2000}
                value={draft.requiredEquipmentText}
                onChange={(event) =>
                  patch({ requiredEquipmentText: event.target.value })
                }
              />
            </label>
            {draft.deliveryModes.includes("club") ? (
              <fieldset className="space-y-3 rounded-xl border border-border p-3">
                <legend className="px-2 text-sm">باشگاه‌های محل ارائه</legend>
                <input
                  aria-label="جستجوی باشگاه محل ارائه"
                  className={field}
                  placeholder="نام باشگاه"
                  value={clubSearch}
                  onChange={(event) => setClubSearch(event.target.value)}
                />
                <select
                  aria-label="افزودن باشگاه"
                  className={field}
                  value=""
                  onChange={(event) => {
                    if (
                      event.target.value &&
                      !draft.venueClubIds?.includes(event.target.value)
                    )
                      patch({
                        venueClubIds: [
                          ...(draft.venueClubIds ?? []),
                          event.target.value,
                        ],
                      });
                  }}
                >
                  <option value="">انتخاب باشگاه</option>
                  {clubs.data?.items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                {clubs.isError ? (
                  <Button size="sm" onPress={() => void clubs.refetch()}>
                    دریافت دوباره باشگاه‌ها
                  </Button>
                ) : null}
                {draft.venueClubIds?.map((id) => (
                  <div
                    key={id}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span>
                      {clubs.data?.items.find((item) => item.id === id)?.name ??
                        "باشگاه ثبت‌شده"}
                    </span>
                    <Button
                      size="sm"
                      variant="danger-soft"
                      onPress={() =>
                        patch({
                          venueClubIds: draft.venueClubIds?.filter(
                            (value) => value !== id,
                          ),
                        })
                      }
                    >
                      حذف محل
                    </Button>
                  </div>
                ))}
              </fieldset>
            ) : null}
            <FormSectionHeading id="service-policy" title="قوانین و تصویر" description="شرایط لغو را شفاف کنید تا ورزشکار با آگاهی رزرو کند." />
          <fieldset className="space-y-3 rounded-xl border border-border p-3">
              <legend className="px-2 text-sm">قانون لغو</legend>
              <label className="block text-sm">
                عنوان قانون
                <input
                  className={field}
                  maxLength={140}
                  value={
                    typeof draft.cancellationPolicy?.title === "string"
                      ? draft.cancellationPolicy.title
                      : "قانون لغو مربی"
                  }
                  onChange={(event) =>
                    patch({
                      cancellationPolicy: {
                        ...draft.cancellationPolicy,
                        title: event.target.value,
                      },
                    })
                  }
                />
              </label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {(
                  [
                    [
                      "reservationCutoffMinutes",
                      "مهلت بستن رزرو (دقیقه قبل)",
                      0,
                      525600,
                    ],
                    [
                      "rescheduleCutoffMinutes",
                      "مهلت تغییر زمان (دقیقه قبل)",
                      0,
                      525600,
                    ],
                    ["noShowRefundPercent", "بازگشت عدم حضور (درصد)", 0, 100],
                    [
                      "ownerCancellationRefundPercent",
                      "بازگشت لغو مربی (درصد)",
                      100,
                      100,
                    ],
                  ] as const
                ).map(([key, label, fallback, max]) => (
                  <Numeric
                    key={key}
                    label={label}
                    min={0}
                    max={max}
                    value={
                      typeof draft.cancellationPolicy?.[key] === "number"
                        ? (draft.cancellationPolicy[key] as number)
                        : fallback
                    }
                    onChange={(value) =>
                      patch({
                        cancellationPolicy: {
                          ...draft.cancellationPolicy,
                          [key]: value ?? fallback,
                        },
                      })
                    }
                  />
                ))}
              </div>
              <p className="text-xs text-muted">
                درصد بازگشت بر اساس ساعت باقی‌مانده تا شروع جلسه.
              </p>
              {tiers.map((tier, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[1fr_1fr_auto] items-end gap-2"
                >
                  <Numeric
                    label="حداقل ساعت قبل"
                    value={tier.hoursBefore}
                    min={0}
                    max={8760}
                    onChange={(value) => {
                      setPolicyDirty(true);
                      setTiers((current) =>
                        current.map((item, position) =>
                          position === index
                            ? { ...item, hoursBefore: value ?? 0 }
                            : item,
                        ),
                      );
                    }}
                  />
                  <Numeric
                    label="بازگشت (درصد)"
                    value={tier.refundPercent}
                    min={0}
                    max={100}
                    onChange={(value) => {
                      setPolicyDirty(true);
                      setTiers((current) =>
                        current.map((item, position) =>
                          position === index
                            ? { ...item, refundPercent: value ?? 0 }
                            : item,
                        ),
                      );
                    }}
                  />
                  <Button
                    aria-label={`حذف بند ${index + 1}`}
                    size="sm"
                    variant="danger-soft"
                    onPress={() => {
                      setPolicyDirty(true);
                      setTiers((current) =>
                        current.filter((_, position) => position !== index),
                      );
                    }}
                  >
                    حذف
                  </Button>
                </div>
              ))}
              <Button
                size="sm"
                variant="secondary"
                isDisabled={tiers.length >= 10}
                onPress={() => {
                  setPolicyDirty(true);
                  setTiers((current) => [
                    ...current,
                    { hoursBefore: 0, refundPercent: 0 },
                  ]);
                }}
              >
                افزودن بند
              </Button>
            </fieldset>
            <div className="space-y-3">
              <label className="block text-sm">
                تصویر خدمت
                <input
                  className={field}
                  type="file"
                  accept="image/*"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    try {
                      const item = await upload.mutateAsync(file);
                      patch({ coverMediaId: item.id });
                    } catch {
                      toast.danger("بارگذاری تصویر انجام نشد");
                    }
                  }}
                />
              </label>
              {cover ? (
                <Image
                  src={cover.url}
                  alt="تصویر خدمت"
                  width={480}
                  height={270}
                  className="w-full rounded-xl object-cover"
                />
              ) : draft.coverMediaId ? (
                <p className="text-sm text-muted">تصویر فعلی حفظ می‌شود.</p>
              ) : null}
              {draft.coverMediaId ? (
                <Button
                  size="sm"
                  variant="danger-soft"
                  onPress={() => patch({ coverMediaId: null })}
                >
                  حذف تصویر خدمت
                </Button>
              ) : null}
            </div>
            <Button type="submit" variant="primary" isPending={saving}>
              ذخیره خدمت
            </Button>
          </fieldset>
        </form>
      </Card>
    </main>
  );
}
function Numeric({
  label,
  value,
  min,
  max,
  optional = false,
  onChange,
}: {
  label: string;
  value?: number | null;
  min: number;
  max: number;
  optional?: boolean;
  onChange: (value: number | null) => void;
}) {
  return (
    <label className="block text-sm">
      {label}
      <input
        className={field}
        type="number"
        required={!optional}
        min={min}
        max={max}
        step={1}
        value={value ?? ""}
        onChange={(event) =>
          onChange(
            event.target.value === "" ? null : Number(event.target.value),
          )
        }
      />
    </label>
  );
}
