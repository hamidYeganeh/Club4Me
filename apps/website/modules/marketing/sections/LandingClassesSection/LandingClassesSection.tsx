"use client";

import { TextWithBrand } from "@modules/marketing/components/kit/LineShadowText";
import { Button } from "@heroui/react/button";
import { Typography } from "@heroui/react/typography";
import { ClubClassCard } from "@modules/marketing/components/cards/ClubClassCard";
import { useTranslations } from "next-intl";
import { LANDING_CLASSES } from "../../lib/landing-assets";
import { ClipReveal, InViewRise } from "../../lib/landing-reveal";
import { useLandingScroll } from "../../lib/landing-scroll";
import { landingClassesSectionStyles } from "./LandingClassesSection.styles";
import type { LandingClassesSectionProps } from "./LandingClassesSection.types";

export function LandingClassesSection({
  className,
}: LandingClassesSectionProps) {
  const t = useTranslations("MarketingLanding.landingClasses");
  const slots = landingClassesSectionStyles();
  const { scrollTo } = useLandingScroll();

  return (
    <section
      id="classes"
      className={slots.root({ className })}
      dir="rtl"
      lang="fa"
    >
      <header className={slots.header()}>
        <ClipReveal
          as="h2"
          className={slots.title()}
          mode="lines"
          text={t("title")}
        />
        <Typography className={slots.hint()} type="body">
          <TextWithBrand>{t("hint")}</TextWithBrand>
        </Typography>
      </header>

      <div className={slots.rail()}>
        {LANDING_CLASSES.map((item, index) => (
          <InViewRise delayIn={index * 90} fromY={28} key={item.id}>
            <ClubClassCard
              actionLabel={t("actionLabel")}
              author={item.author}
              backgroundImage={item.backgroundImage}
              backgroundImageAlt={item.title}
              category={item.category}
              className={slots.card()}
              date={item.date}
              duration={item.duration}
              onAction={() => scrollTo("#download")}
              size="md"
              title={item.title}
            />
          </InViewRise>
        ))}
      </div>

      <div className={slots.ctaWrap()}>
        <Button
          className={slots.cta()}
          size="lg"
          onPress={() => scrollTo("#download")}
        >
          {t("cta")}
        </Button>
      </div>
    </section>
  );
}
