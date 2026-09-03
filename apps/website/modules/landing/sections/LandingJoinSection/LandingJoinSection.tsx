import { Icon } from "@theme/icon";
import { getTranslations } from "next-intl/server";

import { ButtonLink } from "@/components/button-link";
import { Reveal } from "@/components/reveal";

import { landingJoinSectionStyles } from "./LandingJoinSection.styles";

export async function LandingJoinSection() {
  const styles = landingJoinSectionStyles();
  const t = await getTranslations();

  return (
    <section id="join" className={styles.root()}>
      <Reveal>
        <div className={styles.card()}>
          <h2 className={styles.title()}>{t("landing.join.title")}</h2>
          <p className={styles.subtitle()}>{t("landing.join.subtitle")}</p>
          <ButtonLink
            size="lg"
            href="mailto:hello@club4me.ir"
            className={styles.cta()}
          >
            {t("landing.cta")}
            <span className={styles.ctaIcon()}>
              <Icon name="arrow-forward-1" size="sm" />
            </span>
          </ButtonLink>
        </div>
      </Reveal>
    </section>
  );
}
