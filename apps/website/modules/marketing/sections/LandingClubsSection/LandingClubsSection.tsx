"use client";

import { TextWithBrand } from "@modules/marketing/components/kit/LineShadowText";
import { Typography } from "@heroui/react/typography";
import { ClubCard } from "@modules/marketing/components/cards/ClubCard";
import { useTranslations } from "next-intl";
import { LANDING_CLUBS } from "../../lib/landing-assets";
import { ClipReveal, InViewRise } from "../../lib/landing-reveal";
import { useLandingScroll } from "../../lib/landing-scroll";
import { landingClubsSectionStyles } from "./LandingClubsSection.styles";
import type { LandingClubsSectionProps } from "./LandingClubsSection.types";

export function LandingClubsSection({ className }: LandingClubsSectionProps) {
  const t = useTranslations("MarketingLanding.landingClubs");
  const shared = useTranslations("MarketingLanding.shared");
  const slots = landingClubsSectionStyles();
  const { scrollTo } = useLandingScroll();

  return (
    <section id="clubs" className={slots.root({ className })}>
      <ClipReveal
        id="clubs-title"
        as="h2"
        mode="lines"
        text={t("title")}
        className={slots.title()}
      />
      <Typography type="body" className={slots.hint()}>
        <TextWithBrand>{t("hint")}</TextWithBrand>
      </Typography>
      <div className={slots.grid()}>
        {LANDING_CLUBS.slice(0, 4).map((club, i) => (
          <InViewRise
            className={slots.card()}
            delayIn={i * 90}
            fromY={26}
            key={club.title}
          >
            <ClubCard
              actionLabel={shared("viewAction")}
              className="w-full max-w-none"
              features={[...club.features]}
              image={club.image}
              imageAlt={club.title}
              onAction={() => scrollTo("#download")}
              orientation="vertical"
              price={club.price}
              pricePrefix={shared("pricePrefix")}
              priceSuffix={shared("priceSuffix")}
              rating={club.rating}
              ratingCount={club.ratingCount}
              subtitle={club.subtitle}
              title={club.title}
            />
          </InViewRise>
        ))}
      </div>
    </section>
  );
}
