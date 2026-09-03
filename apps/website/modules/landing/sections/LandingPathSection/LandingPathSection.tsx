import { Icon } from "@theme/icon";
import { getTranslations } from "next-intl/server";

import { Reveal } from "@/components/reveal";

import { landingPathSectionStyles } from "./LandingPathSection.styles";
import type { LandingPathStep } from "./LandingPathSection.types";

const steps: LandingPathStep[] = [
  { id: "plan", icon: "calendar-check" },
  { id: "meet", icon: "whistle" },
  { id: "train", icon: "person-running" },
];

export async function LandingPathSection() {
  const styles = landingPathSectionStyles();
  const t = await getTranslations();

  return (
    <section className={styles.root()}>
      <div className={styles.inner()}>
        <Reveal>
          <h2 className={styles.title()}>{t("landing.path.title")}</h2>
        </Reveal>

        <ol className={styles.list()}>
          {steps.map((step, index) => (
            <Reveal key={step.id} delayMs={index * 90} className={styles.item()}>
              <li className={styles.card()}>
                <span className={styles.icon()}>
                  <Icon name={step.icon} size="lg" />
                </span>
                <h3 className={styles.heading()}>
                  {t(`landing.path.${step.id}Title`)}
                </h3>
                <p className={styles.copy()}>
                  {t(`landing.path.${step.id}Body`)}
                </p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
