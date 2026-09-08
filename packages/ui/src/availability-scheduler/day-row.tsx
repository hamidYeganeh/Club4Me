"use client";

import { parseTime } from "@internationalized/date";
import { Label, Switch, TimeField } from "@heroui/react";
import { Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useRef } from "react";

import { CopyMenu } from "./copy-menu";
import { IconButton } from "./icon-button";
import { SPRING_LAYOUT } from "./lib/ease";
import { Tooltip } from "./primitives/tooltip";
import {
  clampRange,
  type DayAvailability,
  type DayKey,
  type TimeOption,
  type TimeRange,
  toMinutes,
  toValue,
} from "./types";

const AUDIENCE_LABELS = ["آقایان", "بانوان"] as const;

function formatTimeValue(
  value: { hour: number; minute: number } | null,
): string | null {
  if (!value) return null;
  return `${String(value.hour).padStart(2, "0")}:${String(value.minute).padStart(2, "0")}`;
}

export function DayRow({
  day,
  label,
  state,
  options,
  reduce,
  onChange,
  onCopy,
  maxRanges = 2,
}: {
  day: DayKey;
  label: string;
  state: DayAvailability;
  options: TimeOption[];
  reduce: boolean;
  onChange: (next: DayAvailability) => void;
  onCopy: (targets: DayKey[]) => void;
  /** Max ranges per day. Clubs use 2 (men / women). */
  maxRanges?: number;
}) {
  const idRef = useRef(0);
  const nextId = () => `${day}-n${idRef.current++}`;
  const ranges = useMemo(
    () => state.ranges.slice(0, maxRanges),
    [maxRanges, state.ranges],
  );

  const setEnabled = (enabled: boolean) => {
    if (enabled && ranges.length === 0) {
      onChange({
        enabled,
        ranges: [{ id: nextId(), start: "09:00", end: "17:00" }],
      });
      return;
    }
    onChange({ enabled, ranges: state.ranges.slice(0, maxRanges) });
  };

  const updateRange = (id: string, patch: Partial<TimeRange>) => {
    const changed: "start" | "end" = patch.start !== undefined ? "start" : "end";
    onChange({
      enabled: state.enabled,
      ranges: state.ranges.slice(0, maxRanges).map((range) => {
        if (range.id !== id) return range;
        const next = { ...range, ...patch };
        const clamped = clampRange(next.start, next.end, options, changed);
        if (clamped.start === range.start && clamped.end === range.end) {
          return range;
        }
        return { ...next, ...clamped };
      }),
    });
  };

  const addRange = () => {
    if (ranges.length >= maxRanges) return;
    const last = ranges[ranges.length - 1];
    const start = last ? Math.min(toMinutes(last.end) + 60, 24 * 60 - 60) : 540;
    onChange({
      enabled: true,
      ranges: [
        ...ranges,
        { id: nextId(), start: toValue(start), end: toValue(start + 60) },
      ],
    });
  };

  const removeRange = (id: string) => {
    const nextRanges = ranges.filter((range) => range.id !== id);
    onChange({ enabled: nextRanges.length > 0, ranges: nextRanges });
  };

  const canAdd = ranges.length < maxRanges;
  const showAudience = ranges.length === 2;
  const actions = (
    <>
      {canAdd ? (
        <Tooltip content="افزودن بازه بانوان">
          <IconButton
            label={`افزودن بازه زمانی به ${label}`}
            reduce={reduce}
            onClick={addRange}
          >
            <Plus className="h-4 w-4" />
          </IconButton>
        </Tooltip>
      ) : null}
      <CopyMenu from={day} fromLabel={label} reduce={reduce} onApply={onCopy} />
    </>
  );

  return (
    <motion.div
      layout={reduce ? false : "position"}
      transition={SPRING_LAYOUT}
      data-day={day}
      className="relative flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:gap-4"
    >
      <div className="flex items-center justify-between sm:w-40 sm:shrink-0 sm:justify-start sm:pt-1">
        <div className="flex items-center gap-2.5">
          <Switch
            name={`availability-${day}`}
            aria-label={`فعال‌سازی ساعات ${label}`}
            isSelected={state.enabled}
            onChange={setEnabled}
          >
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch>
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        <div className="flex items-center gap-1 sm:hidden">{actions}</div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <AnimatePresence initial={false} mode="popLayout">
          {state.enabled ? (
            ranges.map((range, index) => {
              const audienceLabel = showAudience
                ? range.audience ? ({ men: "آقایان", women: "بانوان", mixed: "عمومی" })[range.audience] : AUDIENCE_LABELS[index]
                : null;

              return (
                <motion.div
                  key={`${day}-${range.id}`}
                  layout={reduce ? false : "position"}
                  initial={
                    reduce
                      ? { opacity: 0 }
                      : { opacity: 0, y: -6, filter: "blur(4px)" }
                  }
                  animate={
                    reduce
                      ? { opacity: 1 }
                      : { opacity: 1, y: 0, filter: "blur(0px)" }
                  }
                  exit={
                    reduce
                      ? { opacity: 0 }
                      : { opacity: 0, y: -4, filter: "blur(4px)" }
                  }
                  transition={SPRING_LAYOUT}
                  className="relative flex flex-wrap items-end gap-2"
                >
                  {audienceLabel ? (
                    <span className="w-14 shrink-0 self-end pb-2.5 text-sm font-medium text-foreground">
                      {audienceLabel}
                    </span>
                  ) : null}
                  <TimeField
                    name={`hours-${day}-${range.id}-start`}
                    className="min-w-[8.5rem] flex-1"
                    granularity="minute"
                    hourCycle={24}
                    value={parseTime(range.start)}
                    onChange={(value) => {
                      const next = formatTimeValue(value);
                      if (!next || next === range.start) return;
                      updateRange(range.id, { start: next });
                    }}
                  >
                    <Label>شروع</Label>
                    <TimeField.Group variant="secondary" dir="ltr">
                      <TimeField.Input>
                        {(segment) => <TimeField.Segment segment={segment} />}
                      </TimeField.Input>
                    </TimeField.Group>
                  </TimeField>
                  <span className="pb-2.5 text-muted-foreground">–</span>
                  <TimeField
                    name={`hours-${day}-${range.id}-end`}
                    className="min-w-[8.5rem] flex-1"
                    granularity="minute"
                    hourCycle={24}
                    value={parseTime(range.end)}
                    onChange={(value) => {
                      const next = formatTimeValue(value);
                      if (!next || next === range.end) return;
                      updateRange(range.id, { end: next });
                    }}
                  >
                    <Label>پایان</Label>
                    <TimeField.Group variant="secondary" dir="ltr">
                      <TimeField.Input>
                        {(segment) => <TimeField.Segment segment={segment} />}
                      </TimeField.Input>
                    </TimeField.Group>
                  </TimeField>
                  <Tooltip content="حذف">
                    <IconButton
                      label={
                        audienceLabel
                          ? `حذف بازه ${audienceLabel} ${label}`
                          : `حذف بازه زمانی ${label}`
                      }
                      reduce={reduce}
                      onClick={() => removeRange(range.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  </Tooltip>
                </motion.div>
              );
            })
          ) : (
            <motion.span
              key="unavailable"
              layout={reduce ? false : "position"}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
              transition={SPRING_LAYOUT}
              className="py-1 text-sm text-muted-foreground sm:py-2"
            >
              تعطیل
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="hidden shrink-0 items-center gap-1 pt-0.5 sm:flex">
        {actions}
      </div>
    </motion.div>
  );
}
