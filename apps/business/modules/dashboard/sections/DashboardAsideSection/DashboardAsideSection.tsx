"use client";

import { Avatar, Card } from "@heroui/react";
import { Icon } from "@theme/icon";
import { cn } from "@theme/cn";

import { dashboardAsideSectionStyles } from "./DashboardAsideSection.styles";
import type { DashboardAsideSectionProps } from "./DashboardAsideSection.types";

const weekday = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
const monthDays = Array.from({ length: 31 }, (_, index) => index + 1);
const highlighted = new Set([4, 9, 12, 18, 23, 27]);

export function DashboardAsideSection({
  greeting,
  name,
  goProTitle,
  goProOne,
  goProTwo,
  goProThree,
  calendarTitle,
  completed,
  skipped,
  challenge,
}: DashboardAsideSectionProps) {
  const styles = dashboardAsideSectionStyles();

  return (
    <aside className={styles.root()}>
      <Card variant="transparent" className={styles.profile()}>
        <Avatar className="size-14">
          <Avatar.Image
            alt={name}
            src="https://picsum.photos/seed/gym4me-business/200/200"
          />
          <Avatar.Fallback>{name.slice(0, 1)}</Avatar.Fallback>
        </Avatar>
        <p className={styles.hello()}>{greeting}</p>
        <h2 className={styles.name()}>{name}</h2>
      </Card>

      <Card variant="transparent" className={styles.promo()}>
        <p className="font-semibold">{goProTitle}</p>
        <ul className={styles.promoList()}>
          <li className="flex items-center gap-2">
            <Icon name="check-circle" className="text-success" />
            {goProOne}
          </li>
          <li className="flex items-center gap-2">
            <Icon name="check-circle" className="text-success" />
            {goProTwo}
          </li>
          <li className="flex items-center gap-2">
            <Icon name="check-circle" className="text-success" />
            {goProThree}
          </li>
        </ul>
      </Card>

      <Card variant="transparent" id="calendar" className={styles.calendar()}>
        <p className="font-medium">{calendarTitle}</p>
        <div className={styles.week()}>
          {weekday.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className={styles.days()}>
          {monthDays.map((day) => (
            <span
              key={day}
              className={cn(
                styles.day(),
                highlighted.has(day) && styles.dayOn(),
              )}
            >
              {day}
            </span>
          ))}
        </div>
        <div className={styles.legend()}>
          <span>{completed}</span>
          <span>{skipped}</span>
          <span>{challenge}</span>
        </div>
      </Card>
    </aside>
  );
}
