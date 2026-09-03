import { Icon } from "@theme/icon";
import { getTranslations } from "next-intl/server";

import { ButtonLink } from "@/components/button-link";
import { CoverImage } from "@/components/cover-image";
import { Reveal } from "@/components/reveal";
import { media } from "@/lib/media";

import { landingHeroSectionStyles } from "./LandingHeroSection.styles";

export async function LandingHeroSection() {
  const styles = landingHeroSectionStyles();
  const t = await getTranslations();

  return (
    <section className={styles.root()}>
      <div aria-hidden className={styles.glow()} />

      <div className={styles.copy()}>
        <p className={styles.kicker()}>{t("landing.hero.kicker")}</p>
        <h1 className={styles.title()}>{t("landing.hero.title")}</h1>
        <p className={styles.subtitle()}>{t("landing.hero.subtitle")}</p>
        <div className={styles.actions()}>
          <ButtonLink size="lg" href="#join">
            {t("landing.cta")}
            <span className={styles.ctaIcon()}>
              <Icon name="arrow-forward-1" size="sm" />
            </span>
          </ButtonLink>
          <ButtonLink size="lg" variant="ghost" href="#trainers">
            {t("landing.seeTrainers")}
          </ButtonLink>
        </div>
      </div>

      <Reveal className={styles.media()}>
        <div className={styles.mediaFrame()}>
          <div className={styles.mediaInner()}>
            <CoverImage src={media.hero.src} alt={media.hero.alt} priority />
          </div>
        </div>
      </Reveal>
    </section>
  );
}
