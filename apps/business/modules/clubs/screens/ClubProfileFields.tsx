"use client";

import { Checkbox as HeroCheckbox } from "@heroui/react";
import { FormSelect, FormOption } from "@repo/ui/form-select";
import { Input as HeroInput, TextArea as HeroTextArea } from "@heroui/react";
import type { ClubProfile, ClubBusyHour } from "@api/business";
import { ClubResourceField } from "./ClubResourceField";
import { useState } from "react";

const input =
  "mt-1 w-full rounded-xl border border-border bg-surface p-3 text-sm";
const days = [
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
  "شنبه",
];
const levels = { quiet: "خلوت", moderate: "معمولی", busy: "شلوغ" };

export function ClubProfileFields({
  value,
  onChange,
  trial,
  onTrialChange,
  busyHours,
  onBusyHoursChange,
  resourceLabels = {},
}: {
  value: ClubProfile;
  onChange: (value: ClubProfile) => void;
  trial: boolean;
  onTrialChange: (value: boolean) => void;
  busyHours: ClubBusyHour[];
  onBusyHoursChange: (value: ClubBusyHour[]) => void;
  resourceLabels?: Record<string, { name: string; isActive: boolean }>;
}) {
  const [itemLabels, setItemLabels] = useState<Record<string, string>>({});
  const spaces = value.spaces ?? [];
  const visit = value.firstVisit ?? {};
  return (
    <div className="space-y-8">
      <fieldset className="space-y-4">
        <legend className="mb-3 font-bold">مشخصات تخصصی فضاها</legend>
        <p className="text-sm text-muted">
          برای هر سالن، مجموعه زمین یا استخر مشخصات جدا وارد کنید. موارد نامرتبط
          را خالی بگذارید.
        </p>
        {spaces.map((space, index) => {
          const change = (patch: Partial<typeof space>) =>
            onChange({
              ...value,
              spaces: spaces.map((s, i) =>
                i === index ? { ...s, ...patch } : s,
              ),
            });
          return (
            <div
              key={index}
              className="rounded-2xl border border-border p-4 space-y-3"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <label>
                  نام فضا
                  <HeroInput
                    required
                    maxLength={120}
                    className={input}
                    value={space.name}
                    onChange={(e) => change({ name: e.target.value })}
                  />
                </label>
                {(
                  [
                    [
                      "floorTypeId",
                      "floorType",
                      "court-surface-type",
                      "نوع کف‌پوش",
                    ],
                    ["roofTypeId", "roofType", "roof-type", "نوع سقف"],
                    [
                      "lightingTypeId",
                      "lighting",
                      "lighting-type",
                      "نورپردازی",
                    ],
                  ] as const
                ).map(([field, legacy, resource, label]) => (
                  <ClubResourceField
                    key={field}
                    label={label}
                    resource={resource}
                    value={space[field]}
                    selectedLabel={resourceLabels[space[field] ?? ""]?.name}
                    legacyLabel={space[legacy]}
                    onChange={(id) =>
                      change({ [field]: id, [legacy]: undefined })
                    }
                  />
                ))}
                {(
                  [
                    ["courtCount", "تعداد زمین"],
                    ["areaSquareMeters", "مساحت (متر مربع)"],
                    ["poolLengthMeters", "طول استخر (متر)"],
                    ["poolLaneCount", "تعداد لاین"],
                    ["poolMinDepthMeters", "کمترین عمق (متر)"],
                    ["poolMaxDepthMeters", "بیشترین عمق (متر)"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key}>
                    {label}
                    <HeroInput
                      type="number"
                      min="0.01"
                      max={key.endsWith("Count") ? 10000 : 1000000}
                      step={key.endsWith("Count") ? 1 : "any"}
                      className={input}
                      value={space[key] ?? ""}
                      onChange={(e) =>
                        change({
                          [key]:
                            e.target.value === ""
                              ? undefined
                              : Number(e.target.value),
                        })
                      }
                    />
                  </label>
                ))}
                <ClubResourceField
                  label="نوع تصفیه آب"
                  resource="water-treatment-type"
                  value={space.waterTreatmentTypeId}
                  selectedLabel={
                    resourceLabels[space.waterTreatmentTypeId ?? ""]?.name
                  }
                  legacyLabel={space.waterTreatment}
                  onChange={(id) =>
                    change({
                      waterTreatmentTypeId: id,
                      waterTreatment: undefined,
                    })
                  }
                />
              </div>
              <button
                type="button"
                className="text-sm text-danger"
                onClick={() =>
                  onChange({
                    ...value,
                    spaces: spaces.filter((_, i) => i !== index),
                  })
                }
              >
                حذف فضا
              </button>
            </div>
          );
        })}
        <button
          type="button"
          disabled={spaces.length >= 30}
          className={input}
          onClick={() =>
            onChange({ ...value, spaces: [...spaces, { name: "" }] })
          }
        >
          افزودن سالن، زمین یا استخر
        </button>
      </fieldset>
      <fieldset>
        <legend className="mb-3 font-bold">شرایط تجربه تمرین</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["trainingAreaSquareMeters", "متراژ فضای تمرین"],
              ["classCapacity", "ظرفیت معمول کلاس"],
            ] as const
          ).map(([key, label]) => (
            <label key={key}>
              {label}
              <HeroInput
                type="number"
                min={1}
                max={key === "classCapacity" ? 10000 : 1000000}
                step={key === "classCapacity" ? 1 : "any"}
                className={input}
                value={value[key] ?? ""}
                onChange={(e) =>
                  onChange({
                    ...value,
                    [key]:
                      e.target.value === ""
                        ? undefined
                        : Number(e.target.value),
                  })
                }
              />
            </label>
          ))}
          {(
            [
              [
                "ventilationTypeId",
                "ventilation",
                "ventilation-type",
                "سیستم تهویه",
              ],
              ["coolingTypeId", "cooling", "cooling-type", "سرمایش"],
              ["parkingTypeId", "parking", "parking-type", "نوع پارکینگ"],
              [
                "accessibilityTypeId",
                "wheelchairAccess",
                "accessibility-type",
                "دسترسی ویلچر",
              ],
            ] as const
          ).map(([field, legacy, resource, label]) => (
            <ClubResourceField
              key={field}
              label={label}
              resource={resource}
              value={value[field]}
              selectedLabel={resourceLabels[value[field] ?? ""]?.name}
              legacyLabel={value[legacy]}
              onChange={(id) =>
                onChange({ ...value, [field]: id, [legacy]: undefined })
              }
            />
          ))}
        </div>
        <p className="mt-3 text-sm text-muted">
          دوش، رختکن و دیگر امکانات را در بخش امکانات همراه با وضعیت دسترسی و
          هزینه ثبت کنید.
        </p>
      </fieldset>
      <fieldset className="space-y-3">
        <legend className="mb-3 font-bold">اولین مراجعه و جلسه آزمایشی</legend>
        <HeroCheckbox
          className="flex gap-2"
          isSelected={trial}
          onChange={(e) => onTrialChange(e)}
        >
          <HeroCheckbox.Content>
            <HeroCheckbox.Control>
              <HeroCheckbox.Indicator />
            </HeroCheckbox.Control>
            فعال‌سازی رزرو یک جلسه آزمایشی رایگان
          </HeroCheckbox.Content>
        </HeroCheckbox>
        <p className="text-sm text-muted">
          هر کاربر یک جلسه برای یک نفر در این باشگاه؛ بدون خدمات جانبی و بدون
          پرداخت. رزرو لغوشده قابل تکرار است؛ جلسه تکمیل‌شده یا عدم حضور، فرصت
          آزمایشی را مصرف می‌کند.
        </p>
        <HeroCheckbox
          className="flex gap-2"
          isSelected={visit.visitAvailable ?? false}
          onChange={(e) =>
            onChange({
              ...value,
              firstVisit: { ...visit, visitAvailable: e },
            })
          }
        >
          <HeroCheckbox.Content>
            <HeroCheckbox.Control>
              <HeroCheckbox.Indicator />
            </HeroCheckbox.Control>
            امکان بازدید از باشگاه
          </HeroCheckbox.Content>
        </HeroCheckbox>
        <ClubResourceField
          label="افزودن وسیله لازم"
          category="classes"
          resource="required-item-type"
          onChange={(id, name) => {
            if (id && name)
              setItemLabels((current) => ({ ...current, [id]: name }));
            if (
              id &&
              !(visit.requiredItemIds ?? []).includes(id) &&
              (visit.requiredItemIds?.length ?? 0) < 30
            )
              onChange({
                ...value,
                firstVisit: {
                  ...visit,
                  requiredItemIds: [...(visit.requiredItemIds ?? []), id],
                },
              });
          }}
        />
        <div className="flex flex-wrap gap-2">
          {visit.requiredItemIds?.map((id, index) => (
            <span
              key={id}
              className="rounded-xl border border-border p-2 text-sm"
            >
              {itemLabels[id] ??
                resourceLabels[id]?.name ??
                `وسیله انتخاب‌شده ${index + 1}`}
              <button
                type="button"
                className="ms-2 text-danger"
                aria-label={`حذف وسیله ${index + 1}`}
                onClick={() =>
                  onChange({
                    ...value,
                    firstVisit: {
                      ...visit,
                      requiredItemIds: visit.requiredItemIds?.filter(
                        (item) => item !== id,
                      ),
                    },
                  })
                }
              >
                حذف
              </button>
            </span>
          ))}
        </div>
        {visit.requiredItems?.length ? (
          <p className="text-sm text-muted">
            وسایل ثبت‌شده قبلی: {visit.requiredItems.join("، ")}
          </p>
        ) : null}
        <label className="block">
          چند دقیقه زودتر مراجعه شود؟
          <HeroInput
            type="number"
            min={0}
            max={180}
            className={input}
            value={visit.arrivalMinutesBefore ?? ""}
            onChange={(e) =>
              onChange({
                ...value,
                firstVisit: {
                  ...visit,
                  arrivalMinutesBefore:
                    e.target.value === "" ? undefined : Number(e.target.value),
                },
              })
            }
          />
        </label>
        <label className="block">
          راهنمای مراجعه
          <HeroTextArea
            maxLength={2000}
            className={input}
            value={visit.instructions ?? ""}
            onChange={(e) =>
              onChange({
                ...value,
                firstVisit: { ...visit, instructions: e.target.value },
              })
            }
          />
        </label>
        <label className="block">
          هزینه‌های جانبی
          <HeroInput
            maxLength={500}
            className={input}
            value={visit.extraFees ?? ""}
            onChange={(e) =>
              onChange({
                ...value,
                firstVisit: { ...visit, extraFees: e.target.value },
              })
            }
          />
        </label>
        <p className="text-sm text-muted">
          قیمت پلن‌ها، تعداد جلسات و مدت اعتبار از بخش «عضویت‌ها» مدیریت می‌شود.
        </p>
      </fieldset>
      <fieldset className="space-y-3">
        <legend className="mb-3 font-bold">
          شلوغی معمول ساعت‌ها — اعلام باشگاه
        </legend>
        <p className="text-sm text-muted">
          این جدول تخمین هفتگی شماست، نه حضور زنده یا درصد رزرو. ساعت خالی یعنی
          اطلاعاتی ثبت نشده است. ساعت‌ها به وقت محلی باشگاه هستند.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <caption className="sr-only">
              شلوغی هفتگی باشگاه بر حسب ساعت
            </caption>
            <thead>
              <tr>
                <th>ساعت</th>
                {[6, 0, 1, 2, 3, 4, 5].map((day) => (
                  <th key={day} className="p-2">
                    {days[day]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 24 }, (_, hour) => (
                <tr key={hour}>
                  <th className="p-2">{String(hour).padStart(2, "0")}:۰۰</th>
                  {[6, 0, 1, 2, 3, 4, 5].map((day) => {
                    const cell = busyHours.find(
                      (h) => h.dayOfWeek === day && h.hour === hour,
                    );
                    return (
                      <td key={day} className="p-1">
                        <FormSelect
                          aria-label={`${days[day]} ساعت ${hour}`}
                          className="rounded-lg border border-border bg-surface p-2"
                          value={cell?.level ?? ""}
                          onChange={(e) => {
                            const next = busyHours.filter(
                              (h) => h.dayOfWeek !== day || h.hour !== hour,
                            );
                            if (e)
                              next.push({
                                dayOfWeek: day,
                                hour,
                                level: e as ClubBusyHour["level"],
                              });
                            onBusyHoursChange(next);
                          }}
                        >
                          <FormOption value="">نامشخص</FormOption>
                          {Object.entries(levels).map(([key, label]) => (
                            <FormOption key={key} value={key}>
                              {label}
                            </FormOption>
                          ))}
                        </FormSelect>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </fieldset>
    </div>
  );
}
