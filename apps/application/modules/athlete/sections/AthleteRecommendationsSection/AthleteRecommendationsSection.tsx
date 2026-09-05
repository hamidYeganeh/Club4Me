"use client";

import { useAthleteClassRecommendations } from "@api";
import { Card, Chip, Typography } from "@heroui/react";

import { ButtonLink } from "@/components/button-link";
import { CompactCardListSkeleton } from "@/components/loading-skeletons";

const money = new Intl.NumberFormat("fa-IR");

export function AthleteRecommendationsSection() {
  const query = useAthleteClassRecommendations();

  return (
    <section aria-labelledby="athlete-recommendations-title">
      <div className="mb-3">
        <Typography id="athlete-recommendations-title" type="h4" weight="bold">
          پیشنهاد برای شما
        </Typography>
        <p className="mt-1 text-xs text-muted">
          بر اساس موقعیت پیش‌فرض، ورزش‌ها و سابقه ثبت‌نام شما
        </p>
      </div>
      {query.isPending ? (
        <CompactCardListSkeleton count={2} />
      ) : null}
      {query.isError ? (
        <Card className="app-card rounded-2xl p-5 text-center text-sm text-muted shadow-none">
          پیشنهادها فعلاً در دسترس نیستند.
        </Card>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {query.data?.items.slice(0, 4).map((item) => (
          <ButtonLink
            key={item.id}
            href={`/discovery/business-class?classId=${item.id}`}
            variant="ghost"
            className="h-auto justify-stretch p-0 text-start no-underline"
          >
            <Card className="app-card h-full w-full rounded-2xl p-4 shadow-none">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-bold">{item.title}</p>
                  <p className="mt-1 truncate text-xs text-muted">
                    {item.club.name} · {item.sport || "ورزش"}
                  </p>
                </div>
                <Chip
                  size="sm"
                  color={item.remainingCapacity ? "success" : "warning"}
                  variant="soft"
                >
                  {item.remainingCapacity
                    ? `${money.format(item.remainingCapacity)} ظرفیت`
                    : "لیست انتظار"}
                </Chip>
              </div>
              <p className="mt-3 text-xs text-primary">{item.reasons[0]}</p>
              <div className="mt-3 flex items-center justify-between border-t border-white/7 pt-3 text-xs text-muted">
                <span>{money.format(item.price)} ریال</span>
                <span>
                  {item.distanceKm === null
                    ? "فاصله نامشخص"
                    : `${money.format(Math.round(item.distanceKm * 10) / 10)} کیلومتر`}
                </span>
              </div>
            </Card>
          </ButtonLink>
        ))}
      </div>
      {!query.isPending && !query.isError && !query.data?.items.length ? (
        <Card className="app-card rounded-2xl p-5 text-center text-sm text-muted shadow-none">
          با چند رزرو یا ثبت موقعیت، پیشنهادها دقیق‌تر می‌شوند.
        </Card>
      ) : null}
    </section>
  );
}
