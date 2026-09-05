export const BRAND_NAME = "Gym4Me" as const;

/** Splits copy while keeping the brand token as its own segment. */
export const BRAND_NAME_SPLIT = /(Gym4Me)/g;

export const lineShadowShadowColors = {
  foreground: "color-mix(in oklab, var(--foreground) 25%, transparent)",
  onBrand: "color-mix(in oklab, var(--on-brand) 35%, transparent)",
  inverse: "color-mix(in oklab, white 35%, transparent)",
  black: "black",
} as const;

export type LineShadowShadowColor = keyof typeof lineShadowShadowColors;

export function resolveLineShadowColor(
  preset: LineShadowShadowColor | string = "foreground",
): string {
  if (preset in lineShadowShadowColors) {
    return lineShadowShadowColors[preset as LineShadowShadowColor];
  }
  return preset;
}

export function containsBrandName(text: string): boolean {
  return text.includes(BRAND_NAME);
}
