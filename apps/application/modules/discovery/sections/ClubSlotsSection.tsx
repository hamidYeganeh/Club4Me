"use client";

import { ClubEmptyState } from "@modules/discovery/components/ClubEmptyState";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Typography } from "@heroui/react";
import { useReservableSessions } from "@api";
import type { PublicClubDetails } from "@api";
import { useTranslations } from "next-intl";
import { Icon } from "@theme/icon";
import {
  HeatmapCells,
  HeatmapChart,
  HeatmapInteractionBoundary,
  HeatmapInteractionProvider,
  HeatmapLegend,
  HeatmapTooltip,
  type HeatmapColumn,
} from "@/components/charts/heatmap";

function toDateKey(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

const persianMonthKeyFormatter = new Intl.DateTimeFormat("fa-IR", {
  calendar: "persian",
  year: "numeric",
  month: "numeric",
});

const persianTooltipDateFormatter = new Intl.DateTimeFormat(
  "fa-IR-u-ca-persian-nu-persian",
  {
    day: "numeric",
    month: "long",
    year: "numeric",
  }
);

const persianTooltipWeekdayFormatter = new Intl.DateTimeFormat(
  "fa-IR-u-ca-persian-nu-persian",
  { weekday: "long" }
);

const persianCellDayFormatter = new Intl.DateTimeFormat(
  "fa-IR-u-ca-persian-nu-persian",
  { day: "numeric" }
);

function getPersianMonthKey(date: Date) {
  return persianMonthKeyFormatter
    .formatToParts(date)
    .filter((part) => part.type === "year" || part.type === "month")
    .map((part) => part.value)
    .join("-");
}

type ClubSchedule = Pick<
  PublicClubDetails,
  "id" | "weeklyHours" | "closures" | "operationalStatus"
>;

function isClubClosedOnDate(club: ClubSchedule, date: Date): boolean {
  if (club.operationalStatus !== "active") {
    return true;
  }

  if (
    club.weeklyHours.find((hours) => hours.dayOfWeek === date.getDay())
      ?.isClosed
  ) {
    return true;
  }

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  return club.closures.some(
    (closure) =>
      new Date(closure.startsAt) <= dayEnd &&
      new Date(closure.endsAt) >= dayStart
  );
}

export function ClubSlotsSection({ club }: { club: ClubSchedule }) {
  const router = useRouter();
  const t = useTranslations("discovery.clubDetail");
  const sessions = useReservableSessions(club.id);

  const { chartData, calendarDates, monthLabel, totalAvailable } =
    useMemo(() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const currentMonthKey = getPersianMonthKey(today);

      const monthStart = new Date(today);
      while (true) {
        const previous = new Date(monthStart);
        previous.setDate(previous.getDate() - 1);
        if (getPersianMonthKey(previous) !== currentMonthKey) break;
        monthStart.setDate(monthStart.getDate() - 1);
      }

      const monthEnd = new Date(today);
      while (true) {
        const next = new Date(monthEnd);
        next.setDate(next.getDate() + 1);
        if (getPersianMonthKey(next) !== currentMonthKey) break;
        monthEnd.setDate(monthEnd.getDate() + 1);
      }

      // Persian calendars run Saturday through Friday. Include the surrounding
      // days needed to complete the first and last visual week.
      const gridStart = new Date(monthStart);
      gridStart.setDate(gridStart.getDate() - ((gridStart.getDay() + 1) % 7));
      const gridEnd = new Date(monthEnd);
      gridEnd.setDate(gridEnd.getDate() + ((5 - gridEnd.getDay() + 7) % 7));
      const dayCount =
        Math.round((gridEnd.getTime() - gridStart.getTime()) / 86_400_000) + 1;
      const dates = Array.from({ length: dayCount }, (_, index) => {
        const date = new Date(gridStart);
        date.setDate(gridStart.getDate() + index);
        return date;
      });

      const availableByDate = new Map<string, number>();
      for (const session of sessions.data?.items ?? []) {
        if (
          session.status === "active" &&
          session.reservedCount < session.capacity
        ) {
          const startsAt = new Date(session.startsAt);
          const key = toDateKey(startsAt);
          availableByDate.set(key, (availableByDate.get(key) ?? 0) + 1);
        }
      }

      const weekCount = dayCount / 7;
      const data: HeatmapColumn[] = Array.from(
        { length: 7 },
        (_, dayIndex) => ({
          bin: dayIndex,
          bins: Array.from({ length: weekCount }, (_, weekIndex) => {
            const date = dates[weekIndex * 7 + dayIndex];
            const inCurrentMonth = getPersianMonthKey(date) === currentMonthKey;
            return {
              bin: weekIndex,
              count: inCurrentMonth
                ? (availableByDate.get(toDateKey(date)) ?? 0)
                : 0,
              date,
            };
          }),
        }),
      );

      return {
        chartData: data,
        calendarDates: dates,
        monthLabel: new Intl.DateTimeFormat("fa-IR", {
          calendar: "persian",
          month: "long",
          year: "numeric",
        }).format(today),
        totalAvailable: data.reduce(
          (total, column) =>
            total + column.bins.reduce((sum, bin) => sum + bin.count, 0),
          0,
        ),
      };
    }, [sessions.data?.items]);

  const weekdayDates = calendarDates.slice(0, 7);

  return (
    <section className="mx-auto w-full min-w-0 max-w-4xl overflow-hidden px-4 pb-8">
      <div className="mb-4 flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2.5">
          <Icon name="calendar-1" size={24} className="text-muted" />
          <div>
            <Typography type="h4">{t("slotsTitle")}</Typography>
            <p className="mt-0.5 text-xs text-muted">{t("slotsMonth")}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="font-bold text-accent"
          onPress={() => router.push(`/discovery/clubs/${club.id}/slots`)}
        >
          {t("slotsSeeAll")}
        </Button>
      </div>

      <Card className="border-0 bg-transparent shadow-none app-stack-card min-w-0 overflow-hidden rounded-[1.75rem] p-0 shadow-none">
        <Card.Content className="min-w-0 px-5 py-6 sm:px-7">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-muted">
                {t("slotsAvailableInRange")}
              </p>
              <p className="mt-1 text-2xl font-black tabular-nums text-foreground">
                {totalAvailable.toLocaleString("fa-IR")}
              </p>
            </div>
            <p className="text-sm font-bold text-muted">{monthLabel}</p>
          </div>

          {sessions.isError ? (
            <div className="mt-6 rounded-2xl border-0 bg-transparent p-5 text-center text-sm text-muted">
              {t("slotsLoadError")}
            </div>
          ) : !sessions.isPending && totalAvailable === 0 ? (
            <div className="mt-6">
              <ClubEmptyState
                title="این ماه سانس آزادی وجود ندارد"
                description="برای بررسی سانس‌های تاریخ‌های دیگر، همه سانس‌های باشگاه را ببینید."
              />
            </div>
          ) : (
            <div className="mt-6" dir="ltr">
              <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[0.65rem] font-semibold text-muted">
                {weekdayDates.map((date) => (
                  <span key={toDateKey(date)}>
                    {new Intl.DateTimeFormat("fa-IR", {
                      weekday: "narrow",
                    }).format(date)}
                  </span>
                ))}
              </div>
              <HeatmapInteractionProvider>
                <HeatmapInteractionBoundary>
                  <HeatmapChart
                    data={chartData}
                    layout="fluid"
                    gap={5}
                    margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                    status={sessions.isPending ? "loading" : "ready"}
                    revealSignature={`${monthLabel}:${totalAvailable}`}
                  >
                    <HeatmapCells
                      cornerRadius={11}
                      inactiveOpacity={0.4}
                      activeScale={1.06}
                      formatCellLabel={(bin) =>
                        persianCellDayFormatter.format(bin.date)
                      }
                      getCellColor={(bin) =>
                        isClubClosedOnDate(club, bin.date)
                          ? "var(--danger)"
                          : undefined
                      }
                      getCellLabelColor={(bin) =>
                        isClubClosedOnDate(club, bin.date)
                          ? "var(--danger-foreground)"
                          : undefined
                      }
                    />
                    <HeatmapTooltip
                      formatDate={(date) =>
                        persianTooltipDateFormatter.format(date)
                      }
                      formatWeekday={(date) =>
                        persianTooltipWeekdayFormatter.format(date)
                      }
                      formatLabel={(count) =>
                        count > 0
                          ? t("slotsHeatmapCount", { count })
                          : t("slotsNoTimesShort")
                      }
                      backgroundColor="var(--chart-tooltip-background)"
                    />
                  </HeatmapChart>
                  <HeatmapLegend
                    lessLabel={t("slotsHeatmapLess")}
                    moreLabel={t("slotsHeatmapMore")}
                    className="mt-4"
                    labelClassName="text-muted"
                    cornerRadius={4}
                  />
                </HeatmapInteractionBoundary>
              </HeatmapInteractionProvider>
            </div>
          )}

          <Button
            variant="primary"
            className="mt-6 w-full"
            onPress={() => router.push(`/discovery/clubs/${club.id}/slots`)}
          >
            {t("bookNow")}
          </Button>
        </Card.Content>
      </Card>
    </section>
  );
}
