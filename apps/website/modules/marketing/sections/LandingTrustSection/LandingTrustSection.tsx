"use client";

import { observeScrollProgress } from "../../lib/scroll-progress";
import { Typography } from "@heroui/react/typography";
import { CoachFeatureCard } from "@modules/marketing/components/cards/CoachFeatureCard";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCatalogCoaches } from "@api/discovery";
import { CatalogStatus } from "../../components/CatalogStatus";
import { LANDING_ASSETS } from "../../lib/landing-assets";
import { LandingArrowButton } from "../../lib/landing-controls";
import { CarouselDots, ClipReveal, InViewRise } from "../../lib/landing-reveal";

import { landingTrustSectionStyles } from "./LandingTrustSection.styles";
import type { LandingTrustSectionProps } from "./LandingTrustSection.types";

export function LandingTrustSection({ className }: LandingTrustSectionProps) {
  const t = useTranslations("MarketingLanding.trust");
  const coachCopy = useTranslations("MarketingLanding.coachDemo");
  const slots = landingTrustSectionStyles();
  const router = useRouter();
  const query = useCatalogCoaches({ limit: 6 });
  const slides = (query.data?.items ?? []).map((coach) => ({
    slug: coach.slug,
    src: coach.imageUrl ?? "",
    alt: coach.displayName,
    name: coach.displayName,
    specialty: coach.shortBio,
    yearsExperience: coach.experienceYears,
    rating: coach.reviewsCount > 0 ? coach.averageRating : undefined,
    ratingCount: coach.reviewsCount || undefined,
    headline: ["پیدا کن", "مربی", "مسیر", "خودت"],
  }));
  const [index, setIndex] = useState(0);
  const [revealKey, setRevealKey] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const slide = slides[index % Math.max(slides.length, 1)] ?? {
    slug: "",
    src: LANDING_ASSETS.coaches[0].src,
    alt: "تصویر معرفی مربیگری",
    name: "مربی مناسب مسیر تو",
    specialty: "تخصص، سابقه و شیوه تمرین را بررسی کن",
    yearsExperience: 0,
    rating: undefined,
    ratingCount: undefined,
    headline: ["پیدا کن", "مربی", "مسیر", "خودت"],
  };

  const go = (next: number) => {
    setIndex((next + Math.max(slides.length, 1)) % Math.max(slides.length, 1));
    setRevealKey((k) => k + 1);
  };

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    return observeScrollProgress(section, (progress) => {
      const ranges = [
        [-3, 3],
        [3, -3],
        [-2, 4],
        [4, -3],
      ];
      wordRefs.current.forEach((el, i) => {
        if (!el) return;
        const [from, to] = ranges[i] ?? [0, 0];
        el.style.transform = `translateX(${-(from! + (to! - from!) * progress)}%)`;
      });
    });
  }, [revealKey]);

  const words = slide.headline;

  return (
    <section
      ref={sectionRef}
      className={slots.root({ className })}
      id="coaches"
    >
      <div className={slots.badges()}>
        <InViewRise fromScale={0.9} fromY={0} className={slots.percent()}>
          <Typography
            type="body"
            weight="bold"
            className={slots.percentValue()}
          >
            {t("certifiedValue")}
          </Typography>
          <Typography type="body-sm" className={slots.percentCaption()}>
            {t("certifiedCaption")}
          </Typography>
        </InViewRise>

        <InViewRise delayIn={120} fromY={24} className={slots.badgeCard()}>
          <span className={slots.chip()}>{t("chip")}</span>
          <div>
            <Typography type="h2" className={slots.badgeTitle()}>
              {t("badgeTitle")}
            </Typography>
            <Typography type="body" className={slots.badgeBody()}>
              {t("badgeBody")}
            </Typography>
          </div>
        </InViewRise>
      </div>

      <Typography
        type="h2"
        id="trust-title"
        render={({ children, ...domProps }) => (
          <h2 {...domProps}>{children}</h2>
        )}
        className={slots.ghost()}
        aria-label={words.join(" ")}
      >
        <span className={slots.ghostRow()}>
          {[0, 1].map((i) => (
            <span
              key={`${revealKey}-t-${i}`}
              ref={(el) => {
                wordRefs.current[i] = el;
              }}
              className={slots.ghostWord()}
            >
              <ClipReveal
                as="span"
                mode="words"
                text={words[i]!}
                active
                stagger={0}
              />
            </span>
          ))}
        </span>
        <span className={slots.ghostRow()}>
          {[2, 3].map((i) => (
            <span
              key={`${revealKey}-b-${i}`}
              ref={(el) => {
                wordRefs.current[i] = el;
              }}
              className={slots.ghostWord({ ink: i === 2 })}
            >
              <ClipReveal
                as="span"
                mode="words"
                text={words[i]!}
                active
                stagger={0}
              />
            </span>
          ))}
        </span>
      </Typography>

      <InViewRise fromY={60} fromScale={0.92} className={slots.coachWrap()}>
        <CoachFeatureCard
          className={slots.coachCard()}
          experienceLabel={
            slide.yearsExperience
              ? coachCopy("yearsOfExperience", { years: slide.yearsExperience })
              : undefined
          }
          image={slide.src}
          imageAlt={slide.alt}

          key={revealKey}
          newLabel={coachCopy("badgeNew")}
          onPress={() =>
            router.push(
              slide.slug
                ? `/discovery/coaches/${encodeURIComponent(slide.slug)}`
                : "/discovery/coaches",
            )
          }
          rating={slide.rating}
          ratingCount={slide.ratingCount}
          specialty={slide.specialty}
          title={
            <Link
              href={
                slide.slug
                  ? `/discovery/coaches/${encodeURIComponent(slide.slug)}`
                  : "/discovery/coaches"
              }
            >
              {slide.name}
            </Link>
          }
        />
      </InViewRise>

      <CatalogStatus
        pending={query.isPending}
        error={query.isError}
        empty={!slides.length}
        retry={() => {
          void query.refetch();
        }}
      />
      <div className={slots.controls()}>
        <LandingArrowButton
          direction="prev"
          variant="outline"
          label={t("prevLabel")}
          onPress={() => go(index - 1)}
        />
        <CarouselDots
          count={Math.max(slides.length, 1)}
          active={index}
          tone="dark"
          onSelect={go}
        />
        <LandingArrowButton
          direction="next"
          variant="solid"
          label={t("nextLabel")}
          onPress={() => go(index + 1)}
        />
      </div>
    </section>
  );
}
