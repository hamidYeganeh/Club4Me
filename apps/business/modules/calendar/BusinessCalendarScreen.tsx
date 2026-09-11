"use client";

import { FormSelect, FormOption } from "@repo/ui/form-select";
import { useSelectedClub } from "@/lib/use-selected-club";

import {
  useBusinessCalendarClassSessions,
  useBusinessSessions,
  useClubReservations,
  useCreateBusinessCalendarFeed,
  type BusinessCalendarClassSession,
  type ReservableSession,
} from "@api/business";
import { getApiConfig } from "@api";
import { Button, Card, toast } from "@heroui/react";
import { Icon } from "@theme/icon";
import { tehranLocalDate } from "@ui/iran-date";
import Link from "next/link";
import { useMemo, useState } from "react";

import { ButtonLink } from "@/components/button-link";

type EventSource = "class" | "reservable";
type SourceFilter = "all" | EventSource;
type CalendarView = "month" | "week" | "day";
type CalendarEvent = {
  id: string;
  source: EventSource;
  title: string;
  startsAt: string;
  endsAt: string;
  status: string;
  href: string;
  capacity: number;
  reservedCount?: number;
};

const timeZone = "Asia/Tehran";
const weekdays = [
  "شنبه",
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
];
const persianPartsFormatter = new Intl.DateTimeFormat(
  "en-US-u-ca-persian-nu-latn",
  { timeZone, year: "numeric", month: "numeric", day: "numeric" },
);
const monthTitleFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  timeZone,
  year: "numeric",
  month: "long",
});
const fullDateFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  timeZone,
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});
const timeFormatter = new Intl.DateTimeFormat("fa-IR", {
  timeZone,
  hour: "2-digit",
  minute: "2-digit",
});
const numberFormatter = new Intl.NumberFormat("fa-IR");
const dayMilliseconds = 24 * 60 * 60 * 1000;

function persianParts(date: Date) {
  const parts = persianPartsFormatter.formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  return { year: value("year"), month: value("month"), day: value("day") };
}

function civilDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function datesInPersianMonth(anchor: Date) {
  const target = persianParts(anchor);
  const result: Date[] = [];
  const seen = new Set<string>();
  for (let offset = -40; offset <= 40; offset += 1) {
    const date = new Date(anchor.getTime() + offset * dayMilliseconds);
    const parts = persianParts(date);
    const key = civilDateKey(date);
    if (
      parts.year === target.year &&
      parts.month === target.month &&
      !seen.has(key)
    ) {
      seen.add(key);
      result.push(date);
    }
  }
  return result.sort((a, b) => a.getTime() - b.getTime());
}

function monthRange(dates: Date[]) {
  const first = dates[0] ?? new Date();
  const last = dates.at(-1) ?? first;
  const nextDay = new Date(last.getTime() + dayMilliseconds);
  return {
    from: tehranLocalDate(`${civilDateKey(first)}T00:00`).toISOString(),
    to: tehranLocalDate(`${civilDateKey(nextDay)}T00:00`).toISOString(),
  };
}

function weekDates(anchor: Date) {
  const startOffset = (anchor.getDay() + 1) % 7;
  const start = new Date(anchor.getTime() - startOffset * dayMilliseconds);
  return Array.from(
    { length: 7 },
    (_, index) => new Date(start.getTime() + index * dayMilliseconds),
  );
}

function sourceLabel(source: EventSource) {
  return source === "class" ? "جلسهٔ کلاس" : "سانس رزروپذیر";
}

function statusLabel(event: CalendarEvent) {
  if (event.status === "cancelled") return "لغوشده";
  if (event.status === "completed") return "تمام‌شده";
  return event.source === "class" ? "برگزارنشده" : "باز برای رزرو";
}

function eventFromClass(
  clubId: string,
  item: BusinessCalendarClassSession,
): CalendarEvent {
  return {
    id: `class-${item.id}`,
    source: "class",
    title: item.classTitle,
    startsAt: item.startsAt,
    endsAt: item.endsAt,
    status: item.status,
    href: `/clubs/${clubId}/classes/${item.classId}`,
    capacity: item.capacity,
  };
}

function eventFromSession(
  clubId: string,
  item: ReservableSession,
): CalendarEvent {
  return {
    id: `reservable-${item.id}`,
    source: "reservable",
    title: item.title,
    startsAt: item.startsAt,
    endsAt: item.endsAt,
    status: item.status,
    href: `/clubs/${clubId}/reservations`,
    capacity: item.capacity,
    reservedCount: item.reservedCount,
  };
}

function CalendarSkeleton() {
  return (
    <div
      className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]"
      aria-label="در حال بارگذاری تقویم"
    >
      <div className="h-[42rem] animate-pulse rounded-[1.75rem] bg-surface-secondary motion-reduce:animate-none" />
      <div className="h-[30rem] animate-pulse rounded-[1.75rem] bg-surface-secondary motion-reduce:animate-none" />
    </div>
  );
}

function EventCard({
  event,
  conflict = false,
}: {
  event: CalendarEvent;
  conflict?: boolean;
}) {
  return (
    <Link
      href={event.href}
      className="group block rounded-2xl border border-border/60 bg-surface-secondary/70 p-4 transition-[border-color,transform] hover:border-accent/45 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-1 h-12 w-1 shrink-0 rounded-full ${event.source === "class" ? "bg-accent" : "bg-warning"}`}
          aria-hidden
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-3">
            <strong className="truncate text-sm">{event.title}</strong>
            <Icon
              name="chevron-left"
              size={15}
              className="mt-0.5 shrink-0 text-muted transition-transform group-hover:-translate-x-0.5"
            />
          </span>
          <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span className="inline-flex items-center gap-1">
              <Icon name="clock" size={14} />
              {timeFormatter.format(new Date(event.startsAt))} تا{" "}
              {timeFormatter.format(new Date(event.endsAt))}
            </span>
            <span>{statusLabel(event)}</span>
          </span>
          <span className="mt-2 flex items-center justify-between gap-2 text-xs">
            <span className="text-muted">{sourceLabel(event.source)}</span>
            <span className="font-medium">
              {event.reservedCount === undefined
                ? `ظرفیت ${numberFormatter.format(event.capacity)}`
                : `${numberFormatter.format(event.reservedCount)} از ${numberFormatter.format(event.capacity)} رزرو`}
            </span>
          </span>
          {conflict ? (
            <span className="mt-2 inline-flex rounded-full bg-danger/10 px-2 py-1 text-[11px] font-medium text-danger">
              تداخل زمانی؛ قبل از انتشار بررسی شود
            </span>
          ) : null}
        </span>
      </div>
    </Link>
  );
}

export function BusinessCalendarScreen() {
  const { clubs, clubId, setClubId: setSelectedClubId } = useSelectedClub();
  const [cursor, setCursor] = useState(() => new Date());
  const monthDates = useMemo(() => datesInPersianMonth(cursor), [cursor]);
  const range = useMemo(() => monthRange(monthDates), [monthDates]);
  const [selectedDate, setSelectedDate] = useState(() =>
    civilDateKey(new Date()),
  );
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [view, setView] = useState<CalendarView>("month");
  const classSessions = useBusinessCalendarClassSessions(
    clubId,
    range.from,
    range.to,
  );
  const sessions = useBusinessSessions(clubId);
  const reservations = useClubReservations(clubId);
  const calendarFeed = useCreateBusinessCalendarFeed(clubId);

  const events = useMemo(() => {
    const reservable = (sessions.data?.items ?? []).map((item) =>
      eventFromSession(clubId, item),
    );
    const reservableClassKeys = new Set(
      (sessions.data?.items ?? [])
        .filter((item) => item.classId)
        .map((item) => `${item.classId}:${item.startsAt}`),
    );
    const generated = (classSessions.data?.items ?? [])
      .filter(
        (item) => !reservableClassKeys.has(`${item.classId}:${item.startsAt}`),
      )
      .map((item) => eventFromClass(clubId, item));
    return [...generated, ...reservable]
      .filter(
        (event) => sourceFilter === "all" || event.source === sourceFilter,
      )
      .sort(
        (first, second) =>
          new Date(first.startsAt).getTime() -
          new Date(second.startsAt).getTime(),
      );
  }, [classSessions.data?.items, clubId, sessions.data?.items, sourceFilter]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((event) => {
      const key = civilDateKey(new Date(event.startsAt));
      map.set(key, [...(map.get(key) ?? []), event]);
    });
    return map;
  }, [events]);
  const conflictIds = useMemo(() => {
    const ids = new Set<string>();
    const active = events.filter(
      (event) => !["cancelled", "completed"].includes(event.status),
    );
    active.forEach((event, index) => {
      for (const other of active.slice(index + 1)) {
        if (
          new Date(event.startsAt) < new Date(other.endsAt) &&
          new Date(other.startsAt) < new Date(event.endsAt)
        ) {
          ids.add(event.id);
          ids.add(other.id);
        }
      }
    });
    return ids;
  }, [events]);
  const selectedEvents = eventsByDay.get(selectedDate) ?? [];
  const selectedDateValue =
    monthDates.find((date) => civilDateKey(date) === selectedDate) ??
    monthDates[0] ??
    new Date();
  const todayKey = civilDateKey(new Date());
  const firstOffset = monthDates[0]
    ? (new Date(`${civilDateKey(monthDates[0])}T00:00:00Z`).getUTCDay() + 1) % 7
    : 0;
  const isPending =
    clubs.isPending ||
    (Boolean(clubId) && (classSessions.isPending || sessions.isPending));
  const hasDataError =
    classSessions.isError || sessions.isError || reservations.isError;

  const changeMonth = (direction: -1 | 1) => {
    const edge = direction === -1 ? monthDates[0] : monthDates.at(-1);
    const next = new Date(
      (edge ?? cursor).getTime() + direction * dayMilliseconds,
    );
    setCursor(next);
    setSelectedDate(civilDateKey(next));
  };
  const goToday = () => {
    const today = new Date();
    setCursor(today);
    setSelectedDate(civilDateKey(today));
  };
  const copyCalendarFeed = async () => {
    try {
      const feed = await calendarFeed.mutateAsync();
      const url = new URL(feed.feedPath, getApiConfig().baseURL).toString();
      await navigator.clipboard.writeText(url);
      toast.success("لینک تازهٔ تقویم کلاس‌ها کپی شد");
    } catch {
      toast.danger("ساخت لینک تقویم انجام نشد");
    }
  };

  if (clubs.isError) {
    return (
      <main className="flex-1 p-4 lg:p-6">
        <Card className="mx-auto max-w-xl rounded-[1.75rem] p-8 text-center shadow-none">
          <Icon
            name="calendar-slash-1"
            size={32}
            className="mx-auto text-danger"
          />
          <h1 className="mt-4 text-xl font-semibold">تقویم قابل دریافت نیست</h1>
          <p className="mt-2 text-sm text-muted">
            اتصال را بررسی کنید و دوباره تلاش کنید.
          </p>
          <Button
            className="mt-5"
            variant="secondary"
            onPress={() => clubs.refetch()}
          >
            تلاش دوباره
          </Button>
        </Card>
      </main>
    );
  }

  if (!clubs.isPending && !clubs.data?.items.length) {
    return (
      <main className="flex-1 p-4 lg:p-6">
        <Card className="mx-auto max-w-xl rounded-[1.75rem] p-8 text-center shadow-none">
          <Icon
            name="calendar-plus"
            size={32}
            className="mx-auto text-accent"
          />
          <h1 className="mt-4 text-xl font-semibold">
            تقویم با ساخت باشگاه فعال می‌شود
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            بعد از ساخت باشگاه، کلاس‌ها و سانس‌ها در این صفحه کنار هم دیده
            می‌شوند.
          </p>
          <ButtonLink className="mt-5" variant="primary" href="/clubs/new">
            ساخت باشگاه
          </ButtonLink>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-w-0 flex-1 overflow-auto p-4 lg:p-6">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-accent">برنامهٔ عملیاتی</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight lg:text-3xl">
              تقویم باشگاه
            </h1>
            <p className="mt-1 text-sm text-muted">
              کلاس‌ها، سانس‌های رزروپذیر و ظرفیت هر روز در یک نما
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              isPending={calendarFeed.isPending}
              onPress={copyCalendarFeed}
            >
              <Icon name="link-1" /> کپی تقویم کلاس‌ها
            </Button>
            <ButtonLink
              variant="primary"
              href={clubId ? `/clubs/${clubId}/reservations` : "/clubs"}
            >
              <Icon name="calendar-plus" /> ساخت سانس
            </ButtonLink>
          </div>
        </header>

        <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
          <label className="grid min-w-52 gap-1.5 text-xs text-muted">
            باشگاه فعال
            <FormSelect
              aria-label="باشگاه فعال"
              value={clubId}
              onChange={(event) => setSelectedClubId(event)}
              className="h-11 rounded-2xl border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-focus focus:ring-3 focus:ring-focus/15"
            >
              {clubs.data?.items.map((club) => (
                <FormOption entity={club} key={club.id} value={club.id}>
                  {club.name}
                </FormOption>
              ))}
            </FormSelect>
          </label>
          <div className="flex flex-wrap gap-2" aria-label="فیلتر نوع برنامه">
            {(
              [
                ["all", "همه"],
                ["class", "کلاس‌ها"],
                ["reservable", "سانس‌های رزرو"],
              ] as const
            ).map(([value, label]) => (
              <Button
                key={value}
                size="sm"
                variant={sourceFilter === value ? "primary" : "secondary"}
                aria-pressed={sourceFilter === value}
                onPress={() => setSourceFilter(value)}
              >
                {label}
              </Button>
            ))}
            {(["month", "week", "day"] as const).map((value) => (
              <Button
                key={value}
                size="sm"
                variant={view === value ? "primary" : "secondary"}
                aria-pressed={view === value}
                onPress={() => setView(value)}
              >
                {value === "month" ? "ماه" : value === "week" ? "هفته" : "روز"}
              </Button>
            ))}
          </div>
        </div>

        {conflictIds.size ? (
          <div
            className="mt-4 rounded-2xl border border-danger/30 bg-danger/8 px-4 py-3 text-sm text-danger"
            role="alert"
          >
            {numberFormatter.format(conflictIds.size)} برنامه هم‌زمان شناسایی
            شد. کارت‌های دارای تداخل را پیش از انتشار یا جابه‌جایی بررسی کنید.
          </div>
        ) : null}

        {hasDataError ? (
          <div
            className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-warning/35 bg-warning/10 px-4 py-3 text-sm"
            role="status"
          >
            <span>
              بخشی از برنامه دریافت نشد. اطلاعات موجود همچنان نمایش داده می‌شود.
            </span>
            <Button
              size="sm"
              variant="ghost"
              onPress={() => {
                void classSessions.refetch();
                void sessions.refetch();
                void reservations.refetch();
              }}
            >
              دریافت دوباره
            </Button>
          </div>
        ) : null}

        <div className="mt-4">
          {isPending ? (
            <CalendarSkeleton />
          ) : (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
              <Card className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-surface p-0 shadow-none">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 p-4 sm:p-5">
                  <div>
                    <h2 className="text-xl font-semibold">
                      {monthTitleFormatter.format(cursor)}
                    </h2>
                    <p className="mt-1 text-xs text-muted">
                      {numberFormatter.format(events.length)} برنامه در این نما
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onPress={goToday}>
                      امروز
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="ghost"
                      aria-label="ماه قبل"
                      onPress={() => changeMonth(-1)}
                    >
                      <Icon name="chevron-right" />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="ghost"
                      aria-label="ماه بعد"
                      onPress={() => changeMonth(1)}
                    >
                      <Icon name="chevron-left" />
                    </Button>
                  </div>
                </div>

                {view !== "day" ? (
                  <div className="grid grid-cols-7 border-b border-border/60 bg-surface-secondary/45 px-2 py-3 sm:px-4">
                    {weekdays.map((day) => (
                      <span
                        key={day}
                        className="text-center text-[10px] font-medium text-muted sm:text-xs"
                      >
                        {day}
                      </span>
                    ))}
                  </div>
                ) : null}
                {view === "day" ? (
                  <div className="space-y-3 p-4 sm:p-5">
                    {(eventsByDay.get(selectedDate) ?? []).map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        conflict={conflictIds.has(event.id)}
                      />
                    ))}
                    {!(eventsByDay.get(selectedDate) ?? []).length ? (
                      <p className="py-12 text-center text-sm text-muted">
                        برای این روز برنامه‌ای نیست.
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <div
                    className="grid grid-cols-7 bg-border/60 gap-px"
                    role="grid"
                    aria-label={monthTitleFormatter.format(cursor)}
                  >
                    {Array.from(
                      { length: view === "month" ? firstOffset : 0 },
                      (_, index) => (
                        <span
                          key={`empty-${index}`}
                          className="min-h-20 bg-surface-secondary/30 sm:min-h-28"
                          aria-hidden
                        />
                      ),
                    )}
                    {(view === "month"
                      ? monthDates
                      : weekDates(selectedDateValue)
                    ).map((date) => {
                      const key = civilDateKey(date);
                      const dayEvents = eventsByDay.get(key) ?? [];
                      const selected = selectedDate === key;
                      const today = todayKey === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          role="gridcell"
                          aria-selected={selected}
                          aria-label={`${fullDateFormatter.format(date)}، ${numberFormatter.format(dayEvents.length)} برنامه`}
                          onClick={() => setSelectedDate(key)}
                          className={`group relative min-h-20 min-w-0 bg-surface p-1.5 text-start transition-colors hover:bg-accent/5 focus-visible:z-[1] focus-visible:outline-2 focus-visible:outline-focus sm:min-h-28 sm:p-2.5 ${selected ? "bg-accent/7 shadow-[inset_0_0_0_2px_var(--accent)]" : ""}`}
                        >
                          <span
                            className={`inline-grid size-7 place-items-center rounded-full text-xs font-semibold sm:size-8 sm:text-sm ${today ? "bg-foreground text-background" : selected ? "text-accent" : ""}`}
                          >
                            {numberFormatter.format(persianParts(date).day)}
                          </span>
                          <span
                            className="mt-1 flex gap-1 sm:hidden"
                            aria-hidden
                          >
                            {dayEvents.slice(0, 3).map((event) => (
                              <span
                                key={event.id}
                                className={`size-1.5 rounded-full ${event.source === "class" ? "bg-accent" : "bg-warning"}`}
                              />
                            ))}
                          </span>
                          <span
                            className="mt-1 hidden space-y-1 sm:block"
                            aria-hidden
                          >
                            {dayEvents.slice(0, 2).map((event) => (
                              <span
                                key={event.id}
                                className={`block truncate rounded-lg px-1.5 py-1 text-[10px] font-medium ${conflictIds.has(event.id) ? "bg-danger/12 text-danger" : event.source === "class" ? "bg-accent/10 text-accent" : "bg-warning/12 text-foreground"}`}
                              >
                                {timeFormatter.format(new Date(event.startsAt))}{" "}
                                {event.title}
                              </span>
                            ))}
                            {dayEvents.length > 2 ? (
                              <span className="block px-1 text-[10px] text-muted">
                                {numberFormatter.format(dayEvents.length - 2)}{" "}
                                مورد دیگر
                              </span>
                            ) : null}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
                <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-border/60 px-4 py-3 text-xs text-muted sm:px-5">
                  <span className="inline-flex items-center gap-2">
                    <span className="size-2 rounded-full bg-accent" />
                    جلسهٔ کلاس
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="size-2 rounded-full bg-warning" />
                    سانس رزروپذیر
                  </span>
                  <span className="ms-auto">
                    {numberFormatter.format(
                      reservations.data?.items.filter(
                        (item) => item.status === "reserved",
                      ).length ?? 0,
                    )}{" "}
                    رزرو فعال
                  </span>
                </div>
              </Card>

              <Card className="rounded-[1.75rem] border border-border/60 bg-surface p-4 shadow-none lg:sticky lg:top-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-accent">
                      برنامهٔ روز
                    </p>
                    <h2 className="mt-1 text-lg font-semibold">
                      {fullDateFormatter.format(selectedDateValue)}
                    </h2>
                  </div>
                  <span className="rounded-full bg-surface-secondary px-2.5 py-1 text-xs text-muted">
                    {numberFormatter.format(selectedEvents.length)} مورد
                  </span>
                </div>
                <div className="mt-4 space-y-3" aria-live="polite">
                  {selectedEvents.length ? (
                    selectedEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        conflict={conflictIds.has(event.id)}
                      />
                    ))
                  ) : (
                    <div className="rounded-2xl bg-surface-secondary/60 px-5 py-8 text-center">
                      <Icon
                        name="calendar-2"
                        size={28}
                        className="mx-auto text-muted"
                      />
                      <p className="mt-3 font-medium">
                        برای این روز برنامه‌ای نیست
                      </p>
                      <p className="mt-1 text-xs leading-5 text-muted">
                        از دکمهٔ ساخت سانس استفاده کنید یا برنامهٔ یک کلاس را
                        تنظیم کنید.
                      </p>
                    </div>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <ButtonLink variant="secondary" href="/classes/new">
                    کلاس جدید
                  </ButtonLink>
                  <ButtonLink variant="ghost" href="/classes">
                    مدیریت کلاس‌ها
                  </ButtonLink>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
