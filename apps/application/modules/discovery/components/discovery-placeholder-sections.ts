import type { DiscoverySection } from "@api/discovery";

export type DiscoverySectionLayout = Omit<DiscoverySection, "items"> & {
  skeletonCount?: number;
};

/** Only layout metadata is needed: each section renders its own dedicated skeleton. */
export function loadingSection(
  layout: DiscoverySectionLayout,
): DiscoverySection {
  return { ...layout, items: [] };
}
