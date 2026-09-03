import { athletePlaceholderFeedSectionStyles } from "./AthletePlaceholderFeedSection.styles";
import type { AthletePlaceholderFeedSectionProps } from "./AthletePlaceholderFeedSection.types";

export function AthletePlaceholderFeedSection({
  count = 8,
}: AthletePlaceholderFeedSectionProps) {
  const styles = athletePlaceholderFeedSectionStyles();

  return (
    <div className={styles.root()}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={styles.item()} />
      ))}
    </div>
  );
}
