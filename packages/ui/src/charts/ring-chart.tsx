"use client";

import { ParentSize } from "@visx/responsive";
import { Pie } from "@visx/shape";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "./cn";

export type RingSegment = {
  key: string;
  label: string;
  value: number;
  color: string;
};

export type RingChartProps = {
  segments: RingSegment[];
  centerValue?: string;
  centerLabel?: string;
  className?: string;
  thickness?: number;
};

export function RingChart({
  segments,
  centerValue,
  centerLabel,
  className,
  thickness = 18,
}: RingChartProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className={cn("relative h-full min-h-[9rem] w-full", className)}>
      <ParentSize debounceTime={12}>
        {({ width, height }) => {
          if (width < 16 || height < 16 || segments.length === 0) return null;

          const size = Math.min(width, height);
          const radius = size / 2;
          const innerRadius = Math.max(12, radius - thickness);
          const left = (width - size) / 2;
          const top = (height - size) / 2;

          return (
            <svg width={width} height={height} role="img" aria-hidden>
              <g transform={`translate(${left + radius},${top + radius})`}>
                <Pie
                  data={segments}
                  pieValue={(d) => d.value}
                  innerRadius={innerRadius}
                  outerRadius={radius}
                  padAngle={0.03}
                  cornerRadius={6}
                  pieSort={null}
                >
                  {({ arcs, path }) =>
                    arcs.map((arc, index) => {
                      const d = path(arc) ?? "";
                      const color = arc.data.color;
                      const node = (
                        <path
                          d={d}
                          fill={color}
                        />
                      );

                      if (reduceMotion) {
                        return <g key={arc.data.key}>{node}</g>;
                      }

                      return (
                        <motion.g
                          key={arc.data.key}
                          initial={{ opacity: 0, scale: 0.86 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{
                            duration: 0.45,
                            delay: index * 0.08,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        >
                          {node}
                        </motion.g>
                      );
                    })
                  }
                </Pie>
                {centerValue ? (
                  <text
                    textAnchor="middle"
                    dy={centerLabel ? "-0.15em" : "0.35em"}
                    className="fill-foreground text-lg font-semibold"
                  >
                    {centerValue}
                  </text>
                ) : null}
                {centerLabel ? (
                  <text
                    textAnchor="middle"
                    dy="1.25em"
                    className="fill-muted text-[11px]"
                  >
                    {centerLabel}
                  </text>
                ) : null}
              </g>
            </svg>
          );
        }}
      </ParentSize>
    </div>
  );
}
