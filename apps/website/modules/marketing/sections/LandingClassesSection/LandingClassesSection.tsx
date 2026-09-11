"use client";

import { TextWithBrand } from "@modules/marketing/components/kit/LineShadowText";
import { Button } from "@heroui/react/button";
import { Typography } from "@heroui/react/typography";
import { ClubClassCard } from "@modules/marketing/components/cards/ClubClassCard";
import { useTranslations } from "next-intl";
import { useCatalogClasses } from "@api/discovery";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CatalogStatus } from "../../components/CatalogStatus";
import { ClipReveal, InViewRise } from "../../lib/landing-reveal";

import { landingClassesSectionStyles } from "./LandingClassesSection.styles";
import type { LandingClassesSectionProps } from "./LandingClassesSection.types";

export function LandingClassesSection({
  className,
}: LandingClassesSectionProps) {
  const t = useTranslations("MarketingLanding.landingClasses");
  const slots = landingClassesSectionStyles();
  const router = useRouter();
  const query = useCatalogClasses({ limit: 4 });

  return (
    <section
      id="classes"
      className={slots.root({ className })}
      dir="rtl"
      lang="fa"
    >
      <header className={slots.header()}>
        <ClipReveal
          as="h2"
          className={slots.title()}
          mode="lines"
          text={t("title")}
        />
        <Typography className={slots.hint()} type="body">
          <TextWithBrand>{t("hint")}</TextWithBrand>
        </Typography>
      </header>

      <CatalogStatus
        pending={query.isPending}
        error={query.isError}
        empty={!query.data?.items.length}
        retry={() => {
          void query.refetch();
        }}
      />
      <div className={slots.rail()}>
        {(query.data?.items ?? []).map((item, index) => (
          <InViewRise delayIn={index * 90} fromY={28} key={item.id}>
            <ClubClassCard
              actionLabel={t("actionLabel")}
              author={item.deliveryMode === "online" ? "آنلاین" : "حضوری"}
              backgroundImage={item.imageUrl ?? undefined}
              backgroundImageAlt={item.title}
              category="کلاس ورزشی"
              className={slots.card()}
              date={
                item.courseStartAt
                  ? new Date(item.courseStartAt).toLocaleDateString("fa-IR", {
                      timeZone: "Asia/Tehran",
                    })
                  : ""
              }
              duration={`${item.capacity.toLocaleString("fa-IR")} نفر ظرفیت`}
              onAction={() =>
                router.push(
                  `/discovery/classes/${encodeURIComponent(item.slug)}`,
                )
              }
              size="md"
              title={
                <Link
                  href={`/discovery/classes/${encodeURIComponent(item.slug)}`}
                >
                  {item.title}
                </Link>
              }
            />
          </InViewRise>
        ))}
      </div>

      <div className={slots.ctaWrap()}>
        <Button
          className={slots.cta()}
          size="lg"
          onPress={() => router.push("/discovery/classes")}
        >
          {t("cta")}
        </Button>
      </div>
    </section>
  );
}
