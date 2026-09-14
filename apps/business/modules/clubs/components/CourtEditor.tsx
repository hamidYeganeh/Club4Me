"use client";

import { Uploader, imageUploaderAccept } from "@repo/ui/uploader";
import { Checkbox as HeroCheckbox } from "@heroui/react";
import { FormSelect, FormOption } from "@repo/ui/form-select";
import { Input as HeroInput, TextArea as HeroTextArea } from "@heroui/react";
import { useState, type FormEvent } from "react";
import Image from "next/image";
import { Button, toast } from "@heroui/react";
import {
  useBusinessCatalog,
  useCreateCourt,
  useUpdateCourt,
  type ClubCourt,
  type CreateCourtPayload,
} from "@api/business";
import { useCreateMedia, useMedia } from "@api";

const field = "mt-2 w-full";
const defaults = {
  name: "",
  code: "",
  description: "",
  courtTypeId: "",
  sportIds: [] as string[],
  surfaceTypeId: "",
  capacity: 1,
  environment: "indoor" as ClubCourt["environment"],
  lengthMeters: "",
  widthMeters: "",
  locationLabel: "",
  floor: "",
  minimumReservationMinutes: 60,
  maximumReservationMinutes: 480,
  preparationMinutes: 0,
  cleanupMinutes: 0,
  isReservable: true,
  status: "active" as ClubCourt["status"],
  galleryMediaIds: [] as string[],
};

export function CourtEditor({
  clubId,
  initial,
  onSaved,
  onCancel,
}: {
  clubId: string;
  initial?: ClubCourt;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const create = useCreateCourt(clubId);
  const update = useUpdateCourt(clubId);
  const upload = useCreateMedia();
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState({ sport: "", court: "", surface: "" });
  const courtTypes = useBusinessCatalog("sports", "court-type", {
    limit: 100,
    q: search.court,
    isActive: true,
  });
  const sports = useBusinessCatalog("sports", "sport", {
    limit: 100,
    q: search.sport,
    isActive: true,
  });
  const surfaces = useBusinessCatalog("facilities", "court-surface-type", {
    limit: 100,
    q: search.surface,
    isActive: true,
  });
  const [draft, setDraft] = useState(() =>
    initial
      ? {
          ...defaults,
          ...initial,
          courtTypeId: initial.courtTypeId ?? "",
          surfaceTypeId: initial.surfaceTypeId ?? "",
          code: initial.code ?? "",
          locationLabel: initial.locationLabel ?? "",
          floor: initial.floor ?? "",
          lengthMeters:
            initial.lengthMeters == null ? "" : String(initial.lengthMeters),
          widthMeters:
            initial.widthMeters == null ? "" : String(initial.widthMeters),
          sportIds: [...initial.sportIds],
          galleryMediaIds: [...initial.galleryMediaIds],
        }
      : { ...defaults },
  );
  const media = useMedia(draft.galleryMediaIds);
  const [uploadedUrls, setUploadedUrls] = useState<Record<string, string>>({});
  const busy = uploading || create.isPending || update.isPending;
  const change = <K extends keyof typeof defaults>(
    key: K,
    value: (typeof defaults)[K],
  ) => setDraft((old) => ({ ...old, [key]: value }));
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (draft.minimumReservationMinutes > draft.maximumReservationMinutes) {
      toast.danger("حداکثر مدت رزرو باید برابر یا بیشتر از حداقل باشد.");
      return;
    }
    const {
      status,
      lengthMeters,
      widthMeters,
      courtTypeId,
      surfaceTypeId,
      ...values
    } = draft;
    // Send only editable fields; IDs and server timestamps are never copied into the payload.
    const payload: CreateCourtPayload = {
      name: values.name,
      code: values.code,
      description: values.description,
      sportIds: values.sportIds,
      capacity: values.capacity,
      environment: values.environment,
      locationLabel: values.locationLabel,
      floor: values.floor,
      galleryMediaIds: values.galleryMediaIds,
      isReservable: values.isReservable,
      minimumReservationMinutes: values.minimumReservationMinutes,
      maximumReservationMinutes: values.maximumReservationMinutes,
      preparationMinutes: values.preparationMinutes,
      cleanupMinutes: values.cleanupMinutes,
      ...(courtTypeId ? { courtTypeId } : {}),
      ...(surfaceTypeId ? { surfaceTypeId } : {}),
      ...(lengthMeters ? { lengthMeters: Number(lengthMeters) } : {}),
      ...(widthMeters ? { widthMeters: Number(widthMeters) } : {}),
    };
    try {
      if (initial)
        await update.mutateAsync({
          ...payload,
          courtId: initial.id,
          status,
          expectedUpdatedAt: initial.updatedAt,
          courtTypeId: courtTypeId || null,
          surfaceTypeId: surfaceTypeId || null,
          lengthMeters: lengthMeters ? Number(lengthMeters) : null,
          widthMeters: widthMeters ? Number(widthMeters) : null,
        });
      else await create.mutateAsync(payload);
      toast.success(initial ? "زمین ویرایش شد" : "زمین ساخته شد");
      onSaved();
    } catch (error) {
      toast.danger(
        error instanceof Error
          ? error.message
          : "ذخیره زمین انجام نشد؛ دوباره تلاش کنید.",
      );
    }
  };
  const moveImage = (index: number, offset: number) => {
    const ids = [...draft.galleryMediaIds];
    [ids[index], ids[index + offset]] = [ids[index + offset]!, ids[index]!];
    change("galleryMediaIds", ids);
  };
  return (
    <form
      onSubmit={save}
      aria-label={initial ? "ویرایش زمین" : "ساخت زمین"}
      className="mt-4"
    >
      <fieldset disabled={busy} className="space-y-4">
        <legend className="text-base font-bold">
          {initial ? `ویرایش ${initial.name}` : "زمین جدید"}
        </legend>
        <p className="text-sm text-muted">
          نام و ظرفیت برای شروع کافی است؛ بقیه مشخصات را می‌توانید بعداً تکمیل
          کنید.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            نام زمین
            <HeroInput
              autoFocus
              className={field}
              required
              minLength={2}
              maxLength={120}
              value={draft.name}
              onChange={(e) => change("name", e.target.value)}
              placeholder="مثلاً سالن اصلی"
            />
          </label>
          <label className="block text-sm">
            ظرفیت زمین
            <HeroInput
              className={field}
              type="number"
              required
              min={1}
              max={1000}
              value={draft.capacity}
              onChange={(e) => change("capacity", Number(e.target.value))}
            />
          </label>
        </div>
        <details
          open={initial ? true : undefined}
          className="rounded-xl bg-surface-secondary p-4"
        >
          <summary className="cursor-pointer text-sm font-semibold">
            مشخصات تکمیلی زمین
          </summary>
          <div className="mt-4 space-y-4">
            {(
              [
                ["code", "کد زمین", 40],
                ["locationLabel", "محل زمین", 120],
                ["floor", "طبقه", 40],
              ] as const
            ).map(([key, label, max]) => (
              <label key={key} className="block text-sm">
                {label}
                <HeroInput
                  className={field}
                  maxLength={max}
                  value={draft[key]}
                  onChange={(event) => change(key, event.target.value)}
                />
              </label>
            ))}
            <label className="block text-sm">
              توضیحات
              <HeroTextArea
                className={field}
                maxLength={2000}
                rows={3}
                value={draft.description}
                onChange={(event) => change("description", event.target.value)}
              />
            </label>
            {(
              [
                ["courtTypeId", "نوع زمین", courtTypes, "court"],
                ["surfaceTypeId", "جنس سطح زمین", surfaces, "surface"],
              ] as const
            ).map(([key, label, catalog, searchKey]) => (
              <div key={key}>
                <label className="block text-sm">
                  جستجوی {label}
                  <HeroInput
                    className={field}
                    value={search[searchKey]}
                    onChange={(event) =>
                      setSearch({ ...search, [searchKey]: event.target.value })
                    }
                  />
                </label>
                <label className="mt-2 block text-sm">
                  {label}
                  <FormSelect
                    aria-label={label}
                    className={field}
                    value={draft[key]}
                    onChange={(event) => change(key, event)}
                  >
                    <FormOption value="">مشخص نشده</FormOption>
                    {draft[key] &&
                    !catalog.data?.items.some(
                      (item) => item.id === draft[key],
                    ) ? (
                      <FormOption value={draft[key]}>گزینه ثبت‌شده</FormOption>
                    ) : null}
                    {catalog.data?.items.map((item) => (
                      <FormOption entity={item} key={item.id} value={item.id}>
                        {item.name}
                      </FormOption>
                    ))}
                  </FormSelect>
                </label>
                {catalog.isError ? (
                  <button
                    type="button"
                    className="text-sm text-danger"
                    onClick={() => void catalog.refetch()}
                  >
                    دریافت گزینه‌ها ناموفق بود؛ تلاش دوباره
                  </button>
                ) : null}
              </div>
            ))}
            <fieldset className="space-y-2">
              <legend className="text-sm font-bold">
                رشته‌های قابل استفاده
              </legend>
              <HeroInput
                aria-label="جستجوی رشته"
                placeholder="جستجوی رشته"
                className={field}
                value={search.sport}
                onChange={(event) =>
                  setSearch({ ...search, sport: event.target.value })
                }
              />
              <div className="grid max-h-56 gap-3 overflow-y-auto py-2 sm:grid-cols-2">
                {sports.data?.items.map((sport) => (
                  <HeroCheckbox
                    key={sport.id}
                    className="flex gap-2 text-sm"
                    isSelected={draft.sportIds.includes(sport.id)}
                    onChange={(event) =>
                      change(
                        "sportIds",
                        event
                          ? [...draft.sportIds, sport.id]
                          : draft.sportIds.filter((id) => id !== sport.id),
                      )
                    }
                  >
                    <HeroCheckbox.Content>
                      <HeroCheckbox.Control>
                        <HeroCheckbox.Indicator />
                      </HeroCheckbox.Control>
                      {sport.name}
                    </HeroCheckbox.Content>
                  </HeroCheckbox>
                ))}
                {draft.sportIds
                  .filter(
                    (id) =>
                      !sports.data?.items.some((sport) => sport.id === id),
                  )
                  .map((id) => (
                    <HeroCheckbox
                      key={id}
                      className="flex gap-2 text-sm"
                      isSelected
                      onChange={() =>
                        change(
                          "sportIds",
                          draft.sportIds.filter((selected) => selected !== id),
                        )
                      }
                    >
                      <HeroCheckbox.Content>
                        <HeroCheckbox.Control>
                          <HeroCheckbox.Indicator />
                        </HeroCheckbox.Control>
                        رشته ثبت‌شده ({id.slice(-6)})
                      </HeroCheckbox.Content>
                    </HeroCheckbox>
                  ))}
              </div>
              {sports.isError ? (
                <button
                  type="button"
                  className="text-sm text-danger"
                  onClick={() => void sports.refetch()}
                >
                  دریافت رشته‌ها ناموفق بود؛ تلاش دوباره
                </button>
              ) : null}
            </fieldset>
            <label className="block text-sm">
              محیط
              <FormSelect
                aria-label="محیط"
                className={field}
                value={draft.environment}
                onChange={(event) =>
                  change("environment", event as ClubCourt["environment"])
                }
              >
                <FormOption value="indoor">سرپوشیده</FormOption>
                <FormOption value="outdoor">روباز</FormOption>
                <FormOption value="covered">مسقف</FormOption>
              </FormSelect>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ["lengthMeters", "طول (متر)"],
                  ["widthMeters", "عرض (متر)"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="text-sm">
                  {label}
                  <HeroInput
                    className={field}
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={draft[key]}
                    onChange={(event) => change(key, event.target.value)}
                  />
                </label>
              ))}
            </div>
            {(
              [
                [
                  "minimumReservationMinutes",
                  "حداقل مدت رزرو (دقیقه)",
                  1,
                  1440,
                ],
                [
                  "maximumReservationMinutes",
                  "حداکثر مدت رزرو (دقیقه)",
                  1,
                  10080,
                ],
                [
                  "preparationMinutes",
                  "آماده‌سازی پیش از رزرو (دقیقه)",
                  0,
                  1440,
                ],
                ["cleanupMinutes", "نظافت پس از رزرو (دقیقه)", 0, 1440],
              ] as const
            ).map(([key, label, min, max]) => (
              <label key={key} className="block text-sm">
                {label}
                <HeroInput
                  required
                  className={field}
                  type="number"
                  min={min}
                  max={max}
                  step={1}
                  value={draft[key]}
                  onChange={(event) => change(key, Number(event.target.value))}
                />
              </label>
            ))}
            <p className="text-xs leading-6 text-muted">
              محدودیت مدت و زمان آماده‌سازی برای ساخت سانس‌های جدید استفاده
              می‌شود. رزروهای موجود با ویرایش زمین تغییر نمی‌کنند.
            </p>
            <HeroCheckbox
              className="flex gap-2 text-sm"
              isSelected={draft.isReservable}
              onChange={(event) => change("isReservable", event)}
            >
              <HeroCheckbox.Content>
                <HeroCheckbox.Control>
                  <HeroCheckbox.Indicator />
                </HeroCheckbox.Control>
                پذیرش رزرو جدید
              </HeroCheckbox.Content>
            </HeroCheckbox>
            {initial ? (
              <label className="block text-sm">
                وضعیت زمین
                <FormSelect
                  aria-label="وضعیت زمین"
                  className={field}
                  value={draft.status}
                  onChange={(event) =>
                    change("status", event as ClubCourt["status"])
                  }
                >
                  <FormOption value="active">فعال</FormOption>
                  <FormOption value="inactive">غیرفعال</FormOption>
                </FormSelect>
              </label>
            ) : null}
            <p className="text-xs text-muted">
              با توقف پذیرش یا غیرفعال‌کردن زمین، فروش جدید متوقف می‌شود؛
              رزروهای قبلی حفظ می‌شوند.
            </p>
            <fieldset className="space-y-3">
              <legend className="text-sm font-bold">تصاویر زمین</legend>
              <label className="block text-sm">
                افزودن تصویر
                <Uploader
                  multiple={false}
                  accept={imageUploaderAccept}
                  disabled={uploading || draft.galleryMediaIds.length >= 30}
                  labels={{ clickToUpload: "افزودن تصویر زمین" }}
                  onUpload={async (file) => {
                    if (draft.galleryMediaIds.length >= 30)
                      throw new Error("حداکثر ۳۰ تصویر مجاز است");
                    setUploading(true);
                    try {
                      const item = await upload.mutateAsync(file);
                      setUploadedUrls((old) => ({
                        ...old,
                        [item.id]: item.url,
                      }));
                      setDraft((old) => ({
                        ...old,
                        galleryMediaIds: [
                          ...new Set([...old.galleryMediaIds, item.id]),
                        ],
                      }));
                    } finally {
                      setUploading(false);
                    }
                  }}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                {draft.galleryMediaIds.map((id, index) => {
                  const url =
                    uploadedUrls[id] ??
                    media.data?.items.find((item) => item.id === id)?.url;
                  return (
                    <div key={id} className="space-y-2 rounded-xl p-2">
                      {url ? (
                        <Image
                          unoptimized
                          src={url}
                          alt={`تصویر زمین ${index + 1}`}
                          width={200}
                          height={140}
                          className="aspect-video w-full rounded-lg object-cover"
                        />
                      ) : (
                        <p className="py-5 text-center text-xs text-muted">
                          تصویر ثبت‌شده؛ پیش‌نمایش در دسترس نیست
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          aria-label={`جلو بردن تصویر ${index + 1}`}
                          disabled={index === 0}
                          onClick={() => moveImage(index, -1)}
                        >
                          قبلی
                        </button>
                        <button
                          type="button"
                          aria-label={`عقب بردن تصویر ${index + 1}`}
                          disabled={index === draft.galleryMediaIds.length - 1}
                          onClick={() => moveImage(index, 1)}
                        >
                          بعدی
                        </button>
                        <button
                          type="button"
                          aria-label={`حذف تصویر ${index + 1}`}
                          className="text-danger"
                          onClick={() =>
                            change(
                              "galleryMediaIds",
                              draft.galleryMediaIds.filter(
                                (value) => value !== id,
                              ),
                            )
                          }
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </fieldset>
          </div>
        </details>
        <div className="flex gap-3 pt-3">
          <Button type="submit" variant="primary" isPending={busy}>
            {initial ? "ذخیره تغییرات زمین" : "ساخت زمین"}
          </Button>
          <Button type="button" variant="secondary" onPress={onCancel}>
            انصراف
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
