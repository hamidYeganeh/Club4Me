"use client";

import { ParentSize } from "@visx/responsive";
import { scaleBand, scaleLinear } from "@visx/scale";
import { BarRounded } from "@visx/shape";
import { motion, useReducedMotion } from "motion/react";
import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useMemo,
} from "react";

import { cn } from "./cn";
import type { ChartDatum } from "./line-chart";

export type BarProps = {
  dataKey: string;
  fill?: string;
  radius?: number;
};

export function Bar(_props: BarProps): null {
  return null;
}

Bar.displayName = "Bar";

export type BarChartProps = {
  data: ChartDatum[];
  xDataKey?: string;
  className?: string;
  layout?: "vertical" | "horizontal";
  children: ReactNode;
};

function childName(child: ReactElement): string {
  const type = child.type as { displayName?: string; name?: string };
  return type.displayName ?? type.name ?? "";
}

export function BarChart({
  data,
  xDataKey = "label",
  className,
  layout = "vertical",
  children,
}: BarChartProps) {
  const reduceMotion = useReducedMotion();

  const bars = useMemo(() => {
    const found: BarProps[] = [];
    Children.forEach(children, (child) => {
      if (!isValidElement(child)) return;
      if (childName(child) === "Bar") {
        found.push(child.props as unknown as BarProps);
      }
    });
    return found;
  }, [children]);

  const primary = bars[0];

  return (
    <div className={cn("relative h-full min-h-[8rem] w-full", className)}>
      <ParentSize debounceTime={12}>
        {({ width, height }) => {
          if (width < 16 || height < 16 || data.length === 0 || !primary) {
            return null;
          }

          const margin = { top: 8, right: 8, bottom: 28, left: 8 };
          const innerWidth = Math.max(1, width - margin.left - margin.right);
          const innerHeight = Math.max(1, height - margin.top - margin.bottom);
          const labels = data.map((d) => String(d[xDataKey] ?? ""));
          const values = data.map((d) => {
            const value = d[primary.dataKey];
            return typeof value === "number" ? value : 0;
          });
          const maxY = Math.max(...values, 1) * 1.15;

          if (layout === "horizontal") {
            const yScale = scaleBand({
              domain: labels,
              range: [0, innerHeight],
              padding: 0.28,
            });
            const xScale = scaleLinear({
              domain: [0, maxY],
              range: [0, innerWidth],
            });

            return (
              <svg width={width} height={height} role="img" aria-hidden>
                <g transform={`translate(${margin.left},${margin.top})`}>
                  {data.map((d, index) => {
                    const label = String(d[xDataKey] ?? "");
                    const value =
                      typeof d[primary.dataKey] === "number"
                        ? (d[primary.dataKey] as number)
                        : 0;
                    const barHeight = yScale.bandwidth();
                    const barWidth = xScale(value);
                    const y = yScale(label) ?? 0;
                    const fill = primary.fill ?? "var(--chart-1)";

                    return (
                      <g key={label}>
                        {reduceMotion ? (
                          <BarRounded
                            x={0}
                            y={y}
                            width={Math.max(2, barWidth)}
                            height={barHeight}
                            radius={primary.radius ?? 10}
                            all
                            fill={fill}
                            style={{ filter: `drop-shadow(0 0 10px ${fill})` }}
                          />
                        ) : (
                          <motion.g
                            initial={{ opacity: 0, scaleX: 0.4 }}
                            animate={{ opacity: 1, scaleX: 1 }}
                            transition={{
                              duration: 0.45,
                              delay: index * 0.06,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                            style={{ originX: 0, originY: 0.5 }}
                          >
                            <BarRounded
                              x={0}
                              y={y}
                              width={Math.max(2, barWidth)}
                              height={barHeight}
                              radius={primary.radius ?? 10}
                              all
                              fill={fill}
                              style={{
                                filter: `drop-shadow(0 0 10px ${fill})`,
                              }}
                            />
                          </motion.g>
                        )}
                      </g>
                    );
                  })}
                </g>
              </svg>
            );
          }

          const xScale = scaleBand({
            domain: labels,
            range: [0, innerWidth],
            padding: 0.32,
          });
          const yScale = scaleLinear({
            domain: [0, maxY],
            range: [innerHeight, 0],
          });

          return (
            <svg width={width} height={height} role="img" aria-hidden>
              <g transform={`translate(${margin.left},${margin.top})`}>
                {data.map((d, index) => {
                  const label = String(d[xDataKey] ?? "");
                  const value =
                    typeof d[primary.dataKey] === "number"
                      ? (d[primary.dataKey] as number)
                      : 0;
                  const barWidth = xScale.bandwidth();
                  const x = xScale(label) ?? 0;
                  const y = yScale(value);
                  const fill =
                    typeof d.color === "string"
                      ? d.color
                      : (primary.fill ?? "var(--chart-1)");

                  return (
                    <g key={label}>
                      {reduceMotion ? (
                        <BarRounded
                          x={x}
                          y={y}
                          width={barWidth}
                          height={Math.max(2, innerHeight - y)}
                          radius={primary.radius ?? 14}
                          top
                          fill={fill}
                          style={{ filter: `drop-shadow(0 0 12px ${fill})` }}
                        />
                      ) : (
                        <motion.g
                          initial={{ opacity: 0, scaleY: 0.35 }}
                          animate={{ opacity: 1, scaleY: 1 }}
                          transition={{
                            duration: 0.5,
                            delay: index * 0.07,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          style={{ originY: 1, originX: 0.5 }}
                        >
                          <BarRounded
                            x={x}
                            y={y}
                            width={barWidth}
                            height={Math.max(2, innerHeight - y)}
                            radius={primary.radius ?? 14}
                            top
                            fill={fill}
                            style={{
                              filter: `drop-shadow(0 0 12px ${fill})`,
                            }}
                          />
                        </motion.g>
                      )}
                      <text
                        x={x + barWidth / 2}
                        y={innerHeight + 18}
                        textAnchor="middle"
                        className="fill-muted text-[10px]"
                      >
                        {label}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          );
        }}
      </ParentSize>
    </div>
  );
}
