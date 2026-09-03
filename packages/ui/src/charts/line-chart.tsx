"use client";

import { curveMonotoneX, curveStepAfter } from "@visx/curve";
import { ParentSize } from "@visx/responsive";
import { scaleLinear, scalePoint } from "@visx/scale";
import { AreaClosed, LinePath } from "@visx/shape";
import { motion, useReducedMotion } from "motion/react";
import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useId,
  useMemo,
} from "react";

import { cn } from "./cn";

export type ChartDatum = Record<string, string | number>;

type CurveKind = "smooth" | "step";

export type LineProps = {
  dataKey: string;
  stroke?: string;
  strokeWidth?: number;
  curve?: CurveKind;
  fill?: boolean;
};

export function Line(_props: LineProps): null {
  return null;
}

Line.displayName = "Line";

export type GridProps = {
  horizontal?: boolean;
};

export function Grid(_props: GridProps): null {
  return null;
}

Grid.displayName = "Grid";

export type XAxisProps = {
  tickCount?: number;
};

export function XAxis(_props: XAxisProps): null {
  return null;
}

XAxis.displayName = "XAxis";

export type LineChartProps = {
  data: ChartDatum[];
  xDataKey?: string;
  className?: string;
  children: ReactNode;
};

function childName(child: ReactElement): string {
  const type = child.type as { displayName?: string; name?: string };
  return type.displayName ?? type.name ?? "";
}

export function LineChart({
  data,
  xDataKey = "label",
  className,
  children,
}: LineChartProps) {
  const gradientId = useId().replace(/:/g, "");
  const reduceMotion = useReducedMotion();

  const series = useMemo(() => {
    const lines: LineProps[] = [];
    let showGrid = false;
    let showAxis = false;

    Children.forEach(children, (child) => {
      if (!isValidElement(child)) return;
      const name = childName(child);
      if (name === "Line") {
        lines.push(child.props as unknown as LineProps);
      }
      if (name === "Grid") showGrid = true;
      if (name === "XAxis") showAxis = true;
    });

    return { lines, showGrid, showAxis };
  }, [children]);

  return (
    <div className={cn("relative h-full min-h-[8rem] w-full", className)}>
      <ParentSize debounceTime={12}>
        {({ width, height }) => {
          if (width < 16 || height < 16 || data.length === 0) return null;

          const margin = {
            top: 12,
            right: 8,
            bottom: series.showAxis ? 28 : 8,
            left: 8,
          };
          const innerWidth = Math.max(1, width - margin.left - margin.right);
          const innerHeight = Math.max(1, height - margin.top - margin.bottom);
          const labels = data.map((d) => String(d[xDataKey] ?? ""));
          const xScale = scalePoint<string>({
            domain: labels,
            range: [0, innerWidth],
            padding: 0.12,
          });

          let minY = Number.POSITIVE_INFINITY;
          let maxY = Number.NEGATIVE_INFINITY;
          for (const line of series.lines) {
            for (const d of data) {
              const value = d[line.dataKey];
              if (typeof value === "number") {
                minY = Math.min(minY, value);
                maxY = Math.max(maxY, value);
              }
            }
          }
          if (!Number.isFinite(minY) || !Number.isFinite(maxY)) {
            minY = 0;
            maxY = 100;
          }
          const pad = (maxY - minY) * 0.12 || 8;
          const yScale = scaleLinear({
            domain: [Math.max(0, minY - pad), maxY + pad],
            range: [innerHeight, 0],
            nice: true,
          });

          const getX = (d: ChartDatum) =>
            xScale(String(d[xDataKey] ?? "")) ?? 0;
          const getY = (key: string) => (d: ChartDatum) => {
            const value = d[key];
            return typeof value === "number" ? yScale(value) : innerHeight;
          };

          const ticks = yScale.ticks(4);

          return (
            <svg width={width} height={height} role="img" aria-hidden>
              <defs>
                {series.lines.map((line, index) => {
                  const stroke = line.stroke ?? "var(--chart-line-primary)";
                  return (
                    <linearGradient
                      key={`${gradientId}-${line.dataKey}`}
                      id={`${gradientId}-${index}`}
                      x1="0"
                      x2="0"
                      y1="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor={stroke} stopOpacity={0.38} />
                      <stop
                        offset="100%"
                        stopColor={stroke}
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  );
                })}
              </defs>
              <g transform={`translate(${margin.left},${margin.top})`}>
                {series.showGrid
                  ? ticks.map((tick) => (
                      <line
                        key={tick}
                        x1={0}
                        x2={innerWidth}
                        y1={yScale(tick)}
                        y2={yScale(tick)}
                        stroke="var(--chart-grid)"
                        strokeOpacity={0.7}
                      />
                    ))
                  : null}
                {series.lines.map((line, index) => {
                  const stroke = line.stroke ?? "var(--chart-line-primary)";
                  const curve =
                    line.curve === "step" ? curveStepAfter : curveMonotoneX;
                  const path = (
                    <LinePath
                      data={data}
                      x={getX}
                      y={getY(line.dataKey)}
                      curve={curve}
                      stroke={stroke}
                      strokeWidth={line.strokeWidth ?? 2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                      style={{
                        filter: `drop-shadow(0 0 8px ${stroke})`,
                      }}
                    />
                  );

                  return (
                    <g key={line.dataKey}>
                      {line.fill ? (
                        <AreaClosed
                          data={data}
                          x={getX}
                          y={getY(line.dataKey)}
                          yScale={yScale}
                          curve={curve}
                          fill={`url(#${gradientId}-${index})`}
                        />
                      ) : null}
                      {reduceMotion ? (
                        path
                      ) : (
                        <motion.g
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.45, delay: index * 0.08 }}
                        >
                          {path}
                        </motion.g>
                      )}
                    </g>
                  );
                })}
                {series.showAxis
                  ? labels.map((label) => (
                      <text
                        key={label}
                        x={xScale(label) ?? 0}
                        y={innerHeight + 18}
                        textAnchor="middle"
                        className="fill-muted text-[10px]"
                      >
                        {label}
                      </text>
                    ))
                  : null}
              </g>
            </svg>
          );
        }}
      </ParentSize>
    </div>
  );
}
