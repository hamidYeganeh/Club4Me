import { getTranslations } from "next-intl/server";
import { CoachCard } from "@ui/coach-card";

import { Reveal } from "@/components/reveal";
import { media } from "@/lib/media";

import { landingTrainersSectionStyles } from "./LandingTrainersSection.styles";
import type { LandingSupportingTrainerId } from "./LandingTrainersSection.types";

const supportingTrainers: LandingSupportingTrainerId[] = [
  "arash",
  "sara",
  "kian",
];

export async function LandingTrainersSection() {
  const styles = landingTrainersSectionStyles();
  const t = await getTranslations();

  return (
    <section id="trainers" className={styles.root()}>
      <div className={styles.inner()}>
        <Reveal>
          <h2 className={styles.title()}>{t("landing.trainers.title")}</h2>
        </Reveal>

        <div className={styles.grid()}>
          <Reveal className={styles.featured()}>
            <CoachCard
              type="normal"
              className={styles.featuredCard()}
              title={t("landing.trainers.niloofar.name")}
              supportingText={t("landing.trainers.niloofar.role")}
              imageUrl={media.trainers.niloofar.src}
              imageAlt={media.trainers.niloofar.alt}
              badge={t("landing.trainers.featured")}
              rating={4.8}
              reviewsCount={128}
              stats={[
                { id: "role", label: t("landing.trainers.niloofar.role") },
              ]}
              href="#join"
            />
          </Reveal>

          <div className={styles.list()}>
            {supportingTrainers.map((id, index) => (
              <Reveal key={id} delayMs={index * 90}>
                <CoachCard
                  type="compact"
                  className={styles.item()}
                  title={t(`landing.trainers.${id}.name`)}
                  imageUrl={media.trainers[id].src}
                  imageAlt={media.trainers[id].alt}
                  meta={[t(`landing.trainers.${id}.role`)]}
                  authorName={t(`landing.trainers.${id}.name`)}
                  authorAvatarUrl={media.trainers[id].src}
                  href="#join"
                />
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
