import { ReminderCard } from "@ui/reminder-card";

import { athleteReminderSectionStyles } from "./AthleteReminderSection.styles";

export function AthleteReminderSection() {
  const styles = athleteReminderSectionStyles();

  return (
    <section className={styles.root()} aria-label="Reminder">
      <ReminderCard
        className="app-reveal"
        date="8 September, 2026"
        time="Monday, 08:00 - 08:30PM"
        joinedCount={26}
        interestedCount={18}
      />
    </section>
  );
}
