"use client";

import { useEffect, useRef } from "react";
import { Button, ScrollShadow } from "@heroui/react";
import { Icon } from "@theme/icon";
import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader/SecondaryHeader";

import { reservationsHeaderSectionStyles } from "./ReservationsHeaderSection.styles";
import type { ReservationsHeaderSectionProps } from "./ReservationsHeaderSection.types";

export function ReservationsHeaderSection({
  monthExpanded,
  onToggleMonth,
  title,
  backLabel,
  backHref,
  datesLabel,
  historyLabel,
  historyActive,
  onShowHistory,
  dates,
  selectedDateKey,
  onSelectDate,
}: ReservationsHeaderSectionProps) {
  const selectedRef = useRef<HTMLDivElement>(null);
  const styles = reservationsHeaderSectionStyles({ historyActive });

  useEffect(() => {
    if (monthExpanded) return;
    selectedRef.current?.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: "auto",
    });
  }, [selectedDateKey, monthExpanded]);

  return (
    <>
      <SecondaryHeader
        title={title}
        backLabel={backLabel}
        backHref={backHref}
        showFilter={false}
        action={
          <button
            type="button"
            className={styles.calendar()}
            aria-label={historyLabel}
            aria-pressed={historyActive}
            onClick={onShowHistory}
          >
            <Icon name="calendar-1" size={22} />
          </button>
        }
      />
      <div className={styles.root()}>
        {monthExpanded ? (
          <p className="mb-3 text-center text-sm font-bold">
            {new Intl.DateTimeFormat("fa-IR", {
              month: "long",
              year: "numeric",
            }).format(new Date(`${selectedDateKey}T12:00:00`))}
          </p>
        ) : null}
        <ScrollShadow
          hideScrollBar
          orientation="horizontal"
          size={32}
          className="-mx-4 mt-1 px-4"
          aria-label={datesLabel}
        >
          <div
            className={
              monthExpanded ? "grid grid-cols-7 gap-1 pb-1" : styles.dates()
            }
          >
            {monthExpanded
              ? Array.from(
                  {
                    length:
                      (new Date(`${dates[0]!.key}T12:00:00`).getDay() + 1) % 7,
                  },
                  (_, index) => <span key={`spacer-${index}`} aria-hidden />,
                )
              : null}
            {dates.map((date) => {
              const selected = !historyActive && date.key === selectedDateKey;
              const dateStyles = reservationsHeaderSectionStyles({ selected });

              return (
                <div
                  key={date.key}
                  ref={selected ? selectedRef : undefined}
                  className="snap-start"
                >
                  <Button
                    variant="ghost"
                    aria-pressed={selected}
                    className={dateStyles.dateButton({
                      className: monthExpanded
                        ? "w-full min-w-0 px-0 [&>span:last-child]:text-xs"
                        : undefined,
                    })}
                    onPress={() => onSelectDate(date.key)}
                  >
                    <span className={dateStyles.day()}>{date.day}</span>
                    <span className={dateStyles.weekday()}>{date.weekday}</span>
                  </Button>
                </div>
              );
            })}
          </div>
        </ScrollShadow>
        <button
          type="button"
          className="mx-auto mt-3 flex flex-col items-center gap-2 text-xs text-muted"
          aria-expanded={monthExpanded}
          onClick={onToggleMonth}
        >
          <span className="h-1 w-10 rounded-full bg-muted/40" />
          {monthExpanded ? "نمایش دو هفته" : "نمایش کل ماه"}
        </button>
      </div>
    </>
  );
}
