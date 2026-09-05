"use client";

import { useEffect, useRef } from "react";
import { Button, ScrollShadow } from "@heroui/react";
import { Icon } from "@theme/icon";
import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader/SecondaryHeader";

import { reservationsHeaderSectionStyles } from "./ReservationsHeaderSection.styles";
import type { ReservationsHeaderSectionProps } from "./ReservationsHeaderSection.types";

export function ReservationsHeaderSection({
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
    selectedRef.current?.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: "auto",
    });
  }, [selectedDateKey]);

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
        <ScrollShadow
          hideScrollBar
          orientation="horizontal"
          size={32}
          className="-mx-4 mt-1 px-4"
          aria-label={datesLabel}
        >
          <div className={styles.dates()}>
            {dates.map((date) => {
              const selected =
                !historyActive && date.key === selectedDateKey;
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
                    className={dateStyles.dateButton()}
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
      </div>
    </>
  );
}
