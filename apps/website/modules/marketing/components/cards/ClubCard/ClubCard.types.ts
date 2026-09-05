import type { ButtonProps } from "@heroui/react/button";
import type { HTMLAttributes, ReactNode } from "react";

export type ClubCardOrientation =
  "horizontal" | "vertical" | "fullWidth" | "listing";

export type ClubCardFeature = {
  /** Feature chip label (e.g. `"Dining"`). */
  label: ReactNode;
  /** Optional leading icon for the chip. */
  icon?: ReactNode;
};

export type ClubCardProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "title" | "children"
> & {
  /**
   * Layout direction.
   * - `horizontal` — landscape cover (`aspect-ratio: 4/3`, max-width)
   * - `vertical` — portrait cover with stars, features, and footer CTA
   * - `fullWidth` — edge-to-edge landscape hero cover (no max-width)
   * - `listing` — portrait showcase with status badges, title/price row, and feature pills
   */
  orientation?: ClubCardOrientation;
  /**
   * Cover image — a URL string or a custom React node (e.g. `next/image`).
   */
  image: string | ReactNode;
  /** Accessible alt text when `image` is a URL string. */
  imageAlt?: string;
  /** Club / venue name. */
  title: ReactNode;
  /**
   * Short supporting line under the title.
   * In `vertical`, rendered as a location row with a map-pin icon.
   */
  subtitle?: ReactNode;
  /** Star rating value (e.g. `4.8`). Clamped to `0…maxRating` for the star row. */
  rating?: number;
  /** Max stars shown in the vertical star row (default `5`). */
  maxRating?: number;
  /** Number of ratings shown next to the score in `horizontal` (e.g. `146`). */
  ratingCount?: number;
  /** Feature chips shown under the location (`vertical` and `listing`). */
  features?: ClubCardFeature[];
  /** Status pill label shown in `listing` (e.g. `"Open now"`). */
  statusLabel?: ReactNode;
  /** Dimmed text before the price amount (e.g. `"From"`). */
  pricePrefix?: ReactNode;
  /** Price amount / line (e.g. `"$760"` or `"₹42,000 / month"`). */
  price?: ReactNode;
  /** Dimmed text after the price amount (e.g. `"/night"`). */
  priceSuffix?: ReactNode;
  /** Primary CTA label (e.g. `"VIEW DETAILS"`). Hidden for `listing`. */
  actionLabel?: string;
  /** Called when the primary CTA is pressed. */
  onAction?: () => void;
  /** Called when the share control is pressed (`horizontal` only). */
  onShare?: ButtonProps["onPress"];
  /** Called when the favorite control is pressed (`horizontal` only). */
  onFavorite?: ButtonProps["onPress"];
  /** Whether the club is favorited (fills the heart). */
  isFavorite?: boolean;
  /** Accessible label for the share button. */
  shareLabel?: string;
  /** Accessible label for the favorite button. */
  favoriteLabel?: string;
  /** Extra classes for the cover image layer. */
  imageClassName?: string;
};
