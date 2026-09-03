import { getTranslations } from "next-intl/server";

import { Reveal } from "@/components/reveal";

import { landingStatsSectionStyles } from "./LandingStatsSection.styles";

export async function LandingStatsSection() {
  const styles = landingStatsSectionStyles();
  const t = await getTranslations();

  const items = [
    {
      value: t("landing.stats.membersValue"),
      label: t("landing.stats.membersLabel"),
    },
    {
      value: t("landing.stats.trainersValue"),
      label: t("landing.stats.trainersLabel"),
    },
    {
      value: t("landing.stats.classesValue"),
      label: t("landing.stats.classesLabel"),
    },
  ];

  return (
    <section className={styles.root()}>
      <div className={styles.grid()}>
        {items.map((item, index) => (
          <Reveal key={item.label} delayMs={index * 80} className={styles.item()}>
            <p className={styles.value()}>{item.value}</p>
            <p className={styles.label()}>{item.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
