import type { ReactNode } from "react";

export type SecondaryHeaderProps = {
  /** When set, replaces the location chip and enables the page layout. */
  title?: string;
  filterLabel?: string;
  onFilterPress?: () => void;
  showFilter?: boolean;
  showBack?: boolean;
  backLabel?: string;
  /** Optional deterministic destination; otherwise inferred from the route tree. */
  backHref?: string;
  /** Optional in-place back behavior for screens rendered without a route change. */
  onBack?: () => void;
  /** Optional trailing control shown before the filter (left side in RTL). */
  action?: ReactNode;
};
