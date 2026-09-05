"use client";

import { LineShadowText } from "./LineShadowText";
import {
  BRAND_NAME,
  lineShadowShadowColors,
  resolveLineShadowColor,
  type LineShadowShadowColor,
} from "./line-shadow-brand";
import type { LineShadowTextProps } from "./LineShadowText.types";

export type BrandTextProps = Omit<LineShadowTextProps, "children"> & {
  children?: string;
  shadow?: LineShadowShadowColor | string;
};

/** Standalone Gym4Me wordmark. */
export function BrandText({
  children = BRAND_NAME,
  shadow = "foreground",
  shadowColor,
  ...props
}: BrandTextProps) {
  return (
    <LineShadowText
      shadowColor={shadowColor ?? resolveLineShadowColor(shadow)}
      {...props}
    >
      {children}
    </LineShadowText>
  );
}

export { lineShadowShadowColors };
