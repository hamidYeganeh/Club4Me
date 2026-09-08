import type { IconName } from "@theme/icon";
import { DiscoveryImageHero } from "./DiscoveryImageHero";
export function DiscoveryBrowseIntro({
  title,
  description,
}: {
  title: string;
  description: string;
  icon: IconName;
}) {
  return (
    <DiscoveryImageHero
      compact
      imageUrl="/profile/cover.jpg"
      title={title}
      description={description}
      eyebrow="کشف"
    />
  );
}
