import type { ReactNode } from "react";
import { ArrowLeft, Check, Dumbbell } from "lucide-react";
import styles from "./feature-cards.module.css";

/** Reference card vocabulary shared by discovery, training, and progress. */
export function FeatureBadge({ children }: { children: ReactNode }) {
  return <span className={styles.badge}>{children}</span>;
}

export function CardArrow() {
  return <span className={styles.arrow} aria-hidden="true"><ArrowLeft size={20} className="ltr:rotate-180" /></span>;
}

export function ExerciseRow({ title, detail, index, complete }: {
  title: string; detail: ReactNode; index: number; complete?: boolean;
}) {
  return (
    <div className={styles.exerciseRow}>
      <span className={styles.exerciseIcon} aria-hidden="true">
        {complete ? <Check size={20} /> : <Dumbbell size={20} />}
      </span>
      <div className="min-w-0 flex-1">
        <span className={styles.eyebrow}>حرکت {index.toLocaleString("fa-IR")}</span>
        <p className={styles.title}>{title}</p>
        <div className={styles.detail}>{detail}</div>
      </div>
    </div>
  );
}

/** Every bar represents an actual value; no decorative/fabricated health data. */
export function HistoryBars({ values, label }: { values: number[]; label: string }) {
  const max = Math.max(1, ...values);
  return (
    <div className={styles.bars} role="img" aria-label={label}>
      {values.map((value, index) => (
        <span key={index} style={{ height: `${Math.max(5, value / max * 100)}%`, opacity: value > 0 ? 1 : 0.2 }} />
      ))}
    </div>
  );
}

export { styles as featureCardStyles };
