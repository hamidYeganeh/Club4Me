"use client";

import { Checkbox as HeroCheckbox } from "@heroui/react";
import { useAthleteClassRecommendations } from "@api";
import { Icon } from "@theme/icon";
import { useState } from "react";
import { RecommendationPreferencesForm } from "./RecommendationPreferencesForm";
import { Button, Card, Typography } from "@heroui/react";

import Link from "@/components/app-link";
import {
  CardArrow,
  FeatureBadge,
  featureCardStyles,
} from "@/components/ui/feature-cards";
import { CompactCardListSkeleton } from "@/components/loading-skeletons";

const money = new Intl.NumberFormat("fa-IR");

export function AthleteRecommendationsSection({
  expanded = false,
}: {
  expanded?: boolean;
}) {
  const query = useAthleteClassRecommendations();
  const [editing, setEditing] = useState(expanded);
  const [selected, setSelected] = useState<string[]>([]);
  const all = [
    ...(query.data?.items ?? []),
    ...(query.data?.alternatives ?? []),
  ];
  const compared = all.filter((item) => selected.includes(item.id));

  return (
    <section aria-labelledby="athlete-recommendations-title">
      <div className="mb-3">
        <Typography id="athlete-recommendations-title" type="h4" weight="bold">
          پیشنهاد برای شما
        </Typography>
        <p className="mt-1 text-xs text-muted">
          بر اساس زمان، بودجه، موقعیت و سابقه ثبت‌نام شما
        </p>
      </div>
      {!expanded && (
        <Link
          href="/athlete/recommendations"
          className="mb-3 inline-flex min-h-11 items-center text-sm font-semibold text-accent"
        >
          همه پیشنهادها و مقایسه ←
        </Link>
      )}
      <Button
        className="mb-3"
        variant="secondary"
        onPress={() => setEditing((v) => !v)}
        aria-expanded={editing}
      >
        زمان و ترجیحات من
      </Button>
      {editing && query.isSuccess && (
        <RecommendationPreferencesForm
          initial={query.data.preferences}
          onSaved={() => {
            setEditing(false);
            setSelected([]);
          }}
        />
      )}
      {query.isPending ? <CompactCardListSkeleton count={2} /> : null}
      {query.isError ? (
        <Card className="app-card rounded-2xl p-5 text-center text-sm text-muted shadow-none">
          پیشنهادها فعلاً در دسترس نیستند.
          <Button variant="ghost" onPress={() => void query.refetch()}>
            تلاش دوباره
          </Button>
        </Card>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {query.data?.items.slice(0, expanded ? 8 : 4).map((item) => (
          <div key={item.id} className="min-w-0">
            <Link
              href={`/discovery/business-class?classId=${item.id}`}
              className={featureCardStyles.suggestion}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <FeatureBadge>{item.sport || "ورزش"}</FeatureBadge>
                <span className="text-xs text-muted">
                  {item.remainingCapacity
                    ? `${money.format(item.remainingCapacity)} ظرفیت`
                    : "لیست انتظار"}
                </span>
              </div>
              <p className="mt-3 text-xs leading-6 text-muted">
                {item.reasons[0]}
              </p>
              <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                <div className="min-w-0">
                  <h3 className="text-base font-bold leading-7">
                    {item.title}
                  </h3>
                  <p className="text-xs leading-6 text-muted">
                    {item.club.name}
                  </p>
                  <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                    <span>
                      <span className="text-accent" aria-hidden="true">
                        ●{" "}
                      </span>
                      {money.format(item.price)}{" "}
                      {item.currency === "IRR" ? "ریال" : item.currency}
                    </span>
                    {item.distanceKm !== null && (
                      <span>
                        {money.format(Math.round(item.distanceKm * 10) / 10)}{" "}
                        کیلومتر
                      </span>
                    )}
                  </p>
                </div>
                <CardArrow />
              </div>
            </Link>
            <HeroCheckbox
              className="flex min-h-11 items-center gap-2 px-3 text-xs"
              isSelected={selected.includes(item.id)}
              isDisabled={selected.length >= 3 && !selected.includes(item.id)}
              onChange={(e) =>
                setSelected((current) =>
                  e
                    ? [...current, item.id]
                    : current.filter((id) => id !== item.id),
                )
              }
            >
              <HeroCheckbox.Content>
                <HeroCheckbox.Control>
                  <HeroCheckbox.Indicator />
                </HeroCheckbox.Control>
                مقایسه {item.title}
              </HeroCheckbox.Content>
            </HeroCheckbox>
          </div>
        ))}
      </div>
      {!query.isPending && !query.isError && !query.data?.items.length ? (
        <Card className="app-card rounded-2xl p-5 text-center text-sm text-muted shadow-none">
          <span
            aria-hidden="true"
            className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl border border-border bg-surface-secondary text-accent"
          >
            <Icon name="calendar-check" size={28} />
          </span>
          <h3 className="text-base font-semibold text-foreground">
            برای پیدا کردن کلاس، کمی انعطاف بده
          </h3>
          <p className="mx-auto mt-2 max-w-xs leading-7">
            کلاسی با این شرایط پیدا نشد. زمان یا بودجه را تغییر بده یا گزینه‌های
            جایگزین را بررسی کن.
          </p>
          <Button
            className="mt-4 self-center"
            variant="secondary"
            onPress={() => setEditing(true)}
          >
            ویرایش زمان و بودجه
          </Button>
        </Card>
      ) : null}
      {compared.length > 0 && (
        <section
          className="mt-4 rounded-2xl border border-border bg-surface p-4"
          aria-label="مقایسه کلاس‌ها"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold">مقایسه انتخاب‌ها · حداکثر ۳ کلاس</h3>
            <Button size="sm" variant="ghost" onPress={() => setSelected([])}>
              پاک‌کردن
            </Button>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {compared.map((item) => (
              <div
                key={item.id}
                className="space-y-2 rounded-xl bg-surface-secondary p-3 text-sm"
              >
                <h4 className="font-bold">{item.title}</h4>
                <p>{item.club.name}</p>
                <p>
                  {money.format(item.price)}{" "}
                  {item.currency === "IRR" ? "ریال" : item.currency} ·{" "}
                  {
                    (
                      {
                        monthly: "ماهانه",
                        course: "کل دوره",
                        per_session: "هر جلسه",
                        package: "بسته",
                      } as const
                    )[item.pricingModel]
                  }
                </p>
                <p>سطح: {item.level || "اعلام نشده"}</p>
                <p>
                  {item.distanceKm == null
                    ? "فاصله مشخص نیست"
                    : `${money.format(item.distanceKm)} کیلومتر`}
                </p>
                <p>
                  {item.enrollmentMode === "automatic"
                    ? "پذیرش خودکار"
                    : "نیازمند تأیید باشگاه"}
                </p>
                <p>
                  {item.remainingCapacity > 0
                    ? `${money.format(item.remainingCapacity)} ظرفیت خالی`
                    : "لیست انتظار"}
                </p>
                <Link
                  className="inline-flex min-h-11 items-center text-accent"
                  href={`/discovery/business-class?classId=${item.id}`}
                >
                  جزئیات و ثبت‌نام ←
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
      {!query.data?.items.length && !!query.data?.alternatives?.length && (
        <div className="mt-4 space-y-3">
          <h3 className="font-semibold">گزینه‌های جایگزین با یک تفاوت</h3>
          <p className="text-xs text-muted">
            ترجیحات ذخیره‌شده شما تغییر نکرده‌اند.
          </p>
          {query.data.alternatives.map((item) => (
            <Link
              key={item.id}
              href={`/discovery/business-class?classId=${item.id}`}
              className="block rounded-2xl border border-border p-4"
            >
              <h4 className="font-semibold">{item.title}</h4>
              <p className="mt-1 text-xs text-muted">
                {item.club.name} · {item.mismatches?.join("، ")}
              </p>
              <span className="mt-2 inline-block text-sm text-accent">
                بررسی جزئیات ←
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
