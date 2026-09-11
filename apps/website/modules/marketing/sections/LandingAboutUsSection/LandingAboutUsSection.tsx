"use client";
import { CoverImage } from "@/components/cover-image";

import { Avatar } from "@heroui/react/avatar";
import { Button } from "@heroui/react/button";
import { Typography } from "@heroui/react/typography";
import { ArrowRight } from "@modules/marketing/icons/icons/ArrowRight";
import { BarbellHorizontal } from "@modules/marketing/icons/icons/BarbellHorizontal";
import { Check } from "@modules/marketing/icons/icons/Check";
import { motion, useReducedMotion } from "@ui/landing-motion";
import { useTranslations } from "next-intl";
import { LANDING_ASSETS } from "../../lib/landing-assets";
import { landingReveal } from "../../lib/landing-motion";
import { useLandingScroll } from "../../lib/landing-scroll";
import { landingAboutUsSectionStyles } from "./LandingAboutUsSection.styles";
import type {
  LandingAboutUsReviewer,
  LandingAboutUsSectionProps,
} from "./LandingAboutUsSection.types";

const REVIEWERS: LandingAboutUsReviewer[] = LANDING_ASSETS.coaches
  .slice(0, 3)
  .map((coach) => ({
    src: coach.src,
    alt: coach.name,
    fallback: coach.name.slice(0, 1),
  }));

export function LandingAboutUsSection({
  className,
}: LandingAboutUsSectionProps) {
  const t = useTranslations("MarketingLanding.landingAboutUs");
  const slots = landingAboutUsSectionStyles();
  const reduce = useReducedMotion();
  const { scrollTo } = useLandingScroll();
  const paragraphs = t.raw("paragraphs") as string[];
  const startPortrait = {
    src: LANDING_ASSETS.coaches[0].src,
    alt: LANDING_ASSETS.coaches[0].alt,
  };
  const endPortrait = {
    src: LANDING_ASSETS.facilities.clay,
    alt: t("endPortraitAlt"),
  };

  return (
    <section
      id="about"
      className={slots.root({ className })}
      dir="rtl"
      lang="fa"
    >
      <motion.div
        className={slots.inner()}
        initial={reduce ? false : { opacity: 0, y: 20 }}
        transition={{ ...landingReveal(), duration: 0.8 }}
        viewport={{ once: true }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        <header className={slots.header()}>
          <motion.div
            className={slots.labelRow()}
            initial={reduce ? false : { opacity: 0, scale: 0.9 }}
            transition={{ ...landingReveal(0.2), duration: 0.5 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, scale: 1 }}
          >
            <span aria-hidden className={slots.labelChip()}>
              <BarbellHorizontal size={14} />
            </span>
            <Typography className={slots.label()} type="body-xs">
              {t("label")}
            </Typography>
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 20 }}
            transition={{ ...landingReveal(0.3), duration: 0.6 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <Typography className={slots.title()} type="h2" weight="bold">
              {t("title")}
            </Typography>
          </motion.div>
        </header>

        <div className={slots.columns()}>
          <motion.div
            className={slots.startCol()}
            initial={reduce ? false : { opacity: 0, x: 30 }}
            transition={landingReveal(0.4)}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, x: 0 }}
          >
            <CoverImage
              alt={startPortrait.alt}
              className={slots.startImage()}
              src={startPortrait.src}
            />
          </motion.div>

          <motion.div
            className={slots.middleCol()}
            initial={reduce ? false : { opacity: 0, y: 30 }}
            transition={landingReveal(0.5)}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <div className={slots.statRow()}>
              <Typography className={slots.statValue()} type="h2" weight="bold">
                {t("statValue")}
              </Typography>
              <div className={slots.statMeta()}>
                <Typography className={slots.statLine()} type="body-sm">
                  {t("statLineOne")}
                </Typography>
                <Typography className={slots.statLine()} type="body-sm">
                  {t("statLineTwo")}
                </Typography>
              </div>
            </div>

            <div className={slots.divider()} />

            <div className={slots.copy()}>
              {paragraphs.map((text) => (
                <Typography
                  className={slots.paragraph()}
                  key={text}
                  type="body"
                >
                  {text}
                </Typography>
              ))}
            </div>

            <div className={slots.ctaRow()}>
              <Button
                className={slots.cta()}
                onPress={() => scrollTo("#download")}
              >
                <span className={slots.ctaLabel()}>{t("cta")}</span>
                <span aria-hidden className={slots.ctaChip()}>
                  <ArrowRight size={16} />
                </span>
              </Button>

              <div className={slots.reviews()}>
                <div className={slots.avatars()}>
                  {REVIEWERS.map((reviewer, index) => (
                    <Avatar
                      className={slots.avatar({
                        className:
                          index > 0 ? slots.avatarOverlap() : undefined,
                      })}
                      key={reviewer.src}
                    >
                      <Avatar.Image alt={reviewer.alt} src={reviewer.src} />
                      <Avatar.Fallback>{reviewer.fallback}</Avatar.Fallback>
                    </Avatar>
                  ))}
                </div>
                <div className={slots.reviewMeta()}>
                  <span
                    aria-label={t("starsAria")}
                    className={slots.stars()}
                    role="img"
                  >
                    {Array.from({ length: 3 }, (_, index) => (
                      <Check aria-hidden key={index} size={15} />
                    ))}
                  </span>
                  <Typography className={slots.reviewCount()} type="body-xs">
                    {t("reviewCount")}
                  </Typography>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className={slots.endCol()}
            initial={reduce ? false : { opacity: 0, x: -30 }}
            transition={landingReveal(0.6)}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, x: 0 }}
          >
            <CoverImage
              alt={endPortrait.alt}
              className={slots.endImage()}
              src={endPortrait.src}
            />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
