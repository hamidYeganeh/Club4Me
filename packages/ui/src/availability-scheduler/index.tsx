"use client";
// beui.dev/components/blocks/availability-scheduler

import { LayoutGroup, useReducedMotion } from "motion/react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { cn } from "./lib/utils";
import { DayRow } from "./day-row";
import {
  buildOptions,
  type DayAvailability,
  type DayKey,
  defaultWeek,
  WEEKDAYS,
  type WeekAvailability,
} from "./types";

export type {
  DayAvailability,
  DayKey,
  TimeRange,
  WeekAvailability,
} from "./types";
export { defaultWeek, WEEKDAYS, DAY_KEY_TO_DOW, DOW_TO_DAY_KEY } from "./types";
export {
  weeklyHoursToWeekAvailability,
  weekAvailabilityToWeeklyHours,
  type ClubWeeklyHour,
} from "./weekly-hours";

export interface AvailabilitySchedulerProps {
  value?: WeekAvailability;
  defaultValue?: WeekAvailability;
  onChange?: (value: WeekAvailability) => void;
  /** Minutes between selectable times. Default 30. */
  step?: number;
  /** Max ranges per day. Default 2 (men / women). */
  maxRanges?: number;
  className?: string;
}

export function AvailabilityScheduler({
  value,
  defaultValue,
  onChange,
  step = 30,
  maxRanges = 2,
  className,
}: AvailabilitySchedulerProps) {
  const reduce = useReducedMotion() ?? false;
  const groupId = useId();
  const options = useMemo(() => buildOptions(step), [step]);
  const idRef = useRef(0);
  const controlled = value !== undefined;
  const [internal, setInternal] = useState<WeekAvailability>(
    () => defaultValue ?? defaultWeek(),
  );
  const week = controlled ? value : internal;
  const weekRef = useRef(week);
  useEffect(() => {
    weekRef.current = week;
  }, [week]);

  const commit = useCallback(
    (next: WeekAvailability) => {
      weekRef.current = next;
      if (!controlled) setInternal(next);
      onChange?.(next);
    },
    [controlled, onChange],
  );

  const setDay = useCallback(
    (day: DayKey, next: DayAvailability) => {
      commit({
        ...weekRef.current,
        [day]: {
          enabled: next.enabled,
          ranges: next.ranges
            .slice(0, maxRanges)
            .map((range) => ({ ...range })),
        },
      });
    },
    [commit, maxRanges],
  );

  const copyDay = useCallback(
    (from: DayKey, targets: DayKey[]) => {
      const source = weekRef.current[from];
      const next = { ...weekRef.current };
      for (const target of targets) {
        next[target] = {
          enabled: source.enabled,
          ranges: source.ranges.slice(0, maxRanges).map((range) => ({
            start: range.start,
            end: range.end,
            id: `${target}-c${idRef.current++}`,
          })),
        };
      }
      commit(next);
    },
    [commit, maxRanges],
  );

  return (
    <LayoutGroup id={groupId}>
      <div className={cn("w-full max-w-xl divide-y divide-border", className)}>
        {WEEKDAYS.map(({ key, label }) => (
          <DayRow
            key={key}
            day={key}
            label={label}
            state={week[key]}
            options={options}
            reduce={reduce}
            onChange={(next) => setDay(key, next)}
            onCopy={(targets) => copyDay(key, targets)}
            maxRanges={maxRanges}
          />
        ))}
      </div>
    </LayoutGroup>
  );
}
