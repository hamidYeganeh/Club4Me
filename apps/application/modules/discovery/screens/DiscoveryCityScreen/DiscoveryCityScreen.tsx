"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, Typography } from "@heroui/react";
import { Icon } from "@theme/icon";

import { FallbackImage } from "@/components/FallbackImage";
import { getDiscoveryCity } from "@modules/discovery/discovery-city.constants";

import { discoveryCityScreenStyles } from "./DiscoveryCityScreen.styles";
import type { DiscoveryCityScreenProps } from "./DiscoveryCityScreen.types";

export function DiscoveryCityScreen({ cityId }: DiscoveryCityScreenProps) {
  const city = getDiscoveryCity(cityId);
  const router = useRouter();
  const styles = discoveryCityScreenStyles();

  if (!city) {
    return (
      <main className={styles.root()}>
        <div className={styles.empty()}>اطلاعات این شهر هنوز آماده نیست.</div>
      </main>
    );
  }

  return (
    <main className={styles.root()}>
      <section className={styles.hero()} aria-labelledby="city-title">
        <FallbackImage
          src={city.imageUrl}
          alt={`باشگاه‌های ${city.name}`}
          fill
          priority
          unoptimized
          sizes="(max-width: 576px) 100vw, 576px"
          className={styles.heroImage()}
        />
        <div className={styles.heroOverlay()} aria-hidden />

        <div className={styles.topBar()}>
          <Button
            isIconOnly
            variant="secondary"
            size="lg"
            aria-label="بازگشت"
            className={styles.backButton()}
            onPress={() => router.back()}
          >
            <Icon name="chevron-right" size="lg" />
          </Button>
        </div>

        <div className={styles.heroCopy()}>
          <Typography type="body-sm" weight="bold" className={styles.eyebrow()}>
            {city.clubsCount.toLocaleString("fa-IR")} باشگاه
          </Typography>
          <Typography
            id="city-title"
            type="h2"
            weight="bold"
            className={styles.heroTitle()}
          >
            باشگاه‌های {city.name}
          </Typography>
          <Typography type="body-sm" className={styles.heroDescription()}>
            بهترین باشگاه‌ها را در منطقه مورد نظرت پیدا و مقایسه کن.
          </Typography>
        </div>
      </section>

      <section className={styles.sheet()} aria-labelledby="districts-title">
        <div className={styles.sheetHeader()}>
          <Typography id="districts-title" type="h4" weight="bold">
            مناطق {city.name}
          </Typography>
          <Typography type="body-sm" color="muted">
            {city.districts.length.toLocaleString("fa-IR")} منطقه
          </Typography>
        </div>

        <div className={styles.list()}>
          {city.districts.map((district) => (
            <Card key={district.id} className={styles.card()}>
              <div className={styles.imageWrap()}>
                <FallbackImage
                  src={district.imageUrl}
                  alt={district.name}
                  fill
                  unoptimized
                  sizes="88px"
                  className={styles.image()}
                />
              </div>

              <div className={styles.cardBody()}>
                <Card.Title className={styles.cardTitle()}>
                  {district.name}
                </Card.Title>
                <Card.Description className={styles.count()}>
                  <span className={styles.countNumber()}>
                    {district.clubsCount.toLocaleString("fa-IR")}
                  </span>{" "}
                  باشگاه
                </Card.Description>
              </div>

              <span className={styles.arrow()} aria-hidden>
                <Icon name="arrow-left" size={20} />
              </span>

              <Link
                href={`/discovery/city/${city.id}/district/${district.id}`}
                className={styles.cardLink()}
                aria-label={`${district.name}، ${district.clubsCount.toLocaleString("fa-IR")} باشگاه`}
              />
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
