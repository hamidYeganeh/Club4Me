"use client";

import { TextWithBrand } from "@modules/marketing/components/kit/LineShadowText";
import { Typography } from "@heroui/react/typography";
import { ClubCard } from "@modules/marketing/components/cards/ClubCard";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLandingClubs } from "../../lib/use-landing-catalog";
import { CatalogStatus } from "../../components/CatalogStatus";
import { useTranslations } from "next-intl";

import { ClipReveal, InViewRise } from "../../lib/landing-reveal";

import { landingClubsSectionStyles } from "./LandingClubsSection.styles";
import type { LandingClubsSectionProps } from "./LandingClubsSection.types";

export function LandingClubsSection({ className }: LandingClubsSectionProps) {
  const t = useTranslations("MarketingLanding.landingClubs");
  const shared = useTranslations("MarketingLanding.shared");
  const router = useRouter();
  const query = useLandingClubs();
  const slots = landingClubsSectionStyles();

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
      <CatalogStatus
        pending={query.isPending}
        error={query.isError}
        empty={!query.clubs.length}
        retry={() => {
          void query.refetch();
        }}
      />
      <Link href="/discovery/clubs" className="my-5 inline-block underline">
        مشاهده همه باشگاه‌ها
      </Link>
      <div className={slots.grid()}>
        {query.clubs.map((club, i) => (
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
              onAction={() =>
                router.push(`/discovery/clubs/${encodeURIComponent(club.slug)}`)
              }
              orientation="vertical"

              rating={club.rating}
              ratingCount={club.ratingCount}
              subtitle={club.subtitle}
              title={
                <Link
                  href={`/discovery/clubs/${encodeURIComponent(club.slug)}`}
                >
                  {club.title}
                </Link>
              }
            />
          </InViewRise>
        ))}
      </div>
    </section>
  );
}
