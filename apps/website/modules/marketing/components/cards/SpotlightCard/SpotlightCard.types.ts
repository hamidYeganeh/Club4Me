import type { HTMLAttributes, ReactNode } from "react";

export type SpotlightCardProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "title"
> & {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  value?: ReactNode;
  unit?: ReactNode;
  progress?: number;
  progressLabel?: string;
  actionLabel?: ReactNode;
  actionAriaLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
};
