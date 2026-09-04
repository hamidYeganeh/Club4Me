import type {
  DiscoveryBannerAspectRatio,
  DiscoveryBannerSlidesPerView,
  DiscoveryBannersLayoutConfig,
} from "./DiscoveryBannersSection.types";

const ASPECT_RATIOS = new Set<DiscoveryBannerAspectRatio>([
  "16/9",
  "9/16",
  "3/4",
  "4/3",
]);

const SLIDES_PER_VIEW = new Set<string>(["1", "1.2", "auto"]);

function parseSlidesPerView(value: string): DiscoveryBannerSlidesPerView | null {
  if (!SLIDES_PER_VIEW.has(value)) return null;
  if (value === "auto") return "auto";
  if (value === "1") return 1;
  return 1.2;
}

/**
 * Parses discovery section `layout` into banner carousel options.
 * Accepted forms: `carousel`, `16/9`, `16/9:1.2`, `3/4:auto`.
 */
export function parseDiscoveryBannersLayout(
  layout?: string,
): DiscoveryBannersLayoutConfig {
  const defaults: DiscoveryBannersLayoutConfig = {
    aspectRatio: "16/9",
    slidesPerView: 1.2,
  };

  if (!layout || layout === "carousel") {
    return defaults;
  }

  const [ratioPart, slidesPart] = layout.split(":");
  const aspectRatio = ASPECT_RATIOS.has(ratioPart as DiscoveryBannerAspectRatio)
    ? (ratioPart as DiscoveryBannerAspectRatio)
    : defaults.aspectRatio;
  const slidesPerView =
    slidesPart != null
      ? (parseSlidesPerView(slidesPart) ?? defaults.slidesPerView)
      : defaults.slidesPerView;

  return { aspectRatio, slidesPerView };
}
