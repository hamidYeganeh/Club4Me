"use client";
import { CoverImage } from "@/components/cover-image";

import { Typography } from "@heroui/react/typography";
import { TextWithBrand } from "@modules/marketing/components/kit/LineShadowText";
import { motion, useReducedMotion, type Variants } from "@ui/landing-motion";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { LANDING_ASSETS } from "../../lib/landing-assets";
import { landingTestimonialsSectionStyles } from "./LandingTestimonialsSection.styles";
import type {
  LandingOrbitCard,
  LandingTestimonialsSectionProps,
} from "./LandingTestimonialsSection.types";

const PHOTO_IMAGES = [
  LANDING_ASSETS.hero,
  LANDING_ASSETS.collection[1].src,
  LANDING_ASSETS.facilities.clay,
] as const;

const QUOTE_AVATARS = [
  LANDING_ASSETS.coaches[1].src,
  LANDING_ASSETS.coaches[0].src,
  LANDING_ASSETS.coaches[2].src,
] as const;

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

type TestimonialQuote = {
  content: string;
  authorName: string;
  authorRole: string;
};

export function LandingTestimonialsSection({
  className,
}: LandingTestimonialsSectionProps) {
  const t = useTranslations("MarketingLanding.landingTestimonials");
  const slots = landingTestimonialsSectionStyles();
  const reduceMotion = useReducedMotion();
  const photoReviews = t.raw("photoReviews") as string[];
  const photoAlts = t.raw("photoAlts") as string[];
  const quotes = t.raw("quotes") as TestimonialQuote[];

  const orbitCards = useMemo((): LandingOrbitCard[] => {
    return [
      {
        kind: "photo",
        imageSrc: PHOTO_IMAGES[0],
        imageAlt: photoAlts[0]!,
        review: photoReviews[0]!,
      },
      {
        kind: "quote",
        theme: "lime",
        quote: quotes[0]!.content,
        authorName: quotes[0]!.authorName,
        authorRole: quotes[0]!.authorRole,
        avatarSrc: QUOTE_AVATARS[0]!,
      },
      {
        kind: "photo",
        imageSrc: PHOTO_IMAGES[1],
        imageAlt: photoAlts[1]!,
        review: photoReviews[1]!,
      },
      {
        kind: "quote",
        theme: "dark",
        quote: quotes[1]!.content,
        authorName: quotes[1]!.authorName,
        authorRole: quotes[1]!.authorRole,
        avatarSrc: QUOTE_AVATARS[1]!,
      },
      {
        kind: "photo",
        imageSrc: PHOTO_IMAGES[2],
        imageAlt: photoAlts[2]!,
        review: photoReviews[2]!,
      },
      {
        kind: "quote",
        theme: "dark",
        quote: quotes[2]!.content,
        authorName: quotes[2]!.authorName,
        authorRole: quotes[2]!.authorRole,
        avatarSrc: QUOTE_AVATARS[2]!,
      },
    ];
  }, [photoAlts, photoReviews, quotes]);

  return (
    <section id="testimonials" className={slots.root({ className })}>
      <div className={slots.container()}>
        <motion.header
          className={slots.header()}
          initial={reduceMotion ? false : { y: -20, opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
          whileInView={reduceMotion ? undefined : { y: 0, opacity: 1 }}
        >
          <div className={slots.labelRow()}>
            <span aria-hidden className={slots.darkCircle()}>
              <span className={slots.limeDot()}>•</span>
            </span>
            <Typography className={slots.labelText()} type="body-sm">
              {t("label")}
            </Typography>
          </div>
          <Typography className={slots.bigHeading()} type="h2" weight="bold">
            {t("heading")}
          </Typography>
        </motion.header>

        <motion.div
          className={slots.grid()}
          initial={reduceMotion ? false : "hidden"}
          variants={reduceMotion ? undefined : containerVariants}
          viewport={{ once: true, margin: "-100px" }}
          whileInView={reduceMotion ? undefined : "visible"}
        >
          {orbitCards.map((card) =>
            card.kind === "photo" ? (
              <motion.article
                className={slots.card({ className: slots.photoCard() })}
                key={card.review}
                variants={reduceMotion ? undefined : itemVariants}
              >
                <CoverImage
                  alt={card.imageAlt}
                  className={slots.photoImg()}
                  src={card.imageSrc}
                />
                <div className={slots.reviewOverlay()}>
                  <div aria-hidden className={slots.reviewStars()}>
                    ★★★★★
                  </div>
                  <Typography className={slots.reviewText()} type="body-sm">
                    {card.review}
                  </Typography>
                </div>
              </motion.article>
            ) : (
              <motion.article
                className={slots.testimonialCard({
                  className:
                    card.theme === "lime" ? slots.limeCard() : slots.darkCard(),
                })}
                key={card.authorName}
                variants={reduceMotion ? undefined : itemVariants}
              >
                <div
                  aria-hidden
                  className={slots.quoteIconBox({
                    className:
                      card.theme === "lime"
                        ? slots.quoteIconLime()
                        : slots.quoteIconDark(),
                  })}
                >
                  <span
                    className={slots.quoteMark({
                      className:
                        card.theme === "lime"
                          ? slots.quoteMarkLime()
                          : slots.quoteMarkDark(),
                    })}
                  >
                    ↗
                  </span>
                </div>
                <Typography
                  className={slots.quoteText({
                    className:
                      card.theme === "lime"
                        ? slots.quoteTextLime()
                        : slots.quoteTextDark(),
                  })}
                  type="body"
                >
                  <TextWithBrand shadow="onBrand">{card.quote}</TextWithBrand>
                </Typography>
                <div className={slots.authorRow()}>
                  <CoverImage
                    alt=""
                    className={slots.avatar({
                      className:
                        card.theme === "lime"
                          ? slots.avatarLime()
                          : slots.avatarDark(),
                    })}
                    src={card.avatarSrc}
                  />
                  <div className={slots.authorMeta()}>
                    <Typography
                      className={slots.authorName({
                        className:
                          card.theme === "lime"
                            ? slots.authorNameLime()
                            : slots.authorNameDark(),
                      })}
                      type="body-sm"
                      weight="semibold"
                    >
                      <TextWithBrand shadow="onBrand">
                        {card.authorName}
                      </TextWithBrand>
                    </Typography>
                    <Typography
                      className={slots.authorRole({
                        className:
                          card.theme === "lime"
                            ? slots.authorRoleLime()
                            : slots.authorRoleDark(),
                      })}
                      type="body-xs"
                    >
                      {card.authorRole}
                    </Typography>
                  </div>
                </div>
              </motion.article>
            ),
          )}
        </motion.div>
      </div>
    </section>
  );
}
