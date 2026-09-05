"use client";

import { TextWithBrand } from "@modules/marketing/components/kit/LineShadowText";
import { Typography } from "@heroui/react/typography";
import { Fire1 } from "@modules/marketing/icons/icons/Fire1";
import { FootSteps } from "@modules/marketing/icons/icons/FootSteps";
import { Heart } from "@modules/marketing/icons/icons/Heart";
import { SleepZzz } from "@modules/marketing/icons/icons/SleepZzz";
import { MetricCard } from "@modules/marketing/components/cards/MetricCard";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { LANDING_METRICS } from "../../lib/landing-assets";
import { LandingEyebrow } from "../../lib/landing-ui";
import { ClipReveal, InViewRise } from "../../lib/landing-reveal";
import { landingStatsSectionStyles } from "./LandingStatsSection.styles";
import type { LandingStatsSectionProps } from "./LandingStatsSection.types";

const METRIC_ICONS: Record<(typeof LANDING_METRICS)[number]["key"], ReactNode> =
  {
    steps: <FootSteps size={18} />,
    active: <Fire1 size={18} />,
    heart: <Heart size={18} />,
    sleep: <SleepZzz size={18} />,
  };

export function LandingStatsSection({ className }: LandingStatsSectionProps) {
  const t = useTranslations("MarketingLanding.landingStats");
  const slots = landingStatsSectionStyles();
  const weekdayLabels = t.raw("weekdaysShort") as string[];

  return (
    <section className={slots.root({ className })}>
      <div className={slots.layout()}>
        <div className={slots.copy()}>
          <LandingEyebrow tone="light">{t("eyebrow")}</LandingEyebrow>
          <ClipReveal
            id="stats-title"
            as="h2"
            mode="lines"
            text={t("title")}
            className={slots.title()}
          />
          <Typography type="body" className={slots.hint()}>
            <TextWithBrand shadow="onBrand">{t("hint")}</TextWithBrand>
          </Typography>
        </div>

        <div className={slots.stack()}>
          {LANDING_METRICS.map((metric, i) => (
            <InViewRise
              className={slots.item()}
              delayIn={i * 90}
              fromY={24}
              key={metric.key}
            >
              <MetricCard
                chart={metric.chart}
                className={slots.card()}
                color={metric.color}
                dayLabels={weekdayLabels}
                icon={METRIC_ICONS[metric.key]}
                periodLabel={t("today")}
                status={metric.status}
                title={metric.title}
                unit={metric.unit}
                value={metric.value}
                variant="horizontal"
              />
            </InViewRise>
          ))}
        </div>
      </div>
    </section>
  );
}
