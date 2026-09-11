import type { ReactNode } from "react";
import { Icon, type IconName } from "@theme/icon";
import styles from "./clarity.module.css";

export function VisualEmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: IconName;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className={styles.empty}>
      <div className={styles.orbit} aria-hidden="true">
        <span className={styles.symbol}>
          <Icon name={icon} size={30} />
        </span>
      </div>
      <h3 className={styles.emptyTitle}>{title}</h3>
      <p className={styles.emptyDescription}>{description}</p>
      {action ? <div className={styles.emptyAction}>{action}</div> : null}
    </div>
  );
}

export function ProgressMeter({
  value,
  max,
  label,
}: {
  value: number;
  max: number;
  label: string;
}) {
  const limit = Number.isFinite(max) && max > 0 ? max : 1;
  const current = Number.isFinite(value)
    ? Math.min(limit, Math.max(0, value))
    : 0;
  return (
    <div
      className={styles.progress}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={limit}
      aria-valuenow={current}
    >
      <span style={{ transform: `scaleX(${current / limit})` }} />
    </div>
  );
}

export { styles as clarityStyles };
