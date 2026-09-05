"use client";
import type { metricCardVariants } from "./MetricCard.styles";
import type { MetricCardChart } from "./MetricCard.types";

type Slots = ReturnType<typeof metricCardVariants>;

/** The marketing cards are static sparklines; SVG preserves the source geometry without a second chart runtime. */
export function MetricCardChartView({
  chart,
  accent,
  slots,
}: {
  chart: MetricCardChart;
  accent: string;
  slots: Slots;
}) {
  const color = "color" in chart ? (chart.color ?? accent) : accent;
  if (chart.type === "rings")
    return (
      <div aria-hidden className={slots.rings()}>
        {chart.series.map((item, index) => (
          <div className={slots.ringCol()} key={index}>
            <svg
              className={slots.ringSvg()}
              width="18"
              height="18"
              viewBox="0 0 18 18"
            >
              <circle
                cx="9"
                cy="9"
                r="6"
                fill="none"
                stroke="var(--surface-secondary)"
                strokeWidth="2.25"
              />
              <circle
                cx="9"
                cy="9"
                r="6"
                fill="none"
                stroke={color}
                strokeWidth="2.25"
                pathLength="1"
                strokeDasharray={`${Math.max(0, Math.min(1, item.value))} 1`}
                transform="rotate(-90 9 9)"
                strokeLinecap="round"
              />
            </svg>
            {(item.met ?? item.value >= 0.85) && (
              <span className={slots.ringStatus()} style={{ color }}>
                ✓
              </span>
            )}
          </div>
        ))}
      </div>
    );
  if (chart.type === "line") {
    const min = Math.min(...chart.series),
      max = Math.max(...chart.series),
      range = max - min || 1;
    const points = chart.series.map((value, index) => [
      (index / Math.max(1, chart.series.length - 1)) * 200,
      48 - ((value - min) / range) * 40,
    ]);
    const path = points
      .map(([x, y], i) =>
        i === 0
          ? `M ${x} ${y}`
          : chart.curve === "step"
            ? `H ${x} V ${y}`
            : `C ${((points[i - 1]?.[0] ?? 0) + x!) / 2} ${points[i - 1]?.[1]} ${((points[i - 1]?.[0] ?? 0) + x!) / 2} ${y} ${x} ${y}`,
      )
      .join(" ");
    return (
      <div className={slots.linePlot()} aria-hidden>
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 200 52"
          preserveAspectRatio="none"
        >
          <path d={`${path} L 200 52 L 0 52 Z`} fill={color} opacity=".35" />
          <path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth="2.25"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    );
  }
  if (chart.type === "bars") {
    const max = Math.max(...chart.series, 0.0001);
    return (
      <div className={slots.chartPlot()} aria-hidden>
        <div className="flex size-full items-end gap-2">
          {chart.series.map((value, i) => (
            <span
              key={i}
              className="flex-1 rounded-t-full"
              style={{
                height: `${Math.max(14, (value / max) * 100)}%`,
                background: color,
              }}
            />
          ))}
        </div>
      </div>
    );
  }
  if (chart.type === "dots")
    return (
      <div className={slots.dots()} aria-hidden>
        {chart.series.map((value, i) => (
          <div className={slots.dotCol()} key={i}>
            {[0, 1, 2].map((j) => (
              <span
                className={slots.dot()}
                style={{
                  background: j < value ? color : undefined,
                  opacity: j < value ? 1 - j * 0.3 : 1,
                }}
                key={j}
              />
            ))}
          </div>
        ))}
      </div>
    );
  if (chart.type === "moods")
    return (
      <div className={slots.moods()} aria-hidden>
        {chart.series.map((mood, i) => (
          <span className={slots.moodIcon()} key={i}>
            {mood === "sad" || mood === "depressed" ? "☹" : "☺"}
          </span>
        ))}
      </div>
    );
  const values =
    chart.type === "stacked"
      ? chart.series.map((series) =>
          series.reduce((sum, value) => sum + value, 0),
        )
      : chart.series.map((item) => item.high);
  const max = Math.max(...values, 1);
  return (
    <div className={slots.chartPlot()} aria-hidden>
      <div className="flex size-full items-end gap-2">
        {values.map((value, i) => (
          <span
            className="flex-1 rounded-t-full"
            style={{ height: `${(value / max) * 100}%`, background: color }}
            key={i}
          />
        ))}
      </div>
    </div>
  );
}
