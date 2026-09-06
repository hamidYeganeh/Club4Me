import { Typography } from "@heroui/react";
import { discoveryClassesRailSectionStyles } from "../../sections/DiscoveryClassesRailSection/DiscoveryClassesRailSection.styles";
import { SkeletonBlock, SkeletonLines, SkeletonText } from "./primitives";

export function ClassCardSkeleton() {
  const styles = discoveryClassesRailSectionStyles();
  return (
    <div className={styles.card()} data-skeleton-card="class" aria-hidden>
      <div className={styles.imageWrap()}>
        <SkeletonBlock className="absolute inset-0 size-full rounded-none" />
        <span className={styles.badge()}>
          <SkeletonText>حضوری</SkeletonText>
        </span>
        <span className={styles.seats()}>
          <SkeletonText>۱۵ ظرفیت باقی‌مانده</SkeletonText>
        </span>
      </div>
      <div className={styles.body()}>
        <Typography type="body-xs" className={styles.sport()}>
          <SkeletonText>حضوری</SkeletonText>
        </Typography>
        <h3 className={styles.name()}>
          <SkeletonLines lines={1} />
        </h3>
        <p className={styles.description()}>
          <SkeletonLines />
        </p>
        <p className={styles.price()}>
          <SkeletonText>از ۱۰۰٬۰۰۰ تومان</SkeletonText>
        </p>
      </div>
    </div>
  );
}
