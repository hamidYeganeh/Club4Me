import { ThemeToggle } from "@theme/theme-toggle";

import { discoveryHomeHeaderSectionStyles } from "./DiscoveryHomeHeaderSection.styles";
import type { DiscoveryHomeHeaderSectionProps } from "./DiscoveryHomeHeaderSection.types";

export function DiscoveryHomeHeaderSection({
  title,
}: DiscoveryHomeHeaderSectionProps) {
  const styles = discoveryHomeHeaderSectionStyles();

  return (
    <div className={styles.root()}>
      <h1 className={styles.title()}>{title}</h1>
      <ThemeToggle />
    </div>
  );
}
