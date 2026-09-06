"use client";

import { Avatar, Card } from "@heroui/react";
import { Icon } from "@theme/icon";
import { cn } from "@theme/cn";

import { ButtonLink } from "@/components/button-link";

import { dashboardAsideSectionStyles } from "./DashboardAsideSection.styles";
import type { DashboardAsideSectionProps } from "./DashboardAsideSection.types";

const weekday = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
const monthDays = Array.from({ length: 31 }, (_, index) => index + 1);
const highlighted = new Set([4, 9, 12, 18, 23, 27]);

export function DashboardAsideSection({
  greeting,
  name,
  location,
  readiness,
  goProTitle,
  goProOne,
  goProTwo,
  goProThree,
  calendarTitle,
  completed,
  skipped,
  challenge,
  heartLabel,
  heartValue,
  pressureLabel,
  pressureValue,
  oxygenLabel,
  oxygenValue,
  upcomingTitle,
  addLabel,
  exercises,
  goProHref = "/memberships",
  addHref = "/classes/new",
}: DashboardAsideSectionProps) {
  const styles = dashboardAsideSectionStyles();

  return (
    <aside className={styles.root()}>
      <div className={styles.profile()}>
        <Avatar className="mb-2 size-14">
          <Avatar.Image
            alt={name}
            src="https://picsum.photos/seed/gym4me-business/200/200"
          />
          <Avatar.Fallback>{name.slice(0, 1)}</Avatar.Fallback>
        </Avatar>
        <p className={styles.hello()}>{greeting}</p>
        <h2 className={styles.name()}>{name}</h2>
        <div className={styles.meta()}>
          <span className="inline-flex items-center gap-1">
            <Icon name="map-pin-1" size={14} />
            {location}
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon name="sparkle-1" size={14} />
            {readiness}
          </span>
        </div>
      </div>

      <Card className={styles.promo()}>
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
        <ButtonLink
          href={goProHref}
          isIconOnly
          aria-label={goProTitle}
          className="mt-4 size-11 rounded-full bg-foreground text-background"
          variant="secondary"
        >
          <Icon name="arrow-left" />
        </ButtonLink>
      </Card>

      <div>
        <p className="mb-2 px-1 text-sm font-medium lg:text-accent-foreground">
          {upcomingTitle}
        </p>
        <div className={styles.exercises()}>
          {exercises.map((item) => (
            <ButtonLink
              key={item.title}
              href="/classes"
              className={styles.exerciseItem()}
              variant="ghost"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-accent/10 text-accent">
                <Icon name={item.icon} size={18} />
              </span>
              <span className="min-w-0 flex-1 text-start">
                <span className="block truncate text-sm font-medium">
                  {item.title}
                </span>
                <span className="block text-xs text-muted">{item.meta}</span>
              </span>
              <Icon name="chevron-left" className="text-muted" size={16} />
            </ButtonLink>
          ))}
        </div>
      </div>

      <Card id="calendar" className={styles.calendar()}>
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
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-accent" />
            {completed}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-[var(--chart-2)]" />
            {skipped}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-foreground/40" />
            {challenge}
          </span>
        </div>
      </Card>

      <div className={styles.vitals()}>
        <div className={styles.vital()}>
          <Icon name="heart-ecg" className="text-danger" size={18} />
          <span className={styles.vitalValue()}>{heartValue}</span>
          <span className={styles.vitalLabel()}>{heartLabel}</span>
        </div>
        <div className={styles.vital()}>
          <Icon name="chart-axis-line-wave" className="text-accent" size={18} />
          <span className={styles.vitalValue()}>{pressureValue}</span>
          <span className={styles.vitalLabel()}>{pressureLabel}</span>
        </div>
        <div className={styles.vital()}>
          <Icon name="water-drop" className="text-[var(--chart-2)]" size={18} />
          <span className={styles.vitalValue()}>{oxygenValue}</span>
          <span className={styles.vitalLabel()}>{oxygenLabel}</span>
        </div>
      </div>

      <ButtonLink href={addHref} className={styles.addBtn()} variant="ghost">
        <Icon name="plus-fat" size={16} />
        {addLabel}
      </ButtonLink>
    </aside>
  );
}
