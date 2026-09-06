"use client";

import { type ReactNode } from "react";

import { Bar, BarChart } from "./charts/bar-chart";
import { Line, LineChart } from "./charts/line-chart";
import { RingChart } from "./charts/ring-chart";
import { cn } from "./charts/cn";

type DashboardMetricCardProps = {
  title: string;
  value: string;
  unit?: string;
  icon: ReactNode;
  visual: ReactNode;
  className?: string;
};

export function DashboardMetricCard({
  title,
  value,
  unit,
  icon,
  visual,
  className,
}: DashboardMetricCardProps) {
  return (
    <article
      className={cn(
        "grid h-[194px] w-[154px] shrink-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-2 overflow-hidden rounded-[32px] p-4",
        className,
      )}
    >
      <div className="flex min-w-0 items-center justify-between gap-2">
        <h3 className="truncate text-sm font-medium opacity-95">{title}</h3>
        <span className="grid size-7 shrink-0 place-items-center">{icon}</span>
      </div>
      <div className="min-h-0" aria-hidden="true">
        {visual}
      </div>
      <div className="flex min-w-0 items-baseline gap-1 whitespace-nowrap font-semibold leading-none tabular-nums">
        <p className="truncate text-[1.75rem] tracking-[-0.04em]">{value}</p>
        {unit ? (
          <span className="text-sm font-medium opacity-90">{unit}</span>
        ) : null}
      </div>
    </article>
  );
}

export function MetricBarVisual({
  data,
}: {
  data: Array<{ label: string; value: number }>;
}) {
  return (
    <BarChart data={data} showAxis={false} className="min-h-0">
      <Bar
        dataKey="value"
        fill="color-mix(in oklch, currentColor 72%, transparent)"
        radius={7}
      />
    </BarChart>
  );
}

export function MetricLineVisual({
  data,
  primaryKey = "primary",
  secondaryKey,
}: {
  data: Array<Record<string, string | number>>;
  primaryKey?: string;
  secondaryKey?: string;
}) {
  return (
    <LineChart data={data} className="min-h-0">
      {secondaryKey ? (
        <Line
          dataKey={secondaryKey}
          stroke="color-mix(in oklch, currentColor 30%, transparent)"
          strokeWidth={3}
        />
      ) : null}
      <Line dataKey={primaryKey} stroke="currentColor" strokeWidth={3.5} />
    </LineChart>
  );
}

export function MetricRingVisual({
  value,
  max = 100,
}: {
  value: number;
  max?: number;
}) {
  const boundedMax = Math.max(1, max);
  const boundedValue = Math.min(boundedMax, Math.max(0, value));

  return (
    <RingChart
      className="min-h-0"
      thickness={12}
      segments={[
        {
          key: "value",
          label: "value",
          value: boundedValue,
          color: "currentColor",
        },
        {
          key: "remaining",
          label: "remaining",
          value: boundedMax - boundedValue,
          color: "color-mix(in oklch, currentColor 25%, transparent)",
        },
      ]}
    />
  );
}

export function MetricHeatmapVisual({
  value,
  cells = 20,
}: {
  value: number;
  cells?: number;
}) {
  const activeCells = Math.min(cells, Math.max(0, Math.round(value)));

  return (
    <div className="grid h-full grid-cols-5 content-center gap-1.5">
      {Array.from({ length: cells }, (_, index) => (
        <span
          key={index}
          className={cn(
            "aspect-square rounded-[7px]",
            index < activeCells ? "bg-current" : "bg-current/25",
          )}
        />
      ))}
    </div>
  );
}
