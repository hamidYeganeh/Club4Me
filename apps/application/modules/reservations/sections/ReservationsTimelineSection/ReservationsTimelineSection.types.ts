import type { TimelineReservation } from "../../reservations.types";

export type ReservationsTimelineSectionProps = {
  title: string;
  newestFirstLabel: string;
  oldestFirstLabel: string;
  sortNewestFirst: boolean;
  onToggleSort: () => void;
  items: TimelineReservation[];
  isPending: boolean;
  emptyLabel: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  favoriteIds: ReadonlySet<string>;
  onToggleFavorite: (id: string) => void;
  onCancel: (id: string) => void;
  cancelPending: boolean;
  peopleLabel: (count: number) => string;
  durationLabel: (minutes: number) => string;
  statusLabel: (status: TimelineReservation["status"]) => string;
  favoriteLabel: string;
  unfavoriteLabel: string;
  cancelLabel: string;
};
