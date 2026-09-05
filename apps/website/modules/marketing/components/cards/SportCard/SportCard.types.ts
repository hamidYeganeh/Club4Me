import type { ButtonProps } from "@heroui/react/button";
import type { CSSProperties, ReactNode } from "react";

export type SportCardSize = "sm" | "md" | "lg";

/** Sport data rendered by SportCard. */
export type Sport = {
  /** Larger bold title (e.g. "Kickboxing"). */
  title: ReactNode;
  /** Smaller top line (e.g. "Upcoming Exercise"). */
  subtitle: ReactNode;
  /**
   * Background image — a URL string or a custom React node
   * (e.g. `next/image`). Falls back to the shared placeholder so the
   * color overlay always sits on photography, like SportCategoryCard.
   */
  backgroundImage?: string | ReactNode;
  /** Optional sport / activity icon. Falls back to PersonKarate. */
  icon?: ReactNode;
};

export type SportCardProps = Omit<
  ButtonProps,
  | "children"
  | "variant"
  | "isIconOnly"
  | "size"
  | "fullWidth"
  | "className"
  | "style"
> & {
  /** Sport content (title, subtitle, background image, icon). */
  sport: Sport;
  /** Card size. Defaults to `md` (280×380). */
  size?: SportCardSize;
  /** Accessible label for the pressable card. */
  actionLabel: string;
  /**
   * Card background color. Also used as the image overlay tint when
   * `sport.backgroundImage` is set. Defaults to `var(--stats-blue)`.
   */
  color?: string;
  /** Text and icon color. Defaults to `var(--stats-foreground)`. */
  foregroundColor?: string;
  /** Circular affordance background. Defaults to a near-black oklch fill. */
  actionColor?: string;
  /** Circular affordance icon color. Defaults to `foregroundColor`. */
  actionForegroundColor?: string;
  /** Extra classes for the background image layer. */
  backgroundImageClassName?: string;
  /**
   * Overlay opacity over the background image (0–1). Uses `color` as the
   * tint. Defaults to `0.55`.
   */
  overlayOpacity?: number;
  /** Extra classes for the circular affordance. */
  actionClassName?: string;
  /** Extra classes for the root pressable. */
  className?: string;
  /** Extra inline styles merged onto the root. */
  style?: CSSProperties;
};
