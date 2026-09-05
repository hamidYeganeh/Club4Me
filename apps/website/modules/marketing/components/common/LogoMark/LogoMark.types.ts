import type { SVGProps } from "react";

export const LOGO_COLOR = "#1fff6f";

export const LOGO_SIZES = {
  xs: 16,
  sm: 24,
  md: 32,
  lg: 40,
  xl: 48,
  "2xl": 64,
  "3xl": 96,
  "4xl": 128,
  "5xl": 180,
  "6xl": 192,
  "7xl": 512,
} as const;

export type LogoSizeToken = keyof typeof LOGO_SIZES;
export type LogoSize = LogoSizeToken | number;

export type LogoMarkProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  size?: LogoSize;
  title?: string;
  /** Unique suffix for SVG defs (required when rendering multiple logos). */
  instanceId?: string;
  /** Mark fill / stroke color — defaults to brand accent (`LOGO_COLOR`). */
  color?: string;
  /** Drop shadow filter — disable for favicons / ImageResponse. */
  shadow?: boolean;
  /** Stroke gradient fade — disable for flat mark / favicons. */
  gradient?: boolean;
};
