export type DashboardAsideItem = {
  title: string;
  meta: string;
  icon: "kettlebell" | "heart" | "boxing" | "weight";
};

export type DashboardAsideSectionProps = {
  name: string;
  role: string;
  location: string;
  age: string;
  clubs: string;
  upcomingTitle: string;
  items: DashboardAsideItem[];
  addLabel: string;
};
