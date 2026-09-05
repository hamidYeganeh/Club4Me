import type { ButtonProps } from "@heroui/react/button";
import type { HTMLAttributes, ReactNode } from "react";

export type ArticleCardOrientation = "vertical" | "horizontal";

/**
 * Content treatment.
 * - `cover` — media thumbnail plus body
 * - `text` — body only (no image)
 */
export type ArticleCardType = "cover" | "text";

/**
 * Layout preset. Prefer `orientation` + `type`.
 * - `stacked` / `vertical` — cover on top
 * - `row` / `horizontal` — cover on the start edge
 * - `feed` — text-only
 */
export type ArticleCardVariant =
  "stacked" | "row" | "feed" | ArticleCardOrientation;

export type ArticleCardAuthor = {
  name: ReactNode;
  avatarSrc?: string | null;
  avatarAlt?: string;
};

export type ArticleCardTag = {
  key?: string;
  label: ReactNode;
  icon?: ReactNode;
  onPress?: ButtonProps["onPress"];
};

export type ArticleCardProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "title" | "children"
> & {
  /**
   * Layout direction for `type="cover"`.
   * Ignored when `type="text"` (always stacked).
   */
  orientation?: ArticleCardOrientation;
  /** Whether to show a cover image. */
  type?: ArticleCardType;
  /**
   * @deprecated Use `orientation` + `type`.
   */
  variant?: ArticleCardVariant;
  /** Cover / thumbnail image URL. */
  coverSrc?: string | null;
  /** Accessible alt for the cover image. */
  coverAlt?: string;
  /** Category pill on the vertical cover (and on `text` cards). */
  category?: ReactNode;
  title: ReactNode;
  /** Truncated supporting copy under the title. */
  excerpt?: ReactNode;
  /** Absolute or relative date label. */
  publishedAtLabel?: ReactNode;
  /** Reading time label (e.g. `"3m read"`). */
  readingTimeLabel?: ReactNode;
  viewsLabel?: ReactNode;
  likesLabel?: ReactNode;
  commentsLabel?: ReactNode;
  /** Footer tags. When omitted, views / likes / comments are used. */
  tags?: ArticleCardTag[];
  author?: ArticleCardAuthor;
  saved?: boolean;
  saveLabel?: string;
  onSavePress?: ButtonProps["onPress"];
  /** Accessible label for the overflow menu. */
  menuLabel?: string;
  onMenuPress?: ButtonProps["onPress"];
  /** Accessible name for the card press target. */
  actionLabel: string;
  /** Press handler for the card (navigation). */
  onPress?: ButtonProps["onPress"];
};
