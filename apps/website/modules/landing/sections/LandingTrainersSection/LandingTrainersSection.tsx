import { Chip } from "@heroui/react";
import { Icon } from "@theme/icon";
import { getTranslations } from "next-intl/server";

import { ButtonLink } from "@/components/button-link";
import { CoverImage } from "@/components/cover-image";
import { Reveal } from "@/components/reveal";
import { media } from "@/lib/media";

import { landingTrainersSectionStyles } from "./LandingTrainersSection.styles";
import type { LandingSupportingTrainerId } from "./LandingTrainersSection.types";

const supportingTrainers: LandingSupportingTrainerId[] = ["arash", "sara", "kian"];

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
            <article className={styles.featuredCard()}>
              <div className={styles.featuredInner()}>
                <div className={styles.featuredMedia()}>
                  <CoverImage
                    src={media.trainers.niloofar.src}
                    alt={media.trainers.niloofar.alt}
                  />
                </div>
                <div className={styles.featuredBody()}>
                  <Chip color="accent" size="sm" variant="soft">
                    {t("landing.trainers.featured")}
                  </Chip>
                  <div>
                    <h3 className={styles.featuredName()}>
                      {t("landing.trainers.niloofar.name")}
                    </h3>
                    <p className={styles.featuredRole()}>
                      {t("landing.trainers.niloofar.role")}
                    </p>
                  </div>
                  <p className={styles.featuredBio()}>
                    {t("landing.trainers.niloofar.bio")}
                  </p>
                  <ButtonLink className="w-fit" href="#join">
                    {t("landing.cta")}
                    <span className={styles.ctaIcon()}>
                      <Icon name="arrow-forward-1" size="sm" />
                    </span>
                  </ButtonLink>
                </div>
              </div>
            </article>
          </Reveal>

          <div className={styles.list()}>
            {supportingTrainers.map((id, index) => (
              <Reveal key={id} delayMs={index * 90}>
                <article className={styles.item()}>
                  <div className={styles.itemMedia()}>
                    <CoverImage
                      src={media.trainers[id].src}
                      alt={media.trainers[id].alt}
                    />
                  </div>
                  <div className={styles.itemBody()}>
                    <h3 className={styles.itemName()}>
                      {t(`landing.trainers.${id}.name`)}
                    </h3>
                    <p className={styles.itemRole()}>
                      {t(`landing.trainers.${id}.role`)}
                    </p>
                    <p className={styles.itemBio()}>
                      {t(`landing.trainers.${id}.bio`)}
                    </p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
