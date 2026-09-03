import { ThemeToggle } from "@theme/theme-toggle";

import { athleteScreenHeaderSectionStyles } from "./AthleteScreenHeaderSection.styles";
import type { AthleteScreenHeaderSectionProps } from "./AthleteScreenHeaderSection.types";

export function AthleteScreenHeaderSection({
  title,
}: AthleteScreenHeaderSectionProps) {
  const styles = athleteScreenHeaderSectionStyles();

  return (
    <div className={styles.root()}>
      <h1 className={styles.title()}>{title}</h1>
      <ThemeToggle />
    </div>
  );
}
