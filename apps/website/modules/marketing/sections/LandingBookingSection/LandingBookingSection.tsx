"use client";

import { Avatar } from "@heroui/react/avatar";
import { Button } from "@heroui/react/button";
import { Typography } from "@heroui/react/typography";
import { useTranslations } from "next-intl";
import { LANDING_ASSETS, LANDING_CLUBS } from "../../lib/landing-assets";
import { useLandingScroll } from "../../lib/landing-scroll";
import { landingBookingSectionStyles } from "./LandingBookingSection.styles";
import type {
  LandingBookingOrbitAvatar,
  LandingBookingSectionProps,
  LandingBookingStackAvatar,
} from "./LandingBookingSection.types";

const ORBIT_LAYOUT = [
  { id: 1, size: 56, top: "10%", left: "5%" },
  { id: 2, size: 84, top: "5%", left: "25%" },
  { id: 3, size: 64, top: "8%", left: "70%" },
  { id: 4, size: 72, top: "40%", left: "10%" },
  { id: 5, size: 56, top: "45%", left: "35%" },
  { id: 6, size: 84, top: "25%", left: "55%" },
  { id: 7, size: 56, top: "35%", left: "85%" },
  { id: 8, size: 72, top: "75%", left: "5%" },
  { id: 9, size: 84, top: "70%", left: "25%" },
  { id: 10, size: 84, top: "75%", left: "55%" },
  { id: 11, size: 84, top: "55%", left: "70%" },
  { id: 12, size: 72, top: "70%", left: "90%" },
] as const;

export function LandingBookingSection({
  className,
}: LandingBookingSectionProps) {
  const t = useTranslations("MarketingLanding.landingBooking");
  const slots = landingBookingSectionStyles();
  const { scrollTo } = useLandingScroll();

  const portraits = [
    {
      src: LANDING_ASSETS.coaches[0].src,
      alt: LANDING_ASSETS.coaches[0].name,
      fallback: LANDING_ASSETS.coaches[0].name.slice(0, 1),
    },
    {
      src: LANDING_ASSETS.coaches[1].src,
      alt: LANDING_ASSETS.coaches[1].name,
      fallback: LANDING_ASSETS.coaches[1].name.slice(0, 1),
    },
    {
      src: LANDING_ASSETS.coaches[2].src,
      alt: LANDING_ASSETS.coaches[2].name,
      fallback: LANDING_ASSETS.coaches[2].name.slice(0, 1),
    },
    {
      src: LANDING_CLUBS[0].image,
      alt: LANDING_CLUBS[0].title,
      fallback: LANDING_CLUBS[0].title.slice(0, 1),
    },
    {
      src: LANDING_CLUBS[1].image,
      alt: LANDING_CLUBS[1].title,
      fallback: LANDING_CLUBS[1].title.slice(0, 1),
    },
    {
      src: LANDING_CLUBS[2].image,
      alt: LANDING_CLUBS[2].title,
      fallback: LANDING_CLUBS[2].title.slice(0, 1),
    },
    {
      src: LANDING_CLUBS[3].image,
      alt: LANDING_CLUBS[3].title,
      fallback: LANDING_CLUBS[3].title.slice(0, 1),
    },
    {
      src: LANDING_CLUBS[4].image,
      alt: LANDING_CLUBS[4].title,
      fallback: LANDING_CLUBS[4].title.slice(0, 1),
    },
    {
      src: LANDING_CLUBS[5].image,
      alt: LANDING_CLUBS[5].title,
      fallback: LANDING_CLUBS[5].title.slice(0, 1),
    },
    {
      src: LANDING_CLUBS[6].image,
      alt: LANDING_CLUBS[6].title,
      fallback: LANDING_CLUBS[6].title.slice(0, 1),
    },
    {
      src: LANDING_ASSETS.facilities.clay,
      alt: t("strengthHallAlt"),
      fallback: "ق",
    },
    {
      src: LANDING_ASSETS.facilities.harbor,
      alt: t("cardioHallAlt"),
      fallback: "ک",
    },
  ] as const;

  const orbitAvatars: LandingBookingOrbitAvatar[] = ORBIT_LAYOUT.map(
    (layout, index) => {
      const portrait = portraits[index]!;
      return {
        ...layout,
        src: portrait.src,
        alt: portrait.alt,
        fallback: portrait.fallback,
      };
    },
  );

  const stackAvatars: LandingBookingStackAvatar[] = portraits
    .slice(0, 5)
    .map((portrait, index) => ({
      id: index + 1,
      src: portrait.src,
      alt: portrait.alt,
      fallback: portrait.fallback,
    }));

  return (
    <section
      id="booking"
      className={slots.root({ className })}
      dir="rtl"
      lang="fa"
    >
      <div className={slots.inner()}>
        <div className={slots.banner()}>
          <div aria-hidden className={slots.squiggle()}>
            <svg
              className={slots.squiggleSvg()}
              fill="none"
              preserveAspectRatio="none"
              viewBox="0 0 800 400"
            >
              <path
                d="M-100,300 C100,450 200,50 400,200 C600,350 700,50 900,150"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="60"
              />
              <path
                d="M-100,280 C100,430 200,30 400,180 C600,330 700,30 900,130"
                opacity="0.5"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="20"
              />
            </svg>
          </div>

          <div className={slots.copyCol()}>
            <Typography className={slots.title()} type="h2" weight="bold">
              {t("title")}
            </Typography>
            <Typography className={slots.subtitle()} type="body-sm">
              {t("subtitle")}
            </Typography>
            <div className={slots.ctaWrap()}>
              <Button
                className={slots.cta()}
                onPress={() => scrollTo("#download")}
              >
                {t("cta")}
              </Button>
            </div>
          </div>

          <div className={slots.orbitCol()}>
            {orbitAvatars.map((avatar) => (
              <div
                className={slots.orbitAvatar()}
                key={avatar.id}
                style={{
                  width: avatar.size,
                  height: avatar.size,
                  top: avatar.top,
                  left: avatar.left,
                }}
              >
                <Avatar className={slots.orbitAvatarInner()}>
                  <Avatar.Image alt={avatar.alt} src={avatar.src} />
                  <Avatar.Fallback>{avatar.fallback}</Avatar.Fallback>
                </Avatar>
              </div>
            ))}
          </div>

          <div className={slots.stack()}>
            {stackAvatars.map((avatar) => (
              <Avatar className={slots.stackAvatar()} key={avatar.id}>
                <Avatar.Image alt={avatar.alt} src={avatar.src} />
                <Avatar.Fallback>{avatar.fallback}</Avatar.Fallback>
              </Avatar>
            ))}
            <Typography
              className={slots.countChip()}
              type="body-sm"
              weight="semibold"
            >
              {t("count")}
            </Typography>
          </div>
        </div>
      </div>
    </section>
  );
}
