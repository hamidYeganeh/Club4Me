import type { ButtonProps } from "@heroui/react/button";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

export type ClubClassCardSize = "sm" | "md" | "lg";

export type ClubClassCardProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "title" | "children" | "className" | "style"
> & {
  /** Category chip label (e.g. `"Fitness"`). */
  category: ReactNode;
  /** Optional icon inside the category chip. Defaults to BarbellHorizontal. */
  categoryIcon?: ReactNode;
  /** Date line under the chip (e.g. `"THURSDAY, JUN 25, 2025"`). */
  date: ReactNode;
  /** Main title. */
  title: ReactNode;
  /** Author / instructor meta (e.g. `"Mai Sakurajima, PhD"`). */
  author: ReactNode;
  /** Duration / read-time meta (e.g. `"5min read"` / `"45min"`). */
  duration: ReactNode;
  /**
   * Optional background image — a URL string or a custom React node
   * (e.g. `next/image`).
   */
  backgroundImage?: string | ReactNode;
  /** Accessible alt text when `backgroundImage` is a URL string. */
  backgroundImageAlt?: string;
  /** Card size. Defaults to `lg` (340×420). */
  size?: ClubClassCardSize;
  /** Called when the corner action is pressed. */
  onAction?: ButtonProps["onPress"];
  /** Accessible label for the corner action. */
  actionLabel?: string;
  /**
   * Solid fallback / overlay tint color. Defaults to a near-black oklch fill.
   * Used as the card background when no image is set, and as the scrim tint
   * when `backgroundImage` is present.
   */
  color?: string;
  /** Text and icon color. Defaults to `var(--stats-foreground)`. */
  foregroundColor?: string;
  /**
   * Shared surface for the category chip and corner action.
   * Defaults to a dark oklch fill for contrast on photo cards.
   */
  accentColor?: string;
  /** Corner action icon color. Defaults to `foregroundColor`. */
  actionForegroundColor?: string;
  /**
   * Overlay opacity over the background image (0–1). Uses `color` as the
   * tint. Defaults to `0.72` when an image is present.
   */
  overlayOpacity?: number;
  /** Extra classes for the background image layer. */
  backgroundImageClassName?: string;
  /** Extra classes for the category chip. */
  categoryClassName?: string;
  /** Extra classes for the corner action. */
  actionClassName?: string;
  /** Extra classes for the root. */
  className?: string;
  /** Extra inline styles merged onto the root. */
  style?: CSSProperties;
};
