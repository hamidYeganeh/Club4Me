export type ReservationsHeaderSectionProps = {
  title: string;
  backLabel: string;
  backHref: string;
  datesLabel: string;
  dates: Array<{
    key: string;
    weekday: string;
    day: string;
  }>;
  selectedDateKey: string;
  onSelectDate: (key: string) => void;
};
