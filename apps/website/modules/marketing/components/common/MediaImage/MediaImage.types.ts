import type { ReactNode } from "react";

export type MediaImageSource = string | ReactNode;

export type MediaImageProps = {
  /**
   * URL string or a custom node.
   * Empty / blank string URLs fall back to the shared mesh placeholder.
   */
  image: MediaImageSource;
  alt?: string;
  className?: string;
  sizes?: string;
  /** Force `aria-hidden` (e.g. decorative backgrounds). */
  "aria-hidden"?: boolean | "true" | "false";
  priority?: boolean;
};
