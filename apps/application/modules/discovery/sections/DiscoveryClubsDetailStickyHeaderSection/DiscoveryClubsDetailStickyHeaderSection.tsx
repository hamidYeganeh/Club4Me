"use client";

import { useRouter } from "next/navigation";
import { Button, Typography } from "@heroui/react";
import { Icon } from "@theme/icon";
import { useTranslations } from "next-intl";

import { discoveryClubsDetailStickyHeaderSectionStyles } from "./DiscoveryClubsDetailStickyHeaderSection.styles";
import type { DiscoveryClubsDetailStickyHeaderSectionProps } from "./DiscoveryClubsDetailStickyHeaderSection.types";

export function DiscoveryClubsDetailStickyHeaderSection({
  visible,
  name,
  favorited = false,
  onFavoritePress,
}: DiscoveryClubsDetailStickyHeaderSectionProps) {
  const t = useTranslations("discovery.clubDetail");
  const router = useRouter();
  const styles = discoveryClubsDetailStickyHeaderSectionStyles({ visible });

  return (
    <header className={styles.root()} aria-hidden={!visible}>
      <div className={styles.inner()}>
        <Button
          isIconOnly
          aria-label={t("back")}
          variant="secondary"
          size="lg"
          onPress={() => router.back()}
        >
          <Icon name="chevron-right" size="lg" />
        </Button>

        <Typography type="h6" truncate className={styles.title()}>{name}</Typography>

        <Button
          isIconOnly
          aria-label={favorited ? t("unfavorite") : t("favorite")}
          variant="secondary"
          size="lg"
          onPress={onFavoritePress}
        >
          <Icon name="heart" size="lg" className={styles.favoriteIcon()} />
        </Button>
      </div>
    </header>
  );
}
