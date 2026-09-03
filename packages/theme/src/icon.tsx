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
