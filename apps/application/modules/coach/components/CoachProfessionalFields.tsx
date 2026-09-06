"use client";

import { useId, type ReactNode } from "react";
import { Button, toast } from "@heroui/react";
import { coachLevelLabels, type CoachProfessionalProfile } from "@api";

const control =
  "w-full rounded-xl border border-border bg-surface-secondary px-3 py-3 text-sm outline-none focus:border-accent";
type Profile = CoachProfessionalProfile;

export function CoachProfessionalFields({
  value,
  onChange,
  minAge,
  maxAge,
  onMinAge,
  onMaxAge,
  upload,
  uploading,
}: {
  value: Profile;
  onChange: (value: Profile) => void;
  minAge: string;
  maxAge: string;
  onMinAge: (value: string) => void;
  onMaxAge: (value: string) => void;
  upload: (file: File) => Promise<string>;
  uploading: boolean;
}) {
  const set = <K extends keyof Profile>(key: K, next: Profile[K]) =>
    onChange({ ...value, [key]: next });
  const updateRow = <
    K extends "credentials" | "achievements" | "successStories",
  >(
    key: K,
    index: number,
    changes: Partial<Profile[K][number]>,
  ) => {
    set(
      key,
      value[key].map((row, i) =>
        i === index ? { ...row, ...changes } : row,
      ) as Profile[K],
    );
  };
  return (
    <div className="space-y-7 border-t border-border pt-6">
      <Group
        title="مخاطب و هدف تمرین"
        description="کمک کنید ورزشکار بفهمد همکاری با شما برای او مناسب است یا نه."
      >
        <Text
          label="مناسب چه کسانی است؟"
          value={value.audience}
          onChange={(v) => set("audience", v)}
          multiline
          max={1500}
          placeholder="مثلاً بزرگسالانی که تمرین قدرتی را از پایه شروع می‌کنند"
        />
        <Text
          label="هدف‌های تمرین"
          value={value.goals.join("،")}
          onChange={(v) => set("goals", v.split(/[،,]/))}
          max={1200}
          placeholder="افزایش قدرت، یادگیری تکنیک، آمادگی مسابقه"
        />
        <p className="text-xs text-muted">حداکثر ۱۲ هدف؛ با ویرگول جدا کنید.</p>
        <fieldset>
          <legend className="mb-3 text-sm font-bold">سطح شاگردان</legend>
          <div className="flex flex-wrap gap-3">
            {Object.entries(coachLevelLabels).map(([key, label]) => (
              <label
                key={key}
                className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={value.levels.includes(
                    key as Profile["levels"][number],
                  )}
                  onChange={(e) =>
                    set(
                      "levels",
                      e.target.checked
                        ? [...value.levels, key as Profile["levels"][number]]
                        : value.levels.filter((v) => v !== key),
                    )
                  }
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid grid-cols-2 gap-3">
          <Text
            label="حداقل سن"
            value={minAge}
            onChange={onMinAge}
            type="number"
          />
          <Text
            label="حداکثر سن"
            value={maxAge}
            onChange={onMaxAge}
            type="number"
          />
        </div>
        <Text
          label="پیش‌نیازها و شرایط پذیرش"
          value={value.prerequisites}
          onChange={(v) => set("prerequisites", v)}
          multiline
          max={1500}
        />
      </Group>
      <Group
        title="مسیر همکاری"
        description="روند واقعی آموزش و پیگیری خود را توضیح دهید."
      >
        {(
          [
            ["firstSession", "در جلسه اول چه می‌گذرد؟"],
            ["planning", "برنامه چطور شخصی‌سازی می‌شود؟"],
            ["followUp", "پشتیبانی بین جلسات"],
            ["progressTracking", "روش ارزیابی پیشرفت"],
          ] as const
        ).map(([key, label]) => (
          <Text
            key={key}
            label={label}
            value={value[key]}
            onChange={(v) => set(key, v)}
            multiline
            max={1500}
          />
        ))}
        <Text
          label="لینک ویدئوی معرفی یا نمونه آموزش"
          type="url"
          value={value.introductionVideoUrl}
          onChange={(v) => set("introductionVideoUrl", v)}
          max={1000}
          placeholder="https://www.aparat.com/v/..."
        />
        <p className="text-xs text-muted">
          لینک عمومی با https؛ ویدئو با انتخاب ورزشکار باز می‌شود.
        </p>
      </Group>
      <Group
        title="مدارک و صلاحیت‌ها"
        description="جزئیات مدارک در پروفایل نمایش داده می‌شود. ثبت مدرک به معنی تأیید اصالت آن نیست؛ تصویر مدرک در صفحه عمومی نمایش داده نمی‌شود."
      >
        {value.credentials.map((row, index) => (
          <fieldset
            key={index}
            className="space-y-3 rounded-2xl border border-border p-4"
            disabled={uploading}
          >
            <legend className="px-2 text-sm font-bold">مدرک {index + 1}</legend>
            <Text
              label="عنوان مدرک و درجه مربیگری"
              value={row.title}
              onChange={(title) => updateRow("credentials", index, { title })}
              required
              max={160}
            />
            <Text
              label="صادرکننده مدرک"
              value={row.issuer}
              onChange={(issuer) => updateRow("credentials", index, { issuer })}
              required
              max={160}
            />
            <div className="grid grid-cols-2 gap-3">
              <Text
                label="سال دریافت"
                value={row.year}
                onChange={(year) => updateRow("credentials", index, { year })}
                max={30}
                placeholder="۱۴۰۳"
              />
              <Text
                label="تاریخ انقضا (میلادی)"
                value={row.expiresOn}
                onChange={(expiresOn) =>
                  updateRow("credentials", index, { expiresOn })
                }
                type="date"
              />
            </div>
            <label className="block space-y-2 text-sm">
              <span>تصویر مدرک (اختیاری)</span>
              <input
                className={control}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={uploading}
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  event.target.value = "";
                  if (
                    !["image/jpeg", "image/png", "image/webp"].includes(
                      file.type,
                    ) ||
                    file.size > 10 * 1024 * 1024
                  ) {
                    toast.danger(
                      "تصویر JPG، PNG یا WebP با حجم حداکثر ۱۰ مگابایت انتخاب کنید.",
                    );
                    return;
                  }
                  try {
                    updateRow("credentials", index, {
                      mediaId: await upload(file),
                    });
                  } catch {
                    toast.danger("بارگذاری تصویر مدرک ناموفق بود");
                  }
                }}
              />
            </label>
            {row.mediaId ? (
              <div className="flex items-center justify-between gap-2 text-sm">
                <span>تصویر مدرک پیوست شده</span>
                <Button
                  type="button"
                  variant="ghost"
                  onPress={() =>
                    updateRow("credentials", index, { mediaId: undefined })
                  }
                >
                  حذف تصویر مدرک
                </Button>
              </div>
            ) : null}
            <Remove
              label="حذف مدرک"
              onPress={() =>
                set(
                  "credentials",
                  value.credentials.filter((_, i) => i !== index),
                )
              }
            />
          </fieldset>
        ))}
        <Button
          type="button"
          variant="secondary"
          isDisabled={value.credentials.length >= 20 || uploading}
          onPress={() =>
            set("credentials", [
              ...value.credentials,
              { title: "", issuer: "", year: "", expiresOn: "" },
            ])
          }
        >
          افزودن مدرک
        </Button>
      </Group>
      <Group
        title="افتخارات"
        description="نام مسابقه یا رویداد، سال و نقش خود را دقیق بنویسید."
      >
        {value.achievements.map((row, index) => (
          <fieldset
            key={index}
            className="space-y-3 rounded-2xl border border-border p-4"
          >
            <legend className="px-2 text-sm font-bold">
              افتخار {index + 1}
            </legend>
            <Text
              label="عنوان افتخار و نقش شما"
              value={row.title}
              onChange={(title) => updateRow("achievements", index, { title })}
              required
              max={200}
            />
            <Text
              label="مسابقه یا سازمان"
              value={row.organization}
              onChange={(organization) =>
                updateRow("achievements", index, { organization })
              }
              max={160}
            />
            <Text
              label="سال کسب افتخار"
              value={row.year}
              onChange={(year) => updateRow("achievements", index, { year })}
              max={30}
            />
            <Remove
              label="حذف افتخار"
              onPress={() =>
                set(
                  "achievements",
                  value.achievements.filter((_, i) => i !== index),
                )
              }
            />
          </fieldset>
        ))}
        <Button
          type="button"
          variant="secondary"
          isDisabled={value.achievements.length >= 20}
          onPress={() =>
            set("achievements", [
              ...value.achievements,
              { title: "", organization: "", year: "" },
            ])
          }
        >
          افزودن افتخار
        </Button>
      </Group>
      <Group
        title="نمونه پیشرفت شاگردان"
        description="مسیر و نتیجه واقعی همکاری را بدون اطلاعات شناسایی شاگرد بنویسید. انتشار هر نمونه به رضایت او نیاز دارد."
      >
        {value.successStories.map((row, index) => (
          <fieldset
            key={index}
            className="space-y-3 rounded-2xl border border-border p-4"
          >
            <legend className="px-2 text-sm font-bold">
              نمونه {index + 1}
            </legend>
            <Text
              label="عنوان نمونه"
              value={row.title}
              onChange={(title) =>
                updateRow("successStories", index, { title })
              }
              required
              max={160}
            />
            <Text
              label="هدف اولیه شاگرد"
              value={row.goal}
              onChange={(goal) => updateRow("successStories", index, { goal })}
              required
              max={500}
            />
            <Text
              label="مدت همکاری"
              value={row.duration}
              onChange={(duration) =>
                updateRow("successStories", index, { duration })
              }
              required
              max={100}
              placeholder="مثلاً ۱۲ هفته"
            />
            <Text
              label="مسیر تمرین و نتیجه ثبت‌شده"
              value={row.outcome}
              onChange={(outcome) =>
                updateRow("successStories", index, { outcome })
              }
              required
              multiline
              max={1500}
            />
            <label className="flex items-start gap-2 text-sm leading-7">
              <input
                type="checkbox"
                required
                className="mt-2"
                checked={row.consent}
                onChange={(e) =>
                  updateRow("successStories", index, {
                    consent: e.target.checked,
                  })
                }
              />
              رضایت شاگرد را برای انتشار این نمونه دریافت کرده‌ام.
            </label>
            <Remove
              label="حذف نمونه"
              onPress={() =>
                set(
                  "successStories",
                  value.successStories.filter((_, i) => i !== index),
                )
              }
            />
          </fieldset>
        ))}
        <Button
          type="button"
          variant="secondary"
          isDisabled={value.successStories.length >= 12}
          onPress={() =>
            set("successStories", [
              ...value.successStories,
              {
                title: "",
                goal: "",
                duration: "",
                outcome: "",
                consent: false,
              },
            ])
          }
        >
          افزودن نمونه پیشرفت
        </Button>
      </Group>
    </div>
  );
}

function Group({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="min-w-0 space-y-4">
      <legend className="text-base font-bold">{title}</legend>
      <p className="text-sm leading-7 text-muted">{description}</p>
      {children}
    </fieldset>
  );
}
function Remove({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Button type="button" variant="ghost" onPress={onPress}>
      {label}
    </Button>
  );
}
function Text({
  label,
  value,
  onChange,
  multiline,
  required,
  max,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  required?: boolean;
  max?: number;
  type?: string;
  placeholder?: string;
}) {
  const id = useId();
  const props = {
    id,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(e.target.value),
    required,
    maxLength: max,
    minLength: required ? 2 : undefined,
    placeholder,
    className: control,
  };
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-bold">
        {label}
      </label>
      {multiline ? (
        <textarea {...props} rows={3} />
      ) : (
        <input
          {...props}
          type={type}
          min={type === "number" ? 0 : undefined}
          max={type === "number" ? 120 : undefined}
          dir={["url", "date"].includes(type) ? "ltr" : undefined}
        />
      )}
    </div>
  );
}
