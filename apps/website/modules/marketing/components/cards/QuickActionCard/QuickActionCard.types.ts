import type { ButtonProps } from "@heroui/react/button";
import type { ReactNode } from "react";

export type QuickActionCardProps = Omit<
  ButtonProps,
  "children" | "variant" | "isIconOnly" | "size" | "fullWidth" | "className"
> & {
  /** Line icon shown inside the rounded tile. */
  icon: ReactNode;
  /** Short label under the tile. */
  label: ReactNode;
  /** Accessible name for the pressable card. Defaults to `label` when string. */
  actionLabel?: string;
  /** Tile for icon-grid layouts, row for compact app-menu layouts. */
  layout?: "tile" | "row";
  /** Extra classes for the root pressable. */
  className?: string;
  /** Extra classes for the icon tile. */
  tileClassName?: string;
  /** Extra classes for the label. */
  labelClassName?: string;
};
