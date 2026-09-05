import { Icon } from "@repo/theme/icon";

import { reminderCardStyles } from "./reminder-card.styles";
import type { ReminderCardProps } from "./reminder-card.types";

export function ReminderCard({
  date,
  time,
  meta,
  icon = "calendar-1",
  href,
  onPress,
  className,
}: ReminderCardProps) {
  const isInteractive = Boolean(href || onPress);
  const styles = reminderCardStyles({ interactive: isInteractive });
  const label = `${date}. ${time}. ${meta}`;

  const body = (
    <>
      <span className={styles.iconBox()} aria-hidden>
        <Icon name={icon} size={24} className={styles.icon()} />
      </span>

      <span className={styles.content()}>
        <span className={styles.date()}>{date}</span>
        <span className={styles.time()}>{time}</span>
        <span className={styles.meta()}>{meta}</span>
      </span>

      <Icon name="chevron-right" size={20} className={styles.chevron()} />
    </>
  );

  if (href) {
    return (
      <a href={href} className={styles.root({ className })} aria-label={label}>
        {body}
      </a>
    );
  }

  if (onPress) {
    return (
      <button
        type="button"
        onClick={onPress}
        className={styles.root({ className })}
        aria-label={label}
      >
        {body}
      </button>
    );
  }

  return (
    <div className={styles.root({ className })} aria-label={label}>
      {body}
    </div>
  );
}
