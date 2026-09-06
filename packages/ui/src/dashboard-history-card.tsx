"use client";

import type { ReactNode } from "react";

import { Bar, BarChart } from "./charts/bar-chart";
import { Line, LineChart } from "./charts/line-chart";
import { cn } from "./charts/cn";

type HistoryDatum = {
  label: string;
  value: number;
  color?: string;
};

type DashboardHistoryCardProps = {
  date: string;
  meta: string;
  value: string;
  unit: string;
  status: string;
  statusIcon: ReactNode;
  data: HistoryDatum[];
  chartColor?: string;
  className?: string;
};

export function DashboardHistoryCard({
  date,
  meta,
  value,
  unit,
  status,
  statusIcon,
  data,
  chartColor = "var(--accent)",
  className,
}: DashboardHistoryCardProps) {
  return (
    <article
      className={cn(
        "grid min-h-36 grid-cols-[minmax(0,1fr)_minmax(7.5rem,0.9fr)] grid-rows-[auto_1fr] gap-x-4 gap-y-3 rounded-[28px] border border-border/70 bg-surface p-4 text-foreground",
        className,
      )}
    >
      <p className="truncate text-sm font-semibold text-muted">{date}</p>
      <span className="text-end text-sm text-muted">{meta}</span>
      <div className="flex min-w-0 flex-col justify-end">
        <div className="flex items-baseline gap-1 tabular-nums">
          <strong className="truncate text-3xl leading-none tracking-[-0.04em]">
            {value}
          </strong>
          <span className="text-sm font-medium text-muted">{unit}</span>
        </div>
        <p
          className="mt-3 flex min-w-0 items-center gap-2 text-sm font-medium"
          style={{ color: chartColor }}
        >
          <span className="grid size-5 shrink-0 place-items-center">
            {statusIcon}
          </span>
          <span className="truncate text-muted">{status}</span>
        </p>
      </div>
      <div className="min-h-20 self-end" aria-hidden="true">
        <BarChart data={data} showAxis={false} className="min-h-0">
          <Bar dataKey="value" fill={chartColor} radius={7} />
        </BarChart>
      </div>
    </article>
  );
}

type DashboardTrendCardProps = {
  title: string;
  value: string;
  unit?: string;
  detail: string;
  data: Array<Record<string, string | number>>;
  dataKey?: string;
  color?: string;
  className?: string;
};

export function DashboardTrendCard({
  title,
  value,
  unit,
  detail,
  data,
  dataKey = "value",
  color = "var(--accent)",
  className,
}: DashboardTrendCardProps) {
  return (
    <article
      className={cn(
        "grid min-h-64 grid-rows-[minmax(9rem,1fr)_auto] rounded-[28px] border border-border/70 bg-surface p-5 text-foreground",
        className,
      )}
    >
      <div className="min-h-36" aria-hidden="true">
        <LineChart data={data} className="min-h-0">
          <Line
            dataKey={dataKey}
            stroke={color}
            strokeWidth={3}
            fill
            showDots
          />
        </LineChart>
      </div>
      <div className="border-t border-border/60 pt-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h3 className="text-sm font-medium text-muted">{title}</h3>
            <p className="mt-1 text-xs text-muted">{detail}</p>
          </div>
          <p className="shrink-0 text-2xl font-semibold tabular-nums">
            {value}
            {unit ? (
              <span className="ms-1 text-sm font-medium text-muted">
                {unit}
              </span>
            ) : null}
          </p>
        </div>
      </div>
    </article>
  );
}
