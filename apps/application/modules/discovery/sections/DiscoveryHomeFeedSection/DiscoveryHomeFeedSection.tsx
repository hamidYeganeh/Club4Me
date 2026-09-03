import { discoveryHomeFeedSectionStyles } from "./DiscoveryHomeFeedSection.styles";
import type { DiscoveryHomeFeedSectionProps } from "./DiscoveryHomeFeedSection.types";

export function DiscoveryHomeFeedSection({
  count = 8,
}: DiscoveryHomeFeedSectionProps) {
  const styles = discoveryHomeFeedSectionStyles();

  return (
    <div className={styles.root()}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={styles.item()} />
      ))}
    </div>
  );
}
