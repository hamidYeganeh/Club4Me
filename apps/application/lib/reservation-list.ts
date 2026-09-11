export type ReservationListMode = "upcoming" | "date" | "history";
type ReservationListItem = {
  sessionStartsAt: string;
  sessionEndsAt: string;
  status: string;
  source?: string;
};

export function filterReservationList<T extends ReservationListItem>(
  items: T[],
  mode: ReservationListMode,
  selectedDateKey: string,
  now: number,
) {
  const dayStart = new Date(`${selectedDateKey}T00:00:00`).getTime();
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  return items.filter((item) => {
    if (mode === "history") return true;
    const start = new Date(item.sessionStartsAt).getTime();
    const end = new Date(item.sessionEndsAt).getTime();
    if (mode === "upcoming") return item.status === "reserved" && end > now;
    // A multi-session course stays visible throughout its enrollment period.
    return start < dayEnd.getTime() && end > dayStart;
  });
}
