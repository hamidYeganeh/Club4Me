"use client";

import { SaveButton } from "@/components/save-button";
import { useRouter } from "next/navigation";
import { Button, Typography } from "@heroui/react";
import { Icon } from "@theme/icon";
import { useTranslations } from "next-intl";

import { discoveryClubsDetailStickyHeaderSectionStyles } from "./DiscoveryClubsDetailStickyHeaderSection.styles";
import type { DiscoveryClubsDetailStickyHeaderSectionProps } from "./DiscoveryClubsDetailStickyHeaderSection.types";

export function DiscoveryClubsDetailStickyHeaderSection({
  visible,
  name,
  favoriteId,
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
          onPress={() => router.push("/discovery/clubs")}
        >
          <Icon name="chevron-right" size="lg" />
        </Button>

        <Typography type="h6" truncate className={styles.title()}>
          {name}
        </Typography>

        <SaveButton entityType="club" entityId={favoriteId} />
      </div>
    </header>
  );
}
