export type ReservationsHeaderSectionProps = {
  title: string;
  backLabel: string;
  backHref: string;
  datesLabel: string;
  historyLabel: string;
  historyActive: boolean;
  onShowHistory: () => void;
  dates: Array<{
    key: string;
    weekday: string;
    day: string;
  }>;
  selectedDateKey: string;
  onSelectDate: (key: string) => void;
};
