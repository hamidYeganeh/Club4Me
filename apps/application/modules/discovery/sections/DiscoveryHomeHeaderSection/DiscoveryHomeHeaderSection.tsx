import { Typography } from "@heroui/react";
import { ThemeToggle } from "@theme/theme-toggle";
import { ActiveLocationSelector } from "@modules/locations/components/ActiveLocationSelector";

import { discoveryHomeHeaderSectionStyles } from "./DiscoveryHomeHeaderSection.styles";
import type { DiscoveryHomeHeaderSectionProps } from "./DiscoveryHomeHeaderSection.types";

export function DiscoveryHomeHeaderSection({
  title,
}: DiscoveryHomeHeaderSectionProps) {
  const styles = discoveryHomeHeaderSectionStyles();

  return (
    <div className={styles.root()}>
      <div>
        <Typography type="h4" className={styles.title()}>{title}</Typography>
        <div className="mt-2">
          <ActiveLocationSelector />
        </div>
      </div>
      <ThemeToggle />
    </div>
  );
}
