"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button, ScrollShadow, Typography } from "@heroui/react";
import { Icon } from "@theme/icon";

import { reservationsHeaderSectionStyles } from "./ReservationsHeaderSection.styles";
import type { ReservationsHeaderSectionProps } from "./ReservationsHeaderSection.types";

export function ReservationsHeaderSection({
  title,
  backLabel,
  backHref,
  datesLabel,
  dates,
  selectedDateKey,
  onSelectDate,
}: ReservationsHeaderSectionProps) {
  const router = useRouter();
  const selectedRef = useRef<HTMLDivElement>(null);
  const styles = reservationsHeaderSectionStyles();

  useEffect(() => {
    selectedRef.current?.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: "auto",
    });
  }, [selectedDateKey]);

  return (
    <>
      <header className={styles.root()}>
        <div className={styles.bar()}>
          <Button
            isIconOnly
            variant="ghost"
            size="lg"
            aria-label={backLabel}
            className={styles.back()}
            onPress={() => router.push(backHref)}
          >
            <Icon name="chevron-right" size={22} />
          </Button>
          <Typography type="h4" className={styles.title()}>
            {title}
          </Typography>
        </div>

        <ScrollShadow
          hideScrollBar
          orientation="horizontal"
          size={32}
          className="-mx-4 mt-1 px-4"
          aria-label={datesLabel}
        >
          <div className={styles.dates()}>
            {dates.map((date) => {
              const selected = date.key === selectedDateKey;
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
                    <span className={dateStyles.weekday()}>{date.weekday}</span>
                    <span className={dateStyles.day()}>{date.day}</span>
                    <span aria-hidden className={dateStyles.dot()} />
                  </Button>
                </div>
              );
            })}
          </div>
        </ScrollShadow>
      </header>
      <div aria-hidden className={styles.spacer()} />
    </>
  );
}
