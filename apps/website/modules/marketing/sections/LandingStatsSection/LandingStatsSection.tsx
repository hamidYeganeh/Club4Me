"use client";

import { TextWithBrand } from "@modules/marketing/components/kit/LineShadowText";
import { Typography } from "@heroui/react/typography";
import { Fire1 } from "@modules/marketing/icons/icons/Fire1";
import { Calendar1 } from "@modules/marketing/icons/icons/Calendar1";
import { BarbellHorizontal } from "@modules/marketing/icons/icons/BarbellHorizontal";
import { Check } from "@modules/marketing/icons/icons/Check";
import { MetricCard } from "@modules/marketing/components/cards/MetricCard";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
const LANDING_METRICS = [
  {
    key: "steps",
    title: "جلسه‌های تمرین",
    value: "۱۲",
    unit: "جلسه",
    status: "جلسه‌های کامل‌شده",
    color: "var(--accent)",
    chart: { type: "bars", series: [1, 0, 2, 1, 0, 2, 1] },
  },
  {
    key: "active",
    title: "وزنه ثبت‌شده",
    value: "۴۰",
    unit: "کیلوگرم",
    status: "رکورد یک حرکت",
    color: "var(--stats-orange)",
    chart: { type: "line", series: [20, 20, 25, 30, 30, 35, 40] },
  },
  {
    key: "heart",
    title: "روزهای فعالیت",
    value: "۴",
    unit: "روز",
    status: "مرور تقویم تمرین",
    color: "var(--stats-blue)",
    chart: { type: "dots", series: [1, 0, 1, 0, 1, 1, 0] },
  },
  {
    key: "sleep",
    title: "ست‌های ثبت‌شده",
    value: "۱۸",
    unit: "ست",
    status: "جزئیات هر جلسه",
    color: "var(--accent)",
    chart: { type: "bars", series: [3, 3, 4, 2, 3, 3, 0] },
  },
] as const;
import { LandingEyebrow } from "../../lib/landing-ui";
import { ClipReveal, InViewRise } from "../../lib/landing-reveal";
import { landingStatsSectionStyles } from "./LandingStatsSection.styles";
import type { LandingStatsSectionProps } from "./LandingStatsSection.types";

const METRIC_ICONS: Record<(typeof LANDING_METRICS)[number]["key"], ReactNode> =
  {
    steps: <Calendar1 size={18} />,
    active: <Fire1 size={18} />,
    heart: <BarbellHorizontal size={18} />,
    sleep: <Check size={18} />,
  };

export function LandingStatsSection({ className }: LandingStatsSectionProps) {
  const t = useTranslations("MarketingLanding.landingStats");
  const slots = landingStatsSectionStyles();
  const weekdayLabels = t.raw("weekdaysShort") as string[];

  return (
    <section id="progress" className={slots.root({ className })}>
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

        <div
          className={slots.stack()}
          aria-label="نمونه نمایشی گزارش تمرین؛ اعداد مربوط به حساب واقعی نیستند"
        >
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
                periodLabel="نمونه نمایشی"
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
