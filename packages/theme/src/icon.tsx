import type { ComponentPropsWithoutRef, CSSProperties } from "react";

import { cn } from "./cn";
import type { IconName } from "./icon-names";

const sizes = {
  sm: "text-[14px]",
  md: "text-[16px]",
  lg: "text-[20px]",
  xl: "text-[24px]",
} as const;

export type IconSize = keyof typeof sizes;

export type IconProps = Omit<ComponentPropsWithoutRef<"span">, "children"> & {
  name: IconName;
  size?: IconSize | number;
  label?: string;
};

export function Icon({
  name,
  size = "md",
  label,
  className,
  style,
  ...props
}: IconProps) {
  const sizedStyle: CSSProperties | undefined =
    typeof size === "number" ? { fontSize: size, ...style } : style;

  // Navigation chevrons use crisp strokes; the font artwork is a curved half-disc.
  const chevronPaths: Partial<Record<IconName, string>> = {
    "chevron-left": "m15 18-6-6 6-6",
    "chevron-right": "m9 18 6-6-6-6",
    "chevron-up": "m6 15 6-6 6 6",
    "chevron-down": "m6 9 6 6 6-6",
  };
  const chevron = chevronPaths[name];
  if (chevron)
    return (
      <span
        className={cn(
          "icon",
          typeof size === "string" ? sizes[size] : undefined,
          className,
        )}
        style={sizedStyle}
        aria-hidden={label ? undefined : true}
        aria-label={label}
        role={label ? "img" : undefined}
        data-icon={name}
        {...props}
      >
        <svg
          viewBox="0 0 24 24"
          width="100%"
          height="100%"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d={chevron} />
        </svg>
      </span>
    );

  return (
    <span
      className={cn(
        "icon",
        `icon-${name}`,
        typeof size === "string" ? sizes[size] : undefined,
        className,
      )}
      style={sizedStyle}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      {...props}
    />
  );
}

export type { IconName };
export { iconNames } from "./icon-names";
