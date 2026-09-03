import { Typography } from "@heroui/react";
import { ThemeToggle } from "@theme/theme-toggle";

import { athleteScreenHeaderSectionStyles } from "./AthleteScreenHeaderSection.styles";
import type { AthleteScreenHeaderSectionProps } from "./AthleteScreenHeaderSection.types";

export function AthleteScreenHeaderSection({
  title,
}: AthleteScreenHeaderSectionProps) {
  const styles = athleteScreenHeaderSectionStyles();

  return (
    <div className={styles.root()}>
      <Typography type="h4" className={styles.title()}>{title}</Typography>
      <ThemeToggle />
    </div>
  );
}
