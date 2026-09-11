"use client";
import { Checkbox as HeroCheckbox } from "@heroui/react";
import { useState } from "react";
import { Button, Input } from "@heroui/react";
import {
  useSaveRecommendationPreferences,
  type RecommendationPreferences,
} from "@api";
import { Counter } from "@/components/counter";
import Link from "@/components/app-link";
import { weekdays, fieldClass } from "@modules/training/shared";

export function RecommendationPreferencesForm({
  initial,
  onSaved,
}: {
  initial?: RecommendationPreferences;
  onSaved: () => void;
}) {
  const [value, setValue] = useState<RecommendationPreferences>(
    initial ?? {
      weekdays: [],
      timeFrom: "",
      timeTo: "",
      maxPrice: null,
      radiusKm: null,
      level: "",
      sport: "",
      availableOnly: true,
    },
  );
  const mutation = useSaveRecommendationPreferences();
  return (
    <form
      className="mt-4 space-y-4 rounded-2xl border border-border bg-surface p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await mutation.mutateAsync(value);
          onSaved();
        } catch {
          /* Inline failure preserves the form. */
        }
      }}
    >
      <fieldset disabled={mutation.isPending} className="space-y-4">
        <legend className="font-semibold">کلاس متناسب با برنامه من</legend>
        <p className="text-xs leading-6 text-muted">
          روزها و ساعت‌ها به وقت ایران هستند. برنامه جلسات باقی‌مانده باید در
          بازه انتخابی جا بگیرد.
        </p>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="روزهای آزاد"
        >
          {weekdays.map((day, index) => (
            <Button
              key={day}
              size="sm"
              aria-pressed={value.weekdays.includes(index)}
              variant={value.weekdays.includes(index) ? "primary" : "secondary"}
              onPress={() =>
                setValue((v) => ({
                  ...v,
                  weekdays: v.weekdays.includes(index)
                    ? v.weekdays.filter((d) => d !== index)
                    : [...v.weekdays, index],
                }))
              }
            >
              {day}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted">
          بدون انتخاب روز، همه روزهای هفته بررسی می‌شوند.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            از ساعت
            <Input
              type="time"
              aria-label="از ساعت"
              value={value.timeFrom}
              onChange={(e) => setValue({ ...value, timeFrom: e.target.value })}
              className={fieldClass}
            />
          </label>
          <label className="text-sm">
            تا ساعت
            <Input
              type="time"
              aria-label="تا ساعت"
              min={value.timeFrom}
              value={value.timeTo}
              onChange={(e) => setValue({ ...value, timeTo: e.target.value })}
              className={fieldClass}
            />
          </label>
        </div>
        <label className="block text-sm">
          سقف قیمت کل کلاس · ریال
          <Counter
            aria-label="سقف قیمت کل کلاس به ریال"
            min={0}
            max={1e12}
            step={100000}
            value={value.maxPrice ?? ""}
            onChange={(e) =>
              setValue({
                ...value,
                maxPrice: e.target.value === "" ? null : Number(e.target.value),
              })
            }
          />
        </label>
        <label className="block text-sm">
          حداکثر فاصله · کیلومتر
          <Counter
            aria-label="حداکثر فاصله به کیلومتر"
            min={0.5}
            max={100}
            step={0.5}
            value={value.radiusKm ?? ""}
            onChange={(e) =>
              setValue({
                ...value,
                radiusKm: e.target.value === "" ? null : Number(e.target.value),
              })
            }
          />
        </label>
        <Link
          href="/athlete/profile/locations"
          className="inline-flex min-h-11 items-center text-xs text-accent"
        >
          تنظیم موقعیت پیش‌فرض برای محاسبه فاصله ←
        </Link>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            رشته دلخواه
            <Input
              maxLength={120}
              value={value.sport}
              placeholder="مثلاً یوگا"
              onChange={(e) => setValue({ ...value, sport: e.target.value })}
              className={fieldClass}
            />
          </label>
          <label className="text-sm">
            سطح کلاس
            <Input
              maxLength={80}
              value={value.level}
              placeholder="مثلاً مبتدی؛ خالی یعنی همه"
              onChange={(e) => setValue({ ...value, level: e.target.value })}
              className={fieldClass}
            />
          </label>
        </div>
        <HeroCheckbox
          className="flex min-h-11 items-center gap-2 text-sm"
          isSelected={value.availableOnly}
          onChange={(e) => setValue({ ...value, availableOnly: e })}
        >
          <HeroCheckbox.Content>
            <HeroCheckbox.Control>
              <HeroCheckbox.Indicator />
            </HeroCheckbox.Control>
            فقط کلاس‌های دارای ظرفیت
          </HeroCheckbox.Content>
        </HeroCheckbox>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" isPending={mutation.isPending}>
            ذخیره و نمایش پیشنهادها
          </Button>
          <Button
            variant="ghost"
            onPress={() =>
              setValue({
                weekdays: [],
                timeFrom: "",
                timeTo: "",
                maxPrice: null,
                radiusKm: null,
                level: "",
                sport: "",
                availableOnly: true,
              })
            }
          >
            پاک‌کردن محدودیت‌ها
          </Button>
        </div>
      </fieldset>
      {mutation.isError && (
        <p role="alert" className="text-sm text-danger">
          ذخیره انجام نشد؛ بازه ساعت و اتصال را بررسی کنید. انتخاب‌ها حفظ
          شده‌اند.
        </p>
      )}
    </form>
  );
}
