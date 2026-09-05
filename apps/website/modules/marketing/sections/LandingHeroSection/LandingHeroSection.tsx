"use client";
import { CoverImage } from "@/components/cover-image";

import { Button } from "@heroui/react/button";
import { ScrollShadow } from "@heroui/react/scroll-shadow";
import { ClubCard } from "@modules/marketing/components/cards/ClubCard";
import { BrandText } from "@modules/marketing/components/kit/LineShadowText";
import { observeScrollProgress } from "../../lib/scroll-progress";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { LANDING_ASSETS, LANDING_CLUBS } from "../../lib/landing-assets";
import { BrandMark } from "../../lib/landing-controls";
import { ClipReveal, InViewRise } from "../../lib/landing-reveal";
import { useLandingScroll } from "../../lib/landing-scroll";
import { cn } from "../../lib/marketing-cn";
import { MarketingThemeToggle } from "../../lib/marketing-theme-toggle";
import { landingHeroSectionStyles } from "./LandingHeroSection.styles";
import type { LandingHeroSectionProps } from "./LandingHeroSection.types";

const HERO_CLUBS = LANDING_CLUBS.slice(0, 5);

export function LandingHeroSection({ className }: LandingHeroSectionProps) {
  const t = useTranslations("MarketingLanding.landingHero");
  const shared = useTranslations("MarketingLanding.shared");
  const slots = landingHeroSectionStyles();
  const { ready, openMenu, scrollTo } = useLandingScroll();
  const sectionRef = useRef<HTMLElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const section = sectionRef.current;
    const plate = parallaxRef.current;
    if (!section || !plate) return;
    return observeScrollProgress(
      section,
      (progress) => {
        plate.style.transform = `translateY(${progress * 12}%)`;
      },
      true,
    );
  }, []);

  return (
    <section ref={sectionRef} className={slots.root({ className })}>
      <div className={slots.plate()} aria-hidden>
        <div ref={parallaxRef} className={slots.plateInner()}>
          <CoverImage
            src={LANDING_ASSETS.hero}
            alt={t("heroImageAlt")}
            className={slots.plateImg()}
            priority
          />
        </div>
        <div className={slots.plateGradient()} />
      </div>

      <header className={slots.header()}>
        <nav className={slots.navLeft()} aria-label={t("navAria")}>
          <a
            href="#sports"
            className={slots.navLink()}
            onClick={(e) => {
              e.preventDefault();
              scrollTo("#sports");
            }}
          >
            {t("navSports")}
          </a>
          <a
            href="#clubs"
            className={slots.navLink()}
            onClick={(e) => {
              e.preventDefault();
              scrollTo("#clubs");
            }}
          >
            {t("navClubs")}
          </a>
          <a
            href="#coaches"
            className={slots.navLink()}
            onClick={(e) => {
              e.preventDefault();
              scrollTo("#coaches");
            }}
          >
            {t("navCoaches")}
          </a>
        </nav>

        <div className={slots.brand()}>
          <BrandMark size={20} instanceId="hero-brand" />
          <BrandText shadow="onBrand" />
        </div>

        <div className={slots.navRight()}>
          <MarketingThemeToggle className={slots.themeToggle()} />
          <Button
            variant="ghost"
            className={cn(
              slots.bookBtn(),
              "h-auto min-h-0 rounded-none border-0 bg-transparent p-0 shadow-none",
            )}
            onPress={() => scrollTo("#download")}
          >
            {t("downloadCta")}
          </Button>
          <Button
            variant="ghost"
            className={slots.burger()}
            aria-label={t("menuAria")}
            onPress={openMenu}
            render={(props) => <button {...props} type="button" />}
          >
            <span className={slots.burgerBar()} />
            <span className={slots.burgerBar()} />
          </Button>
        </div>
      </header>

      <div className={slots.titleWrap()}>
        <ClipReveal
          id="hero-title"
          as="h1"
          mode="lines"
          text={t("title")}
          className={slots.title()}
          active={ready}
          stagger={140}
          duration={1100}
        />
      </div>

      <div className={slots.bottom()}>
        <ClipReveal
          as="p"
          mode="lines"
          text={t("tagline")}
          className={slots.tagline()}
          active={ready}
          baseDelay={350}
          stagger={110}
          duration={900}
        />

        <InViewRise className={slots.slider()} delayIn={650} fromY={28}>
          <ScrollShadow
            className={slots.carouselShadow()}
            hideScrollBar
            isEnabled={false}
            orientation="horizontal"
            size={56}
            visibility="auto"
          >
            <div
              className="landing-hero-carousel"
              aria-label={t("carouselAria")}
              tabIndex={0}
            >
              {HERO_CLUBS.map((club) => (
                <div className={slots.slide()} key={club.title}>
                  <ClubCard
                    actionLabel={shared("viewAction")}
                    className={slots.clubCard()}
                    features={[...club.features]}
                    image={club.image}
                    imageAlt={club.title}
                    onAction={() => scrollTo("#clubs")}
                    orientation="vertical"
                    price={club.price}
                    pricePrefix={shared("pricePrefix")}
                    priceSuffix={shared("priceSuffix")}
                    rating={club.rating}
                    ratingCount={club.ratingCount}
                    subtitle={club.subtitle}
                    title={club.title}
                  />
                </div>
              ))}
            </div>
          </ScrollShadow>
        </InViewRise>
      </div>
    </section>
  );
}
