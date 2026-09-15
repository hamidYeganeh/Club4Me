"use client";
import { useState } from "react";
import { Button } from "@heroui/react";
import { CalendarDays, ArrowUpLeft } from "lucide-react";
import { usePublicClub, useReservableSessions } from "@api";
import { sessionDate, sessionTime, tehranDay } from "@modules/today/agenda";
import { useNow } from "@/lib/use-now";
export function ClubBookingWidget({ clubId }: { clubId: string }) {
  const club = usePublicClub(clubId);
  const sessions = useReservableSessions(club.data?.id ?? "");
  const [day, setDay] = useState(0);
  const now = useNow();
  const date = now === null ? "" : tehranDay(now + day * 86400000);
  const visible = (sessions.data?.items ?? []).filter(
    (item) =>
      tehranDay(item.startsAt) === date &&
      item.status === "active" &&
      new Date(item.startsAt).getTime() > (now ?? Infinity),
  );
  return (
    <main className="space-y-5 p-5" dir="rtl">
      <header className="flex items-center gap-3">
        <span className="rounded-2xl bg-accent/10 p-3 text-accent">
          <CalendarDays size={24} />
        </span>
        <div>
          <h1 className="text-xl font-bold">
            {club.data?.name ?? "رزرو باشگاه"}
          </h1>
          <p className="mt-1 text-xs text-muted">زمان مناسب را انتخاب کن</p>
        </div>
      </header>
      {club.isError || sessions.isError ? (
        <div role="alert" className="space-y-3">
          <p>برنامه باشگاه دریافت نشد.</p>
          <Button
            variant="secondary"
            onPress={() => {
              void club.refetch();
              void sessions.refetch();
            }}
          >
            تلاش دوباره
          </Button>
        </div>
      ) : (
        <>
          <div
            className="flex gap-2 overflow-x-auto pb-2"
            role="group"
            aria-label="روز رزرو"
          >
            {Array.from({ length: 7 }, (_, offset) => (
              <Button
                key={offset}
                size="sm"
                variant={day === offset ? "primary" : "secondary"}
                aria-pressed={day === offset}
                isDisabled={now === null}
                onPress={() => setDay(offset)}
              >
                {now === null ? "…" : sessionDate(now + offset * 86400000)}
              </Button>
            ))}
          </div>
          {sessions.isPending ? (
            <p role="status">در حال دریافت سانس‌ها…</p>
          ) : visible.length ? (
            <div className="space-y-3">
              {visible.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface-secondary p-4"
                >
                  <div>
                    <h2 className="font-semibold">{item.title}</h2>
                    <p className="mt-2 text-xs text-muted">
                      {sessionTime(item.startsAt)} تا {sessionTime(item.endsAt)}{" "}
                      ·{" "}
                      {Math.max(
                        0,
                        item.capacity - item.reservedCount,
                      ).toLocaleString("fa-IR")}{" "}
                      جای خالی
                    </p>
                    <p className="mt-2 text-sm">
                      {item.basePrice.toLocaleString("fa-IR")} ریال ·{" "}
                      {item.pricingUnit === "per_participant"
                        ? "هر نفر"
                        : "کل سانس"}
                    </p>
                  </div>
                  {item.reservedCount < item.capacity ? (
                    <a
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground"
                      target="_blank"
                      rel="noopener"
                      href={`/discovery/clubs/${encodeURIComponent(club.data?.slug ?? clubId)}/slots?session=${item.id}&date=${tehranDay(item.startsAt)}&source=club-widget`}
                    >
                      انتخاب <ArrowUpLeft size={16} />
                    </a>
                  ) : (
                    <span className="text-xs text-muted">تکمیل ظرفیت</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl bg-surface-secondary p-4 text-sm text-muted">
              برای این روز سانس قابل نمایش نیست؛ روز دیگری را انتخاب کن.
            </p>
          )}
        </>
      )}
      <footer className="border-t border-border pt-4 text-xs text-muted">
        رزرو با Club4Me · ظرفیت هنگام نهایی‌کردن دوباره بررسی می‌شود.
      </footer>
    </main>
  );
}
