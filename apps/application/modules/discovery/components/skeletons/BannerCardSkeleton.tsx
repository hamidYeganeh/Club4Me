import { discoveryBannersSectionStyles } from "../../sections/DiscoveryBannersSection/DiscoveryBannersSection.styles";
import type {
  DiscoveryBannerAspectRatio,
  DiscoveryBannerSlidesPerView,
} from "../../sections/DiscoveryBannersSection/DiscoveryBannersSection.types";
import { SkeletonBlock, SkeletonLines, SkeletonText } from "./primitives";

export function BannerCardSkeleton({
  aspectRatio,
  slidesPerView,
}: {
  aspectRatio: DiscoveryBannerAspectRatio;
  slidesPerView: DiscoveryBannerSlidesPerView;
}) {
  const styles = discoveryBannersSectionStyles({
    aspectRatio,
    slidesPerView:
      slidesPerView === "auto" ? "auto" : slidesPerView === 1 ? "1" : "1.2",
    cardWidth: slidesPerView === "auto" ? aspectRatio : "none",
  });
  return (
    <div
      className={styles.card()}
      data-skeleton-card={`banner-${aspectRatio}`}
      aria-hidden
    >
      <SkeletonBlock className="absolute inset-0 size-full rounded-none opacity-45" />
      <div className={styles.content()}>
        <strong className={styles.title()}>
          <SkeletonLines lines={1} />
        </strong>
        <span className={styles.subtitle()}>
          <SkeletonLines lines={1} />
        </span>
        <span className={styles.action({ className: "bg-surface-secondary" })}>
          <SkeletonText>مشاهده پیشنهادها</SkeletonText>
        </span>
      </div>
    </div>
  );
}
