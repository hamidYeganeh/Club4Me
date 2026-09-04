"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  useCreateUserLocation,
  useUpdateUserLocation,
  useUserLocations,
} from "@api/locations";
import { Typography } from "@heroui/react";
import { Icon } from "@theme/icon";

import { NeshanMap, type GeoPoint } from "@/components/maps/neshan-map";

const TEHRAN = { latitude: 35.6892, longitude: 51.389 };

type Props = {
  role: "athlete" | "coach";
  locationId?: string;
};

export function LocationFormScreen({ role, locationId }: Props) {
  const router = useRouter();
  const locations = useUserLocations(Boolean(locationId));
  const existing = useMemo(
    () => locations.data?.items.find((item) => item.id === locationId),
    [locationId, locations.data?.items],
  );
  const create = useCreateUserLocation();
  const update = useUpdateUserLocation();
  const [point, setPoint] = useState<GeoPoint | null>(null);
  const [error, setError] = useState("");
  const initialPoint = existing
    ? { latitude: existing.latitude, longitude: existing.longitude }
    : TEHRAN;
  const selectedPoint = point ?? initialPoint;
  const pending = create.isPending || update.isPending;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = {
      title: String(form.get("title") ?? "").trim(),
      address: String(form.get("address") ?? "").trim(),
      countryId: String(form.get("countryId") ?? "").trim(),
      provinceId: String(form.get("provinceId") ?? "").trim(),
      cityId: String(form.get("cityId") ?? "").trim(),
      districtId: String(form.get("districtId") ?? "").trim() || null,
      cityRegionId: String(form.get("cityRegionId") ?? "").trim() || null,
      latitude: selectedPoint.latitude,
      longitude: selectedPoint.longitude,
      isDefault: form.get("isDefault") === "on",
    };

    try {
      if (locationId) await update.mutateAsync({ id: locationId, ...payload });
      else await create.mutateAsync(payload);
      router.push(`/${role}/profile/locations`);
    } catch {
      setError("ذخیره لوکیشن ناموفق بود. اطلاعات را بررسی و دوباره تلاش کنید.");
    }
  }

  if (locationId && locations.isLoading) {
    return (
      <Typography type="body" color="muted" align="center" className="p-8">
        در حال بارگذاری...
      </Typography>
    );
  }
  if (locationId && !existing) {
    return (
      <main className="p-8 text-center">
        <Typography type="body" className="mb-4 text-danger">
          لوکیشن پیدا نشد.
        </Typography>
        <button type="button" onClick={() => void locations.refetch()}>
          تلاش دوباره
        </button>
      </main>
    );
  }

  return (
    <main className="app-page">
      <header className="app-header justify-between">
        <Link
          href={`/${role}/profile/locations`}
          className="app-icon-button"
          aria-label="بازگشت"
        >
          <Icon name="chevron-right" size={20} />
        </Link>
        <Typography type="h4">
          {existing ? "ویرایش لوکیشن" : "افزودن لوکیشن"}
        </Typography>
        <span className="size-11" />
      </header>
      <div aria-hidden className="app-header-spacer mb-6" />

      <form
        key={existing?.id ?? "new"}
        onSubmit={(event) => void submit(event)}
        className="app-reveal flex flex-col gap-4"
      >
        <Field
          label="عنوان"
          name="title"
          defaultValue={existing?.title}
          minLength={2}
          maxLength={30}
          required
        />
        <Field
          label="آدرس"
          name="address"
          defaultValue={existing?.address}
          maxLength={300}
          required
          multiline
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field
            label="شناسه کشور"
            name="countryId"
            defaultValue={existing?.countryId}
            required
          />
          <Field
            label="شناسه استان"
            name="provinceId"
            defaultValue={existing?.provinceId}
            required
          />
          <Field
            label="شناسه شهر"
            name="cityId"
            defaultValue={existing?.cityId}
            required
          />
          <Field
            label="شناسه منطقه"
            name="districtId"
            defaultValue={existing?.districtId ?? ""}
          />
          <Field
            label="شناسه ناحیه شهری"
            name="cityRegionId"
            defaultValue={existing?.cityRegionId ?? ""}
          />
        </div>

        <div>
          <Typography type="body-sm" weight="bold" className="mb-2">
            انتخاب نقطه روی نقشه
          </Typography>
          <NeshanMap
            center={selectedPoint}
            marker={selectedPoint}
            onPointChange={setPoint}
            className="h-72 overflow-hidden rounded-[1.6rem] border border-white/7"
          />
          <Typography
            type="body-xs"
            color="muted"
            className="mt-2"
            render={({ children, ...p }) => (
              <p dir="ltr" {...p}>
                {children}
              </p>
            )}
          >
            {selectedPoint.latitude.toFixed(6)},{" "}
            {selectedPoint.longitude.toFixed(6)}
          </Typography>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isDefault"
            defaultChecked={existing?.isDefault}
          />
          انتخاب به‌عنوان لوکیشن پیش‌فرض
        </label>

        {error ? (
          <Typography type="body-sm" className="text-danger">
            {error}
          </Typography>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="h-13 rounded-[1.15rem] bg-accent font-bold text-accent-foreground shadow-[0_12px_30px_color-mix(in_oklch,var(--accent)_22%,transparent)] transition-transform active:scale-[0.98] disabled:opacity-50"
        >
          {pending ? "در حال ذخیره..." : "ذخیره لوکیشن"}
        </button>
      </form>
    </main>
  );
}

function Field({
  label,
  multiline,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  multiline?: boolean;
}) {
  const classes = "app-field mt-2 w-full py-3";
  return (
    <label>
      <Typography type="body-sm" weight="bold">
        {label}
      </Typography>
      {multiline ? (
        <textarea
          name={props.name}
          defaultValue={String(props.defaultValue ?? "")}
          required={props.required}
          maxLength={props.maxLength}
          rows={3}
          className={classes}
        />
      ) : (
        <input {...props} className={classes} />
      )}
    </label>
  );
}
