"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Button, Card, Chip, Spinner, Switch, toast } from "@heroui/react";
import {
  useAdminAppReleases,
  useSaveAdminAppRelease,
  type AppPlatform,
  type SaveAppRelease,
} from "@api/admin";

const platformLabels: Record<AppPlatform, string> = {
  android: "اندروید",
  ios: "iOS",
};

const featureFlagLabels: Record<string, string> = {
  discoveryDeals: "پیشنهادهای ویژه صفحه کشف",
  reminderWidget: "ویجت یادآوری اندروید",
  clubReviews: "امتیاز و نظر کاربران",
};

const emptyRelease: SaveAppRelease = {
  latestVersion: "1.0.0",
  minimumSupportedVersion: "1.0.0",
  title: "نسخه جدید Gym4Me",
  releaseNotes: [],
  storeUrl: "",
  active: false,
  maintenanceEnabled: false,
  maintenanceTitle: "در حال به‌روزرسانی سرویس",
  maintenanceMessage: "چند دقیقه دیگر دوباره تلاش کنید.",
  featureFlags: {},
};

export function AppReleasesScreen() {
  const releases = useAdminAppReleases();
  const saveRelease = useSaveAdminAppRelease();
  const [platform, setPlatform] = useState<AppPlatform>("android");
  const [form, setForm] = useState<SaveAppRelease>(emptyRelease);
  const [notes, setNotes] = useState("");
  const [loadedReleaseKey, setLoadedReleaseKey] = useState("android:new");

  const selectedRelease = useMemo(
    () => releases.data?.items.find((item) => item.platform === platform),
    [platform, releases.data?.items],
  );

  const releaseKey = `${platform}:${selectedRelease?.updatedAt ?? "new"}`;
  if (releaseKey !== loadedReleaseKey) {
    const next = selectedRelease ?? emptyRelease;
    setLoadedReleaseKey(releaseKey);
    setForm({
      latestVersion: next.latestVersion,
      minimumSupportedVersion: next.minimumSupportedVersion,
      title: next.title,
      releaseNotes: next.releaseNotes,
      storeUrl: next.storeUrl,
      active: next.active,
      maintenanceEnabled: next.maintenanceEnabled,
      maintenanceTitle: next.maintenanceTitle,
      maintenanceMessage: next.maintenanceMessage,
      featureFlags: next.featureFlags,
    });
    setNotes(next.releaseNotes.join("\n"));
  }

  const updateField = <K extends keyof SaveAppRelease>(
    field: K,
    value: SaveAppRelease[K],
  ) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const releaseNotes = notes
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    try {
      await saveRelease.mutateAsync({
        platform,
        payload: { ...form, releaseNotes },
      });
      toast.success("تنظیمات انتشار ذخیره شد");
    } catch {
      toast.danger("ذخیره تنظیمات انتشار ناموفق بود");
    }
  };

  return (
    <main className="flex-1 overflow-auto p-4 lg:p-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">انتشار نسخه اپ</h1>
              <Chip size="sm" color={form.active ? "success" : "default"}>
                {form.active ? "فعال" : "غیرفعال"}
              </Chip>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">
              قابلیت‌های جدید را اعلام کنید و حداقل نسخه‌ای را که اجازه ورود
              دارد مشخص کنید.
            </p>
          </div>
          <div className="flex rounded-2xl border border-border bg-surface p-1">
            {(["android", "ios"] as const).map((item) => (
              <Button
                key={item}
                size="sm"
                variant={platform === item ? "primary" : "ghost"}
                onPress={() => setPlatform(item)}
              >
                {platformLabels[item]}
              </Button>
            ))}
          </div>
        </div>

        {releases.isPending ? (
          <div className="flex justify-center py-24">
            <Spinner />
          </div>
        ) : releases.isError ? (
          <Card
            variant="transparent"
            className="mt-6 rounded-[1.75rem] border border-danger/30 bg-danger/5 p-8 text-center"
          >
            <p>دریافت تنظیمات نسخه ناموفق بود.</p>
            <Button
              className="mt-4"
              variant="secondary"
              onPress={() => releases.refetch()}
            >
              تلاش دوباره
            </Button>
          </Card>
        ) : (
          <form
            onSubmit={submit}
            className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]"
          >
            <Card
              variant="transparent"
              className="rounded-[1.75rem] border border-border bg-surface p-5 lg:p-7"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="آخرین نسخه منتشرشده" hint="مثلاً 2.4.0">
                  <input
                    required
                    dir="ltr"
                    inputMode="decimal"
                    pattern="[0-9]+\\.[0-9]+(\\.[0-9]+)?"
                    value={form.latestVersion}
                    onChange={(event) =>
                      updateField("latestVersion", event.target.value)
                    }
                    className="release-input"
                  />
                </Field>
                <Field
                  label="حداقل نسخه مجاز"
                  hint="نسخه‌های پایین‌تر فورس آپدیت می‌گیرند"
                >
                  <input
                    required
                    dir="ltr"
                    inputMode="decimal"
                    pattern="[0-9]+\\.[0-9]+(\\.[0-9]+)?"
                    value={form.minimumSupportedVersion}
                    onChange={(event) =>
                      updateField("minimumSupportedVersion", event.target.value)
                    }
                    className="release-input"
                  />
                </Field>
                <Field label="عنوان پیام" className="sm:col-span-2">
                  <input
                    required
                    maxLength={160}
                    value={form.title}
                    onChange={(event) =>
                      updateField("title", event.target.value)
                    }
                    className="release-input"
                  />
                </Field>
                <Field
                  label="قابلیت‌ها و تغییرات جدید"
                  hint="هر مورد را در یک خط بنویسید"
                  className="sm:col-span-2"
                >
                  <textarea
                    rows={7}
                    maxLength={4000}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    className="release-input min-h-40 resize-y py-3"
                  />
                </Field>
                <Field
                  label="لینک فروشگاه"
                  hint="Google Play، بازار، مایکت یا App Store"
                  className="sm:col-span-2"
                >
                  <input
                    required
                    dir="ltr"
                    type="url"
                    placeholder="https://..."
                    value={form.storeUrl}
                    onChange={(event) =>
                      updateField("storeUrl", event.target.value)
                    }
                    className="release-input"
                  />
                </Field>
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
                <div>
                  <p className="font-medium">فعال‌سازی سیاست نسخه</p>
                  <p className="mt-1 text-xs text-muted">
                    در حالت غیرفعال هیچ پیامی در اپ نمایش داده نمی‌شود.
                  </p>
                </div>
                <Switch
                  isSelected={form.active}
                  onChange={(selected) => updateField("active", selected)}
                  aria-label="فعال‌سازی سیاست نسخه"
                />
              </div>
              <div className="mt-6 space-y-4 border-t border-border pt-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">حالت تعمیرات</p>
                    <p className="mt-1 text-xs text-muted">
                      دسترسی کاربران این پلتفرم را موقتاً متوقف می‌کند.
                    </p>
                  </div>
                  <Switch
                    isSelected={form.maintenanceEnabled}
                    onChange={(selected) =>
                      updateField("maintenanceEnabled", selected)
                    }
                    aria-label="فعال‌سازی حالت تعمیرات"
                  />
                </div>
                {form.maintenanceEnabled ? (
                  <div className="grid gap-4">
                    <Field label="عنوان حالت تعمیرات">
                      <input
                        required
                        maxLength={160}
                        value={form.maintenanceTitle}
                        onChange={(event) =>
                          updateField("maintenanceTitle", event.target.value)
                        }
                        className="release-input"
                      />
                    </Field>
                    <Field label="پیام حالت تعمیرات">
                      <textarea
                        required
                        rows={3}
                        maxLength={1000}
                        value={form.maintenanceMessage}
                        onChange={(event) =>
                          updateField("maintenanceMessage", event.target.value)
                        }
                        className="release-input resize-y py-3"
                      />
                    </Field>
                  </div>
                ) : null}
              </div>
              <div className="mt-6 border-t border-border pt-6">
                <p className="font-medium">Feature flags</p>
                <p className="mt-1 text-xs text-muted">
                  قابلیت‌ها را بدون انتشار نسخه جدید روشن یا خاموش کنید.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {Object.entries(featureFlagLabels).map(([key, label]) => (
                    <label
                      key={key}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-border p-3"
                    >
                      <span className="text-sm">{label}</span>
                      <Switch
                        isSelected={form.featureFlags[key] ?? false}
                        onChange={(selected) =>
                          updateField("featureFlags", {
                            ...form.featureFlags,
                            [key]: selected,
                          })
                        }
                        aria-label={label}
                      />
                    </label>
                  ))}
                </div>
              </div>
              <Button
                type="submit"
                variant="primary"
                className="mt-6 w-full sm:w-auto"
                isDisabled={saveRelease.isPending}
              >
                {saveRelease.isPending ? "در حال ذخیره…" : "ذخیره و انتشار"}
              </Button>
            </Card>

            <aside className="space-y-4">
              <Card
                variant="transparent"
                className="rounded-[1.75rem] border border-border bg-surface p-5"
              >
                <p className="text-sm font-semibold">رفتار فعلی</p>
                <div className="mt-4 space-y-4 text-sm leading-6">
                  <StatusDot
                    color="bg-danger"
                    title="آپدیت اجباری"
                    detail={`کمتر از ${form.minimumSupportedVersion}`}
                  />
                  <StatusDot
                    color="bg-warning"
                    title="آپدیت پیشنهادی"
                    detail={`از ${form.minimumSupportedVersion} تا قبل از ${form.latestVersion}`}
                  />
                  <StatusDot
                    color="bg-success"
                    title="به‌روز"
                    detail={`${form.latestVersion} یا بالاتر`}
                  />
                </div>
              </Card>
              <Card
                variant="transparent"
                className="rounded-[1.75rem] border border-accent/25 bg-accent/5 p-5 text-sm leading-7"
              >
                فورس آپدیت را فقط زمانی منتشر کنید که نسخه جدید واقعاً در
                فروشگاه در دسترس باشد؛ در غیر این صورت کاربر راهی برای ورود به
                اپ ندارد.
              </Card>
              {selectedRelease?.updatedAt ? (
                <p className="px-2 text-xs text-muted tabular-nums">
                  آخرین تغییر:{" "}
                  {new Intl.DateTimeFormat("fa-IR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(selectedRelease.updatedAt))}
                </p>
              ) : null}
            </aside>
          </form>
        )}
      </div>
    </main>
  );
}

function Field({
  label,
  hint,
  className = "",
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-medium">{label}</span>
      {hint ? <span className="me-2 text-xs text-muted">{hint}</span> : null}
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

function StatusDot({
  color,
  title,
  detail,
}: {
  color: string;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className={`mt-2 size-2 shrink-0 rounded-full ${color}`} />
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-xs text-muted" dir="ltr">
          {detail}
        </p>
      </div>
    </div>
  );
}
