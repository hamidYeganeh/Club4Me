"use client";

import { useMyReservations, type SessionReservation } from "@api";
import {
  clearAndroidReminderWidget,
  updateAndroidReminderWidget,
} from "@/lib/reminder-widget";
import { ReminderCard } from "@ui/reminder-card";
import { useEffect } from "react";

import { athleteReminderSectionStyles } from "./AthleteReminderSection.styles";

const persianDateFormatter = new Intl.DateTimeFormat(
  "fa-IR-u-ca-persian-nu-persian",
  {
    year: "numeric",
    month: "long",
    day: "numeric",
  },
);

const persianWeekdayFormatter = new Intl.DateTimeFormat(
  "fa-IR-u-ca-persian-nu-persian",
  { weekday: "long" },
);

const persianTimeFormatter = new Intl.DateTimeFormat("fa-IR-u-nu-persian", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const reservationTypeLabels: Record<SessionReservation["sessionType"], string> =
  {
    court: "رزرو زمین",
    class: "رزرو کلاس",
    coached_session: "جلسه با مربی",
  };

export function AthleteReminderSection() {
  const styles = athleteReminderSectionStyles();
  const reservations = useMyReservations();
  const receivedAt = reservations.dataUpdatedAt;
  const nextReservation = reservations.data?.items
    .filter((item) => {
      const startsAt = new Date(item.sessionStartsAt).getTime();
      const endsAt = new Date(item.sessionEndsAt).getTime();
      return (
        item.status === "reserved" &&
        !["failed", "refunded"].includes(item.paymentStatus) &&
        Number.isFinite(startsAt) &&
        Number.isFinite(endsAt) &&
        startsAt > receivedAt
      );
    })
    .sort(
      (left, right) =>
        new Date(left.sessionStartsAt).getTime() -
        new Date(right.sessionStartsAt).getTime(),
    )[0];

  useEffect(() => {
    if (reservations.isPending || reservations.isError) return;

    if (!nextReservation) {
      void clearAndroidReminderWidget()?.catch(() => undefined);
      return;
    }

    const startsAt = new Date(nextReservation.sessionStartsAt);
    const endsAt = new Date(nextReservation.sessionEndsAt);
    const participantLabel = `${nextReservation.participantCount.toLocaleString("fa-IR")} نفر`;

    void updateAndroidReminderWidget({
      date: persianDateFormatter.format(startsAt),
      time: `${persianWeekdayFormatter.format(startsAt)}، ساعت ${persianTimeFormatter.format(startsAt)} تا ${persianTimeFormatter.format(endsAt)}`,
      meta: `${nextReservation.sessionTitle} · ${reservationTypeLabels[nextReservation.sessionType]} · ${participantLabel}`,
      startsAtEpochMs: startsAt.getTime(),
    })?.catch(() => undefined);
  }, [nextReservation, reservations.isError, reservations.isPending]);

  if (!nextReservation) return null;

  const startsAt = new Date(nextReservation.sessionStartsAt);
  const endsAt = new Date(nextReservation.sessionEndsAt);
  const participantLabel = `${nextReservation.participantCount.toLocaleString("fa-IR")} نفر`;

  return (
    <section className={styles.root()} aria-label="یادآوری رزرو بعدی">
      <ReminderCard
        className="app-reveal"
        href="/athlete/reservations"
        date={persianDateFormatter.format(startsAt)}
        time={`${persianWeekdayFormatter.format(startsAt)}، ساعت ${persianTimeFormatter.format(startsAt)} تا ${persianTimeFormatter.format(endsAt)}`}
        meta={`${nextReservation.sessionTitle} · ${reservationTypeLabels[nextReservation.sessionType]} · ${participantLabel}`}
      />
    </section>
  );
}
