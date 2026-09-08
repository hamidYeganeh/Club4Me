"use client";

import { Icon, type IconName } from "@theme/icon";
import { useState } from "react";
import type { PublicClubDetails } from "@api";
import Link from "@/components/app-link";

const days = [
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
  "شنبه",
];
const roofs = {
  open: "روباز",
  covered: "سرپوشیده",
  retractable: "سقف متحرک",
  partial: "نیمه‌مسقف",
};
const levels = { quiet: "خلوت", moderate: "معمولی", busy: "شلوغ" };
const colors = {
  quiet: "bg-success/20",
  moderate: "bg-warning/20",
  busy: "bg-danger/20",
};
const badges = {
  identity: "هویت تأییدشده",
  documents: "مدارک بررسی‌شده",
  on_site: "بازدید حضوری",
};

export function ClubProfileSection({ club }: { club: PublicClubDetails }) {
  const [day, setDay] = useState(6);
  const [now] = useState(() => Date.now());
  const profile = club.profile ?? {};
  const visit = profile.firstVisit;
  const label = (id?: string, legacy?: string) =>
    id ? (club.profileResources?.[id]?.name ?? "گزینه ثبت‌شده") : legacy;
  const requiredItems = [
    ...(visit?.requiredItems ?? []),
    ...(visit?.requiredItemIds ?? []).map((id) => label(id)!),
  ];
  const hours = club.busyHours ?? [];
  const weekday = club.weeklyHours.find((item) => item.dayOfWeek === day);
  const hasSchedule = Boolean(weekday);
  const wheelchair = {
    yes: "دارد",
    partial: "بخشی از مجموعه",
    no: "ندارد",
    unknown: "مشخص نشده",
  };
  return (
    <section className="mx-auto w-full max-w-4xl space-y-6 px-5 pb-8">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(badges) as Array<keyof typeof badges>).map((key) =>
          club.verifications?.[key] ? (
            <span
              key={key}
              className="rounded-full bg-success/15 px-3 py-1 text-xs"
              title={`تاریخ بررسی: ${new Date(club.verifications[key]!.verifiedAt).toLocaleDateString("fa-IR")}`}
            >
              {badges[key]}
            </span>
          ) : null,
        )}
      </div>
      <div className="space-y-4 rounded-2xl border border-border p-4">
        <h2 className="text-xl font-bold">شرایط مراجعه و ساعت کاری</h2>
        {club.audience?.length ? (
          <p className="text-sm">
            مناسب برای:{" "}
            {club.audience
              .map(
                (value) =>
                  ({
                    men: "آقایان",
                    women: "بانوان",
                    mixed: "مختلط",
                    children: "کودکان",
                    family: "خانواده",
                  })[value],
              )
              .join("، ")}
          </p>
        ) : null}
        {club.minAge != null || club.maxAge != null ? (
          <p className="text-sm">
            سن مجاز:{" "}
            {club.minAge != null
              ? `از ${club.minAge.toLocaleString("fa-IR")}`
              : "بدون حداقل"}{" "}
            {club.maxAge != null
              ? `تا ${club.maxAge.toLocaleString("fa-IR")} سال`
              : "بدون حداکثر"}
          </p>
        ) : null}
        {club.weeklyHours.length ? (
          <dl className="divide-y divide-border text-sm">
            {[6, 0, 1, 2, 3, 4, 5].map((dow) => {
              const hours = club.weeklyHours.find(
                (item) => item.dayOfWeek === dow,
              );
              return (
                <div key={dow} className="flex justify-between gap-4 py-3">
                  <dt>{days[dow]}</dt>
                  <dd className="flex flex-col items-end gap-2">
                    {!hours
                      ? "ثبت نشده"
                      : hours.isClosed
                        ? "تعطیل"
                        : hours.periods.length
                          ? hours.periods.map((period, index) => {
                              const audience =
                                period.audience ??
                                (club.audience.length === 1 &&
                                (club.audience[0] === "men" ||
                                  club.audience[0] === "women")
                                  ? club.audience[0]
                                  : hours.periods.length === 2
                                    ? index === 0
                                      ? "men"
                                      : "women"
                                    : "mixed");
                              const label =
                                audience === "men"
                                  ? "آقایان"
                                  : audience === "women"
                                    ? "بانوان"
                                    : "عمومی";
                              const icon: IconName =
                                audience === "men"
                                  ? "gender-male"
                                  : audience === "women"
                                    ? "gender-female"
                                    : "users-two";
                              return (
                                <span
                                  key={`${period.opensAt}-${index}`}
                                  className="flex items-center gap-2"
                                >
                                  <Icon
                                    name={icon}
                                    label={label}
                                    className="text-accent"
                                    size={20}
                                  />
                                  <span className="text-xs text-muted">
                                    {label}
                                  </span>
                                  <span dir="ltr">
                                    {period.opensAt} – {period.closesAt}
                                  </span>
                                </span>
                              );
                            })
                          : "ثبت نشده"}
                  </dd>
                </div>
              );
            })}
          </dl>
        ) : (
          <p className="text-sm text-muted">
            ساعت کاری ثبت نشده است؛ پیش از مراجعه هماهنگ کنید.
          </p>
        )}
        {(club.closures ?? [])
          .filter((item) => new Date(item.endsAt).getTime() >= now)
          .map((item) => (
            <p
              key={item.startsAt}
              className="rounded-xl bg-warning/10 p-3 text-sm"
            >
              تعطیلی: {new Date(item.startsAt).toLocaleDateString("fa-IR")} تا{" "}
              {new Date(item.endsAt).toLocaleDateString("fa-IR")} ·{" "}
              {item.reason}
            </p>
          ))}
      </div>
      {profile.spaces?.length ? (
        <div className="space-y-3">
          <h2 className="text-xl font-bold">مشخصات تخصصی فضاها</h2>
          {profile.spaces.map((space, index) => (
            <article
              key={index}
              className="rounded-2xl bg-surface-secondary p-4"
            >
              <h3 className="font-bold">{space.name}</h3>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                {(
                  [
                    ["کف‌پوش", label(space.floorTypeId, space.floorType)],
                    [
                      "سقف",
                      label(
                        space.roofTypeId,
                        space.roofType ? roofs[space.roofType] : undefined,
                      ),
                    ],
                    ["نورپردازی", label(space.lightingTypeId, space.lighting)],
                    ["تعداد زمین", space.courtCount],
                    ["مساحت (متر مربع)", space.areaSquareMeters],
                    ["طول استخر (متر)", space.poolLengthMeters],
                    ["تعداد لاین", space.poolLaneCount],
                    ["کمترین عمق (متر)", space.poolMinDepthMeters],
                    ["بیشترین عمق (متر)", space.poolMaxDepthMeters],
                    [
                      "تصفیه آب",
                      label(space.waterTreatmentTypeId, space.waterTreatment),
                    ],
                  ] as const
                ).map(([label, value]) =>
                  value != null && value !== "" ? (
                    <div key={label}>
                      <dt className="text-muted">{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ) : null,
                )}
              </dl>
            </article>
          ))}
        </div>
      ) : null}
      <dl className="grid grid-cols-2 gap-3 text-sm">
        {(
          [
            ["فضای تمرین (متر مربع)", profile.trainingAreaSquareMeters],
            ["ظرفیت معمول کلاس", profile.classCapacity],
            ["تهویه", label(profile.ventilationTypeId, profile.ventilation)],
            ["سرمایش", label(profile.coolingTypeId, profile.cooling)],
            ["پارکینگ", label(profile.parkingTypeId, profile.parking)],
            [
              "دسترسی ویلچر",
              label(
                profile.accessibilityTypeId,
                profile.wheelchairAccess
                  ? wheelchair[profile.wheelchairAccess]
                  : undefined,
              ),
            ],
          ] as const
        ).map(([label, value]) =>
          value != null && value !== "" ? (
            <div key={label} className="rounded-xl bg-surface-secondary p-3">
              <dt className="text-muted">{label}</dt>
              <dd>{value}</dd>
            </div>
          ) : null,
        )}
      </dl>
      {visit || club.trialBookingEnabled ? (
        <div className="space-y-3 rounded-2xl bg-surface-secondary p-4">
          <h2 className="text-xl font-bold">اولین مراجعه</h2>
          {requiredItems.length ? (
            <p className="text-sm">وسایل لازم: {requiredItems.join("، ")}</p>
          ) : null}
          {visit?.arrivalMinutesBefore != null && (
            <p className="text-sm">
              {visit.arrivalMinutesBefore} دقیقه قبل از جلسه مراجعه کنید.
            </p>
          )}
          {visit?.instructions && (
            <p className="whitespace-pre-line text-sm">{visit.instructions}</p>
          )}
          {visit?.extraFees && (
            <p className="text-sm">هزینه‌های جانبی: {visit.extraFees}</p>
          )}
          {visit?.visitAvailable && (
            <p className="text-sm">امکان بازدید از باشگاه وجود دارد.</p>
          )}
          {club.trialBookingEnabled && (
            <>
              <p className="text-sm">
                یک جلسه آزمایشی رایگان برای هر کاربر، یک نفر و بدون خدمات جانبی.
              </p>
              <Link
                className="inline-block rounded-xl bg-accent px-4 py-2 text-accent-foreground"
                href={`/discovery/clubs/${club.slug}/slots`}
              >
                انتخاب جلسه آزمایشی
              </Link>
            </>
          )}
        </div>
      ) : null}
      {hours.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-bold">شلوغی معمول ساعت‌ها</h2>
          <p className="text-xs text-muted">
            اعلام باشگاه · به وقت {club.location?.timezone ?? "Asia/Tehran"} ·
            آمار زنده نیست
          </p>
          <div className="flex gap-2 overflow-x-auto">
            {[6, 0, 1, 2, 3, 4, 5].map((d) => (
              <button
                type="button"
                key={d}
                aria-pressed={day === d}
                onClick={() => setDay(d)}
                className={`shrink-0 rounded-full px-3 py-2 text-sm ${day === d ? "bg-accent text-accent-foreground" : "bg-surface-secondary"}`}
              >
                {days[d]}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {Array.from({ length: 24 }, (_, hour) => {
              const start = `${String(hour).padStart(2, "0")}:00`;
              const end = `${String(hour + 1).padStart(2, "0")}:00`;
              const closed =
                hasSchedule &&
                (weekday!.isClosed ||
                  !weekday!.periods.some(
                    (p) => p.opensAt < end && p.closesAt > start,
                  ));
              const cell = hours.find(
                (h) => h.dayOfWeek === day && h.hour === hour,
              );
              return (
                <div
                  key={hour}
                  className={`rounded-xl p-2 text-center text-xs ${closed || !cell ? "bg-surface-secondary text-muted" : colors[cell.level]}`}
                >
                  <span dir="ltr">{start}</span>
                  <p className="mt-1">
                    {closed ? "تعطیل" : cell ? levels[cell.level] : "نامشخص"}
                  </p>
                </div>
              );
            })}
          </div>
          {club.busyHoursUpdatedAt && (
            <p className="text-xs text-muted">
              به‌روزرسانی شلوغی:{" "}
              {new Date(club.busyHoursUpdatedAt).toLocaleDateString("fa-IR")}
            </p>
          )}
        </div>
      )}
      <p className="text-xs text-muted">
        آخرین به‌روزرسانی اطلاعات باشگاه:{" "}
        {new Date(club.updatedAt).toLocaleDateString("fa-IR")}
      </p>
    </section>
  );
}
