import type { ButtonProps } from "@heroui/react/button";
import type { HTMLAttributes, ReactNode } from "react";

export type CallToActionCardVariant = "primary" | "outlined" | "soft";

/**
 * Action control style.
 * - `plus` — circular + button
 * - `icon` — squircle with a custom icon
 * - `button` — labeled pill (e.g. enrollment "Book Seat")
 * - `pending` — waiting/hourglass, not actionable
 */
export type CallToActionCardActionType = "plus" | "icon" | "button" | "pending";

export type CallToActionCardProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "title" | "children"
> & {
  /** Visual style. `primary` is filled accent; `outlined` is border-only; `soft` is pastel with badge. */
  variant?: CallToActionCardVariant;
  /** Action control style. Defaults to `plus`. Soft always uses a dashed ring + circular control. */
  actionType?: CallToActionCardActionType;
  /** Smaller top line on primary/outlined; description line on soft (e.g. "Trial version"). */
  subtitle: ReactNode;
  /** Larger bold title (e.g. "Fitness AI Chatbot" / "NEW PROJECT"). */
  title: ReactNode;
  /** Muted trailing copy after subtitle on soft (e.g. "2 projects left"). */
  meta?: ReactNode;
  /** Pill badge shown under the description on soft (e.g. "Version 3.0"). */
  badge?: ReactNode;
  /** Icon shown inside the squircle when `actionType` is `icon`. */
  icon?: ReactNode;
  /** Accessible label for the action; also the visible text when `actionType` is `button`. */
  actionLabel: string;
  /** Called when the action button is pressed. */
  onAction?: ButtonProps["onPress"];
  /** Extra classes for the action button. */
  actionClassName?: string;
};
