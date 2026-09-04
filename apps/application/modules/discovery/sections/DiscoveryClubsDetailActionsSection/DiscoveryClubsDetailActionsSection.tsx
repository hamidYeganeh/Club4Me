"use client";

import { Button } from "@heroui/react";
import { Icon } from "@theme/icon";
import { useTranslations } from "next-intl";

import { discoveryClubsDetailActionsSectionStyles } from "./DiscoveryClubsDetailActionsSection.styles";
import type { DiscoveryClubsDetailActionsSectionProps } from "./DiscoveryClubsDetailActionsSection.types";

export function DiscoveryClubsDetailActionsSection({
  onBook,
  onShare,
  onReport,
  primaryLabel,
}: DiscoveryClubsDetailActionsSectionProps) {
  const t = useTranslations("discovery.clubDetail");
  const styles = discoveryClubsDetailActionsSectionStyles();

  return (
    <div className={styles.root()}>
      <div className={styles.inner()}>
        <Button
          isIconOnly
          aria-label={t("share")}
          variant="secondary"
          size="lg"
          onPress={onShare}
        >
          <Icon name="share-1" size="lg" />
        </Button>

        {onReport ? (
          <Button
            isIconOnly
            aria-label="گزارش اطلاعات نادرست"
            variant="secondary"
            size="lg"
            onPress={onReport}
          >
            <Icon name="flag-1" size="lg" />
          </Button>
        ) : null}

        <div className={styles.bookWrap()}>
          <Button variant="primary" size="lg" fullWidth onPress={onBook}>
            {primaryLabel ?? t("bookNow")}
          </Button>
        </div>
      </div>
    </div>
  );
}
