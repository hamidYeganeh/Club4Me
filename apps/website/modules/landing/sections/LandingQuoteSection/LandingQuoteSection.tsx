import { Icon } from "@theme/icon";
import { getTranslations } from "next-intl/server";

import { Reveal } from "@/components/reveal";

import { landingQuoteSectionStyles } from "./LandingQuoteSection.styles";

export async function LandingQuoteSection() {
  const styles = landingQuoteSectionStyles();
  const t = await getTranslations();

  return (
    <section className={styles.root()}>
      <Reveal className={styles.inner()}>
        <Icon name="quotes" size={40} className="text-accent" />
        <blockquote className={styles.quote()}>
          {t("landing.quote.text")}
        </blockquote>
        <footer className={styles.footer()}>
          <p className={styles.name()}>{t("landing.quote.name")}</p>
          <p className={styles.role()}>{t("landing.quote.role")}</p>
        </footer>
      </Reveal>
    </section>
  );
}
