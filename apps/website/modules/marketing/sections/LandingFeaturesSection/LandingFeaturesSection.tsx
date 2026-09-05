"use client";
import { CoverImage } from "@/components/cover-image";

import { TextWithBrand } from "@modules/marketing/components/kit/LineShadowText";
import { Button } from "@heroui/react/button";
import { Typography } from "@heroui/react/typography";
import { ArrowRight } from "@modules/marketing/icons/icons/ArrowRight";
import { Check } from "@modules/marketing/icons/icons/Check";
import { ClubCard } from "@modules/marketing/components/cards/ClubCard";
import { useTranslations } from "next-intl";
import { LANDING_ASSETS, LANDING_CLUBS } from "../../lib/landing-assets";
import { useLandingScroll } from "../../lib/landing-scroll";
import { landingFeaturesSectionStyles } from "./LandingFeaturesSection.styles";
import type { LandingFeaturesSectionProps } from "./LandingFeaturesSection.types";

const MOCKUP_CLUB = LANDING_CLUBS[1]!;

function CheckRow({
  label,
  iconClassName,
  rowClassName,
  labelClassName,
}: {
  label: string;
  iconClassName: string;
  rowClassName: string;
  labelClassName: string;
}) {
  return (
    <div className={rowClassName}>
      <Check size={18} className={iconClassName} aria-hidden />
      <span className={labelClassName}>{label}</span>
    </div>
  );
}

export function LandingFeaturesSection({
  className,
}: LandingFeaturesSectionProps) {
  const t = useTranslations("MarketingLanding.landingFeatures");
  const shared = useTranslations("MarketingLanding.shared");
  const slots = landingFeaturesSectionStyles();
  const { scrollTo } = useLandingScroll();
  const quoteAuthor = LANDING_ASSETS.coaches[1]!;
  const portrait = LANDING_ASSETS.coaches[0]!;
  const checklist = t.raw("checklist") as string[];

  return (
    <section
      id="features"
      className={slots.root({ className })}
      dir="rtl"
      lang="fa"
    >
      <div className={slots.inner()}>
        <div className={slots.bento()}>
          <div className={slots.heroCard()}>
            <CoverImage
              src={LANDING_ASSETS.hero}
              alt={t("heroImageAlt")}
              className={slots.heroImg()}
            />
            <div className={slots.mockup()}>
              <div className={slots.chrome()} aria-hidden>
                <span className={slots.trafficClose()} />
                <span className={slots.trafficMin()} />
                <span className={slots.trafficMax()} />
              </div>
              <div className={slots.mockupStage()}>
                <ClubCard
                  actionLabel={shared("viewAction")}
                  className={slots.mockupClub()}
                  features={[...MOCKUP_CLUB.features]}
                  image={MOCKUP_CLUB.image}
                  imageAlt={MOCKUP_CLUB.title}
                  onAction={() => scrollTo("#clubs")}
                  orientation="vertical"
                  price={MOCKUP_CLUB.price}
                  pricePrefix={shared("pricePrefix")}
                  priceSuffix={shared("priceSuffix")}
                  rating={MOCKUP_CLUB.rating}
                  ratingCount={MOCKUP_CLUB.ratingCount}
                  subtitle={MOCKUP_CLUB.subtitle}
                  title={MOCKUP_CLUB.title}
                />
              </div>
            </div>
          </div>

          <blockquote className={slots.quoteCard()}>
            <Typography className={slots.quote()} type="body" weight="medium">
              <TextWithBrand>{t("quote")}</TextWithBrand>
            </Typography>
            <footer className={slots.authorRow()}>
              <CoverImage
                src={quoteAuthor.src}
                alt={quoteAuthor.name}
                className={slots.avatar()}
              />
              <div>
                <Typography
                  className={slots.authorName()}
                  type="body-sm"
                  weight="semibold"
                >
                  {quoteAuthor.name}
                </Typography>
                <Typography className={slots.authorRole()} type="body-xs">
                  {quoteAuthor.role}
                </Typography>
              </div>
            </footer>
          </blockquote>

          <div className={slots.portraitCard()}>
            <CoverImage
              src={portrait.src}
              alt={portrait.alt}
              className={slots.portraitImg()}
            />
          </div>
        </div>

        <div className={slots.content()}>
          <Typography className={slots.heading()} type="h2" weight="medium">
            {t("heading")
              .split("\n")
              .map((line, index, lines) => (
                <span key={line}>
                  {line}
                  {index < lines.length - 1 ? <br /> : null}
                </span>
              ))}
          </Typography>
          <Typography className={slots.body()} type="body">
            {t("body")}
          </Typography>
          <div className={slots.actions()}>
            <Button
              className={slots.primaryBtn()}
              onPress={() => scrollTo("#download")}
              size="lg"
              variant="primary"
            >
              {t("primaryCta")}
              <span className={slots.primaryChip()} aria-hidden>
                <ArrowRight size={18} />
              </span>
            </Button>
            <Button
              className={slots.secondaryBtn()}
              onPress={() => scrollTo("#clubs")}
              size="lg"
              variant="secondary"
            >
              {t("secondaryCta")}
            </Button>
          </div>
          <div className={slots.checklist()}>
            {checklist.map((label) => (
              <CheckRow
                key={label}
                label={label}
                iconClassName={slots.checkIcon()}
                rowClassName={slots.checkRow()}
                labelClassName={slots.checkLabel()}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
