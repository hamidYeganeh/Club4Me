"use client";

import { TextWithBrand } from "@modules/marketing/components/kit/LineShadowText";
import { Button } from "@heroui/react/button";
import { Typography } from "@heroui/react/typography";
import { Archery } from "@modules/marketing/icons/icons/Archery";
import { BarbellHorizontal } from "@modules/marketing/icons/icons/BarbellHorizontal";
import { Basketball } from "@modules/marketing/icons/icons/Basketball";
import { Boxing } from "@modules/marketing/icons/icons/Boxing";
import { HeartEcg } from "@modules/marketing/icons/icons/HeartEcg";
import { JumpingRope } from "@modules/marketing/icons/icons/JumpingRope";
import { Kettlebell } from "@modules/marketing/icons/icons/Kettlebell";
import { PersonKarate } from "@modules/marketing/icons/icons/PersonKarate";
import { PersonRunning } from "@modules/marketing/icons/icons/PersonRunning";
import { PersonSwimming } from "@modules/marketing/icons/icons/PersonSwimming";
import { PersonYoga } from "@modules/marketing/icons/icons/PersonYoga";
import { Soccer } from "@modules/marketing/icons/icons/Soccer";
import { Tennis } from "@modules/marketing/icons/icons/Tennis";
import { SportCard } from "@modules/marketing/components/cards/SportCard";
import { motion, useReducedMotion, type Variants } from "@ui/landing-motion";
import { useTranslations } from "next-intl";
import type { ComponentType } from "react";
import { LANDING_ASSETS, LANDING_SPORT_THEMES } from "../../lib/landing-assets";
import { LANDING_EASE_LOOP, landingReveal } from "../../lib/landing-motion";
import { useLandingScroll } from "../../lib/landing-scroll";
import { landingSportsSectionStyles } from "./LandingSportsSection.styles";
import type {
  LandingSportTile,
  LandingSportsSectionProps,
} from "./LandingSportsSection.types";

type SportTileDef = {
  id: string;
  name: string;
  subtitle: string;
};

const SPORT_IMAGES: Record<string, string> = {
  football: LANDING_ASSETS.collection[1].src,
  bodybuilding: LANDING_ASSETS.facilities.clay,
  yoga: LANDING_ASSETS.collection[2].src,
  crossfit: LANDING_ASSETS.collection[0].src,
  swimming: LANDING_ASSETS.facilities.harbor,
  boxing: LANDING_ASSETS.hero,
  running: LANDING_ASSETS.collection[1].src,
  basketball: LANDING_ASSETS.facilities.intro,
  tennis: LANDING_ASSETS.collection[2].src,
  functional: LANDING_ASSETS.facilities.clay,
  "martial-arts": LANDING_ASSETS.hero,
  cardio: LANDING_ASSETS.facilities.harbor,
  archery: LANDING_ASSETS.collection[0].src,
};

const SPORT_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  football: Soccer,
  bodybuilding: BarbellHorizontal,
  yoga: PersonYoga,
  crossfit: JumpingRope,
  swimming: PersonSwimming,
  boxing: Boxing,
  running: PersonRunning,
  basketball: Basketball,
  tennis: Tennis,
  functional: Kettlebell,
  "martial-arts": PersonKarate,
  cardio: HeartEcg,
  archery: Archery,
};

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: landingReveal(delay),
  }),
};

function buildSportTiles(defs: SportTileDef[]): LandingSportTile[] {
  return defs.map((def) => ({
    id: def.id,
    name: def.name,
    subtitle: def.subtitle,
    icon: SPORT_ICONS[def.id] ?? BarbellHorizontal,
    image: SPORT_IMAGES[def.id] ?? LANDING_ASSETS.hero,
  }));
}

function SportTileCard({
  tile,
  themeIndex,
  viewSportLabel,
}: {
  tile: LandingSportTile;
  themeIndex: number;
  viewSportLabel: string;
}) {
  const slots = landingSportsSectionStyles();
  const theme = LANDING_SPORT_THEMES[themeIndex % LANDING_SPORT_THEMES.length]!;
  const Icon = tile.icon;

  return (
    <SportCard
      actionColor={theme.actionColor}
      actionForegroundColor={theme.actionForegroundColor}
      actionLabel={viewSportLabel}
      className={slots.card()}
      color={theme.color}
      foregroundColor={theme.foregroundColor}
      size="sm"
      sport={{
        title: tile.name,
        subtitle: tile.subtitle,
        backgroundImage: tile.image,
        icon: <Icon />,
      }}
    />
  );
}

function MarqueeRow({
  tiles,
  direction,
  delay,
  themeOffset,
  viewSportLabel,
}: {
  tiles: LandingSportTile[];
  direction: "left" | "right";
  delay: number;
  themeOffset: number;
  viewSportLabel: (name: string) => string;
}) {
  const slots = landingSportsSectionStyles();
  const reduceMotion = useReducedMotion() ?? false;
  const loop = [...tiles, ...tiles];

  return (
    <motion.div
      className={slots.row()}
      custom={delay}
      initial="hidden"
      variants={fadeUpVariants}
      viewport={{ once: true, amount: 0.35 }}
      whileInView="visible"
    >
      <div aria-hidden className={slots.fadeStart()} />
      <div aria-hidden className={slots.fadeEnd()} />
      <motion.div
        animate={
          reduceMotion
            ? undefined
            : direction === "left"
              ? { x: ["0%", "-50%"] }
              : { x: ["-50%", "0%"] }
        }
        className={slots.track()}
        transition={{
          x: { duration: 42, repeat: Infinity, ease: LANDING_EASE_LOOP },
        }}
      >
        {loop.map((tile, index) => (
          <SportTileCard
            key={`${tile.id}-${index}`}
            themeIndex={index + themeOffset}
            tile={tile}
            viewSportLabel={viewSportLabel(tile.name)}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}

export function LandingSportsSection({ className }: LandingSportsSectionProps) {
  const t = useTranslations("MarketingLanding.landingSports");
  const slots = landingSportsSectionStyles();
  const { scrollTo } = useLandingScroll();
  const tileDefs = t.raw("tiles") as SportTileDef[];
  const sportTiles = buildSportTiles(tileDefs);
  const sportRow1 = sportTiles.slice(0, 7);
  const sportRow2 = sportTiles.slice(6);
  const titleLines = t("title").split("\n");

  return (
    <section
      className={slots.root({ className })}
      dir="rtl"
      id="sports"
      lang="fa"
    >
      <div className={slots.headingWrap()}>
        <motion.div
          custom={0.1}
          initial="hidden"
          variants={fadeUpVariants}
          viewport={{ once: true, amount: 0.6 }}
          whileInView="visible"
        >
          <Typography className={slots.title()} type="h2" weight="medium">
            {titleLines[0]}
            <br />
            {titleLines[1]}
          </Typography>
          <Typography className={slots.hint()} type="body">
            <TextWithBrand shadow="onBrand">{t("hint")}</TextWithBrand>
          </Typography>
        </motion.div>

        <motion.div
          className={slots.ctaWrap()}
          custom={0.2}
          initial="hidden"
          variants={fadeUpVariants}
          viewport={{ once: true, amount: 0.6 }}
          whileInView="visible"
        >
          <Button
            className={slots.cta()}
            size="lg"
            onPress={() => scrollTo("#clubs")}
          >
            {t("cta")}
          </Button>
        </motion.div>
      </div>

      <div aria-hidden inert className={slots.marquee()}>
        <MarqueeRow
          delay={0.3}
          direction="left"
          themeOffset={0}
          tiles={sportRow1}
          viewSportLabel={(name) => t("viewSport", { name })}
        />
        <MarqueeRow
          delay={0.4}
          direction="right"
          themeOffset={2}
          tiles={sportRow2}
          viewSportLabel={(name) => t("viewSport", { name })}
        />
      </div>
    </section>
  );
}
