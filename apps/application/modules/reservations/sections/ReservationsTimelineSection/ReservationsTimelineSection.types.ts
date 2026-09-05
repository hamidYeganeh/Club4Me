import type { TimelineReservation } from "../../reservations.types";

export type ReservationsTimelineSectionProps = {
  title: string;
  newestFirstLabel: string;
  oldestFirstLabel: string;
  sortNewestFirst: boolean;
  onToggleSort: () => void;
  items: TimelineReservation[];
  historyMode: boolean;
  isPending: boolean;
  error?: unknown;
  onRetry?: () => void;
  emptyTitle: string;
  emptyDescription: string;
  exploreLabel: string;
  exploreHref: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  renewLabel: string;
  onRenew: (item: TimelineReservation) => void;
  onCancel: (id: string) => void;
  cancelPending: boolean;
  peopleLabel: (count: number) => string;
  durationLabel: (minutes: number) => string;
  statusLabel: (status: TimelineReservation["status"]) => string;
  cancelLabel: string;
};
