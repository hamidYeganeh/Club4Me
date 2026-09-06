export type DashboardAsideSectionProps = {
  greeting: string;
  name: string;
  location: string;
  readiness: string;
  goProTitle: string;
  goProOne: string;
  goProTwo: string;
  goProThree: string;
  calendarTitle: string;
  completed: string;
  skipped: string;
  challenge: string;
  heartLabel: string;
  heartValue: string;
  pressureLabel: string;
  pressureValue: string;
  oxygenLabel: string;
  oxygenValue: string;
  upcomingTitle: string;
  addLabel: string;
  exercises: Array<{
    title: string;
    meta: string;
    icon: "kettlebell" | "heart-wellness-1" | "barbell-horizontal";
  }>;
  goProHref?: string;
  addHref?: string;
};
