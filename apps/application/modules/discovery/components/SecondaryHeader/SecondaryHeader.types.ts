import type { ReactNode } from "react";

export type SecondaryHeaderProps = {
  /** When set, replaces the location chip and enables the page layout. */
  title?: string;
  filterLabel?: string;
  onFilterPress?: () => void;
  showFilter?: boolean;
  showBack?: boolean;
  backLabel?: string;
  /** Optional trailing control shown before the filter (left side in RTL). */
  action?: ReactNode;
};
