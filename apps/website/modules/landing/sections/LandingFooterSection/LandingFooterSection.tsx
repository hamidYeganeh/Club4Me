import { Icon } from "@theme/icon";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { landingFooterSectionStyles } from "./LandingFooterSection.styles";

export async function LandingFooterSection() {
  const styles = landingFooterSectionStyles();
  const t = await getTranslations();

  return (
    <footer className={styles.root()}>
      <div className={styles.grid()}>
        <div className={styles.brand()}>
          <div className={styles.brandRow()}>
            <span className={styles.brandMark()}>
              <Icon name="kettlebell" size="md" />
            </span>
            <span className={styles.brandName()} dir="ltr">
              {t("common.appName")}
            </span>
          </div>
          <p className={styles.tagline()}>{t("landing.footer.tagline")}</p>
        </div>

        <div className={styles.nav()}>
          <a href="#programs" className={styles.navLink()}>
            {t("nav.classes")}
          </a>
          <a href="#trainers" className={styles.navLink()}>
            {t("nav.trainers")}
          </a>
          <a href="#join" className={styles.navLink()}>
            {t("nav.membership")}
          </a>
          <Link href="/privacy" className={styles.navLink()}>
            حریم خصوصی
          </Link>
          <Link href="/terms" className={styles.navLink()}>
            قوانین استفاده
          </Link>
          <Link href="/account-deletion" className={styles.navLink()}>
            حذف حساب
          </Link>
          <Link href="/support" className={styles.navLink()}>
            پشتیبانی
          </Link>
        </div>

        <div className={styles.contact()}>
          <p className={styles.contactRow()}>
            <Icon name="map-pin-1" size="sm" className="text-accent" />
            {t("landing.footer.address")}
          </p>
          <a href="tel:+982191094040" className={styles.contactLink()}>
            <Icon name="telephone-1" size="sm" className="text-accent" />
            {t("landing.footer.phone")}
          </a>
          <a href="mailto:hello@gym4me.ir" className={styles.contactLink()}>
            <Icon name="envelope-1" size="sm" className="text-accent" />
            {t("landing.footer.email")}
          </a>
        </div>
      </div>
      <p className={styles.rights()}>{t("landing.footer.rights")}</p>
    </footer>
  );
}
