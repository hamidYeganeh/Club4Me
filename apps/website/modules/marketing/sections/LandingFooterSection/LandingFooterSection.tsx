"use client";

import {
  BrandText,
  TextWithBrand,
} from "@modules/marketing/components/kit/LineShadowText";
import { Typography } from "@heroui/react/typography";
import { useTranslations } from "next-intl";
import { BrandMark, LandingPillButton } from "../../lib/landing-controls";
import { LandingEyebrow } from "../../lib/landing-ui";
import { ClipReveal, InViewRise } from "../../lib/landing-reveal";
import { useLandingScroll } from "../../lib/landing-scroll";
import { landingFooterSectionStyles } from "./LandingFooterSection.styles";
import type { LandingFooterSectionProps } from "./LandingFooterSection.types";

type FooterColumn = {
  title: string;
  links: { label: string; href: string }[];
};

export function LandingFooterSection({ className }: LandingFooterSectionProps) {
  const t = useTranslations("MarketingLanding.landingFooter");
  const slots = landingFooterSectionStyles();
  const { openContact, scrollTo } = useLandingScroll();
  const columns = t.raw("columns") as FooterColumn[];

  return (
    <footer id="contact" className={slots.root({ className })}>
      <div className={slots.ctaBand()}>
        <div>
          <LandingEyebrow tone="light">{t("eyebrow")}</LandingEyebrow>
          <ClipReveal
            as="p"
            mode="lines"
            text={t("ctaTitle")}
            className={slots.ctaTitle()}
          />
        </div>
        <InViewRise delayIn={150} fromY={20}>
          <LandingPillButton
            variant="light"
            onPress={() => scrollTo("#download")}
          >
            {t("downloadCta")}
          </LandingPillButton>
        </InViewRise>
      </div>

      <div className={slots.columns()}>
        <div className={slots.brandCol()}>
          <div className={slots.brandRow()}>
            <BrandMark size={22} instanceId="footer-brand" />
            <BrandText shadow="onBrand" />
          </div>
          <Typography type="body" className={slots.blurb()}>
            {t("blurb")}
          </Typography>
          <address className={slots.address()}>
            <a href="mailto:hello@gym4me.ir">hello@gym4me.ir</a>
            <br />
            <a href="/support">پشتیبانی</a>
            <br />
            <span className={slots.addrMuted()}>{t("location")}</span>
          </address>
        </div>

        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <Typography
              type="body-sm"
              weight="bold"
              className={slots.colTitle()}
            >
              {col.title}
            </Typography>
            <ul className={slots.colList()}>
              {col.links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      if (link.href === "#contact") {
                        openContact();
                        return;
                      }
                      scrollTo(link.href);
                    }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className={slots.bottom()}>
        <Typography type="body-sm">
          <TextWithBrand shadow="onBrand">{t("copyright")}</TextWithBrand>
        </Typography>
        <nav className={slots.social()} aria-label={t("socialAria")}>
          <a href="/support">پشتیبانی</a>
          <a href="/privacy">حریم خصوصی</a>
          <a href="/terms">شرایط استفاده</a>
          <a href="/account-deletion">حذف حساب</a>
        </nav>
        <nav className={slots.legal()} aria-label={t("legalAria")}>
          <a href="/privacy">{t("privacy")}</a>
          <a href="/terms">{t("terms")}</a>
        </nav>
      </div>
    </footer>
  );
}
