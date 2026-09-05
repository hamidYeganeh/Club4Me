import type { ReactNode } from "react";

export type MetricMood =
  "overjoyed" | "happy" | "neutral" | "sad" | "depressed";

export type MetricCardLayout = "horizontal" | "vertical";

export type MetricCardLineChart = {
  type: "line";
  /** Daily values (typically 7). */
  series: readonly number[];
  color?: string;
  /**
   * Area curve.
   * - `monotone` — smooth weight-style line (default)
   * - `step` — stepped heart-rate style
   */
  curve?: "monotone" | "step";
};

export type MetricCardBarsChart = {
  type: "bars";
  /** Daily fill amounts 0–1 (or any scale; normalized to max). */
  series: readonly number[];
  color?: string;
  /** Background track color. Defaults to theme `bg-default`. */
  trackColor?: string;
};

export type MetricCardStackedChart = {
  type: "stacked";
  /**
   * Per day: segment values bottom → top (typically 3).
   * Values are relative heights within the day column.
   */
  series: readonly (readonly number[])[];
  color?: string;
  /** Per-segment opacity from bottom → top. Defaults to `[1, 0.72, 0.45]`. */
  opacities?: readonly number[];
};

export type MetricCardRangeChart = {
  type: "range";
  /** Daily low/high pairs (e.g. diastolic/systolic). */
  series: readonly { low: number; high: number }[];
  color?: string;
  trackColor?: string;
};

export type MetricCardRingsChart = {
  type: "rings";
  /** Daily progress 0–1. `met` drives the check inside each ring. */
  series: readonly { value: number; met?: boolean }[];
  color?: string;
};

export type MetricCardDotsChart = {
  type: "dots";
  /** Per day: how many of 3 dots are filled (0–3). */
  series: readonly number[];
  color?: string;
};

export type MetricCardMoodsChart = {
  type: "moods";
  series: readonly (MetricMood | null)[];
};

export type MetricCardChart =
  | MetricCardLineChart
  | MetricCardBarsChart
  | MetricCardStackedChart
  | MetricCardRangeChart
  | MetricCardRingsChart
  | MetricCardDotsChart
  | MetricCardMoodsChart;

export type MetricCardProps = {
  title: ReactNode;
  icon: ReactNode;
  /** Primary reading — number or short text (e.g. "Happy"). */
  value: ReactNode;
  unit?: ReactNode;
  /** Status line under the value (e.g. "On Track"). */
  status?: ReactNode;
  /** Trailing header label, defaults to "Today". */
  periodLabel?: ReactNode;
  /** Weekday labels under the chart. Defaults to M T W T F S S. */
  dayLabels?: readonly string[];
  chart: MetricCardChart;
  /**
   * Layout variant.
   * - `horizontal` — wide card, meta left / chart right (default)
   * - `vertical` — tall card, meta above / chart full-width below
   */
  variant?: MetricCardLayout;
  /**
   * Accent for icon badge + chart fills.
   * Prefer theme tokens (`statsColors.*` / `var(--stats-orange)`).
   */
  color?: string;
  onPress?: () => void;
  className?: string;
};
