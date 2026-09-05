import type { ButtonProps } from "@heroui/react/button";
import type { HTMLAttributes, ReactNode } from "react";

/** Lifecycle of a setup / checklist row — not a boolean. */
export type TodoCardItemStatus = "completed" | "pending";

export type TodoCardItem = {
  id: string;
  label: ReactNode;
  status: TodoCardItemStatus;
  /** When set, the pending row is pressable (e.g. navigate to finish the step). */
  onPress?: ButtonProps["onPress"];
};

export type TodoCardProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "title" | "children"
> & {
  /** Small uppercase step indicator (e.g. "STEP 3 OF 4"). */
  stepLabel: ReactNode;
  /** Main heading under the step label. */
  title: ReactNode;
  /** Dynamic checklist rows; progress segments follow `items.length`. */
  items: TodoCardItem[];
  /** Accessible name for the segmented progress bar. */
  progressLabel?: string;
};
