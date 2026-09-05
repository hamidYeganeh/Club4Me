"use client";

import { Button } from "@heroui/react/button";
import { Typography } from "@heroui/react/typography";
import { quickActionCardVariants } from "./QuickActionCard.styles";
import type { QuickActionCardProps } from "./QuickActionCard.types";

export function QuickActionCard({
  icon,
  label,
  actionLabel,
  layout = "tile",
  className,
  tileClassName,
  labelClassName,
  ...props
}: QuickActionCardProps) {
  const slots = quickActionCardVariants({ layout });
  const ariaLabel =
    actionLabel ?? (typeof label === "string" ? label : undefined);

  return (
    <Button
      {...props}
      aria-label={ariaLabel}
      className={slots.root({ className })}
      variant="ghost"
    >
      <span aria-hidden className={slots.tile({ className: tileClassName })}>
        <span className={slots.icon()}>{icon}</span>
      </span>
      <Typography
        align={layout === "row" ? "start" : "center"}
        className={slots.label({ className: labelClassName })}
        type={layout === "row" ? "body-sm" : "body-xs"}
        weight={layout === "row" ? "semibold" : "medium"}
      >
        {label}
      </Typography>
    </Button>
  );
}
