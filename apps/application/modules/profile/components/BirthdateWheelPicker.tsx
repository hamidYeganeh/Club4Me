"use client";

import { useEffect, useMemo, useState } from "react";
import {
  iranDateInputValue,
  parseIranDateInput,
} from "@repo/ui/iran-date";
import { useTranslations } from "next-intl";

import {
  WheelPicker,
  type WheelPickerOption,
} from "@/components/motion/wheel-picker";

const PERSIAN_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
] as const;
const MINIMUM_YEAR = 1300;

type PersianDateParts = { year: number; month: number; day: number };

function todayInTehran(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function parsePersianParts(value: string): PersianDateParts | null {
  const match = /^(\d{4})\/(\d{2})\/(\d{2})$/.exec(
    iranDateInputValue(value),
  );
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function daysInMonth(year: number, month: number) {
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  return parseIranDateInput(`${year}/12/30`) ? 30 : 29;
}

function toOption(value: number, label = value.toLocaleString("fa-IR")) {
  return { value: String(value), label } satisfies WheelPickerOption;
}

export function BirthdateWheelPicker({
  value,
  disabled,
  onValueChange,
}: {
  value: string;
  disabled?: boolean;
  onValueChange: (value: string) => void;
}) {
  const t = useTranslations("profile");
  const today = useMemo(
    () => parsePersianParts(todayInTehran()) ?? { year: 1405, month: 1, day: 1 },
    [],
  );
  const initial = useMemo(
    () =>
      parsePersianParts(value) ?? {
        year: Math.max(MINIMUM_YEAR, today.year - 25),
        month: today.month,
        day: today.day,
      },
    [today, value],
  );
  const [selected, setSelected] = useState(initial);

  const yearOptions = useMemo(
    () =>
      Array.from(
        { length: today.year - MINIMUM_YEAR + 1 },
        (_, index) => toOption(MINIMUM_YEAR + index),
      ),
    [today.year],
  );
  const maximumMonth = selected.year === today.year ? today.month : 12;
  const monthOptions = useMemo(
    () =>
      PERSIAN_MONTHS.slice(0, maximumMonth).map((label, index) =>
        toOption(index + 1, label),
      ),
    [maximumMonth],
  );
  const naturalMaximumDay = daysInMonth(selected.year, selected.month);
  const maximumDay =
    selected.year === today.year && selected.month === today.month
      ? Math.min(naturalMaximumDay, today.day)
      : naturalMaximumDay;
  const dayOptions = useMemo(
    () =>
      Array.from({ length: maximumDay }, (_, index) => toOption(index + 1)),
    [maximumDay],
  );

  const update = (next: Partial<PersianDateParts>) => {
    const proposed = { ...selected, ...next };
    const monthLimit = proposed.year === today.year ? today.month : 12;
    proposed.month = Math.min(proposed.month, monthLimit);
    const dayLimit =
      proposed.year === today.year && proposed.month === today.month
        ? Math.min(daysInMonth(proposed.year, proposed.month), today.day)
        : daysInMonth(proposed.year, proposed.month);
    proposed.day = Math.min(proposed.day, dayLimit);
    setSelected(proposed);
    const civilDate = parseIranDateInput(
      `${proposed.year}/${proposed.month}/${proposed.day}`,
    );
    if (civilDate) onValueChange(civilDate);
  };

  useEffect(() => {
    if (!value) {
      const civilDate = parseIranDateInput(
        `${initial.year}/${initial.month}/${initial.day}`,
      );
      if (civilDate) onValueChange(civilDate);
    }
  }, [initial, onValueChange, value]);

  return (
    <div className="app-card w-full overflow-hidden p-3 active:scale-100">
      <div className="mb-2 grid grid-cols-[0.8fr_1.35fr_1fr] gap-2 px-1 text-center text-xs font-medium text-muted">
        <span>{t("birthdateDay")}</span>
        <span>{t("birthdateMonth")}</span>
        <span>{t("birthdateYear")}</span>
      </div>
      <div
        dir="rtl"
        className="grid grid-cols-[0.8fr_1.35fr_1fr] gap-2"
        aria-label={t("birthdatePickerLabel")}
      >
        <WheelPicker
          options={dayOptions}
          value={String(selected.day)}
          onValueChange={(day) => update({ day: Number(day) })}
          aria-label={t("birthdateDay")}
          disabled={disabled}
          className="border-0 bg-surface-secondary/70"
        />
        <WheelPicker
          options={monthOptions}
          value={String(selected.month)}
          onValueChange={(month) => update({ month: Number(month) })}
          aria-label={t("birthdateMonth")}
          disabled={disabled}
          className="border-0 bg-surface-secondary/70"
        />
        <WheelPicker
          options={yearOptions}
          value={String(selected.year)}
          onValueChange={(year) => update({ year: Number(year) })}
          aria-label={t("birthdateYear")}
          disabled={disabled}
          className="border-0 bg-surface-secondary/70"
        />
      </div>
      <p className="mt-3 text-center text-sm text-muted">
        {t("editBirthdateHint")}
      </p>
    </div>
  );
}
