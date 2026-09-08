"use client";

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

const field =
  "mt-2 min-h-11 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm";
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
  const surfaces = useBusinessCatalog("sports", "surface-type", {
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
        {(
          [
            ["name", "نام زمین", 120],
            ["code", "کد زمین", 40],
            ["locationLabel", "محل زمین", 120],
            ["floor", "طبقه", 40],
          ] as const
        ).map(([key, label, max]) => (
          <label key={key} className="block text-sm">
            {label}
            <input
              className={field}
              required={key === "name"}
              minLength={key === "name" ? 2 : undefined}
              maxLength={max}
              value={draft[key]}
              onChange={(event) => change(key, event.target.value)}
            />
          </label>
        ))}
        <label className="block text-sm">
          توضیحات
          <textarea
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
              <input
                className={field}
                value={search[searchKey]}
                onChange={(event) =>
                  setSearch({ ...search, [searchKey]: event.target.value })
                }
              />
            </label>
            <label className="mt-2 block text-sm">
              {label}
              <select
                className={field}
                value={draft[key]}
                onChange={(event) => change(key, event.target.value)}
              >
                <option value="">مشخص نشده</option>
                {draft[key] &&
                !catalog.data?.items.some((item) => item.id === draft[key]) ? (
                  <option value={draft[key]}>گزینه ثبت‌شده</option>
                ) : null}
                {catalog.data?.items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
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
          <legend className="text-sm font-bold">رشته‌های قابل استفاده</legend>
          <input
            aria-label="جستجوی رشته"
            placeholder="جستجوی رشته"
            className={field}
            value={search.sport}
            onChange={(event) =>
              setSearch({ ...search, sport: event.target.value })
            }
          />
          {sports.data?.items.map((sport) => (
            <label key={sport.id} className="flex gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.sportIds.includes(sport.id)}
                onChange={(event) =>
                  change(
                    "sportIds",
                    event.target.checked
                      ? [...draft.sportIds, sport.id]
                      : draft.sportIds.filter((id) => id !== sport.id),
                  )
                }
              />
              {sport.name}
            </label>
          ))}
          {draft.sportIds
            .filter(
              (id) => !sports.data?.items.some((sport) => sport.id === id),
            )
            .map((id) => (
              <label key={id} className="flex gap-2 text-sm">
                <input
                  type="checkbox"
                  checked
                  onChange={() =>
                    change(
                      "sportIds",
                      draft.sportIds.filter((selected) => selected !== id),
                    )
                  }
                />
                رشته ثبت‌شده ({id.slice(-6)})
              </label>
            ))}
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
          <select
            className={field}
            value={draft.environment}
            onChange={(event) =>
              change(
                "environment",
                event.target.value as ClubCourt["environment"],
              )
            }
          >
            <option value="indoor">سرپوشیده</option>
            <option value="outdoor">روباز</option>
            <option value="covered">مسقف</option>
          </select>
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
              <input
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
            ["capacity", "ظرفیت زمین", 1, 1000],
            ["minimumReservationMinutes", "حداقل مدت رزرو (دقیقه)", 1, 1440],
            ["maximumReservationMinutes", "حداکثر مدت رزرو (دقیقه)", 1, 10080],
            ["preparationMinutes", "آماده‌سازی پیش از رزرو (دقیقه)", 0, 1440],
            ["cleanupMinutes", "نظافت پس از رزرو (دقیقه)", 0, 1440],
          ] as const
        ).map(([key, label, min, max]) => (
          <label key={key} className="block text-sm">
            {label}
            <input
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
          محدودیت مدت و زمان آماده‌سازی برای ساخت سانس‌های جدید استفاده می‌شود.
          رزروهای موجود با ویرایش زمین تغییر نمی‌کنند.
        </p>
        <label className="flex gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.isReservable}
            onChange={(event) => change("isReservable", event.target.checked)}
          />
          پذیرش رزرو جدید
        </label>
        {initial ? (
          <label className="block text-sm">
            وضعیت زمین
            <select
              className={field}
              value={draft.status}
              onChange={(event) =>
                change("status", event.target.value as ClubCourt["status"])
              }
            >
              <option value="active">فعال</option>
              <option value="inactive">غیرفعال</option>
            </select>
          </label>
        ) : null}
        <p className="text-xs text-muted">
          با توقف پذیرش یا غیرفعال‌کردن زمین، فروش جدید متوقف می‌شود؛ رزروهای
          قبلی حفظ می‌شوند.
        </p>
        <fieldset className="space-y-3">
          <legend className="text-sm font-bold">تصاویر زمین</legend>
          <label className="block text-sm">
            افزودن تصویر
            <input
              aria-label="افزودن تصویر زمین"
              className={field}
              type="file"
              accept="image/*"
              multiple
              disabled={draft.galleryMediaIds.length >= 30}
              onChange={async (event) => {
                const files = Array.from(event.target.files ?? []);
                event.target.value = "";
                if (!files.length) return;
                if (draft.galleryMediaIds.length + files.length > 30) {
                  toast.danger("حداکثر ۳۰ تصویر مجاز است.");
                  return;
                }
                setUploading(true);
                try {
                  for (const file of files) {
                    const item = await upload.mutateAsync(file);
                    if (!item.mimeType.startsWith("image/"))
                      throw new Error("فقط تصویر قابل افزودن است.");
                    setUploadedUrls((old) => ({ ...old, [item.id]: item.url }));
                    setDraft((old) => ({
                      ...old,
                      galleryMediaIds: [
                        ...new Set([...old.galleryMediaIds, item.id]),
                      ],
                    }));
                  }
                } catch {
                  toast.danger("بارگذاری کامل نشد؛ تصاویر موفق حفظ شدند.");
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
                <div
                  key={id}
                  className="space-y-2 rounded-xl border border-border p-2"
                >
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
                          draft.galleryMediaIds.filter((value) => value !== id),
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
        <div className="flex gap-3">
          <Button type="submit" variant="primary" isPending={busy}>
            {initial ? "ذخیره تغییرات زمین" : "ساخت زمین"}
          </Button>
          {initial ? (
            <Button type="button" variant="secondary" onPress={onCancel}>
              بستن ویرایش
            </Button>
          ) : null}
        </div>
      </fieldset>
    </form>
  );
}
