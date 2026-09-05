"use client";

import { Fragment, type ReactNode } from "react";
import { cn } from "../../lib/utils";
import { LineShadowText } from "./LineShadowText";
import {
  BRAND_NAME,
  BRAND_NAME_SPLIT,
  resolveLineShadowColor,
  type LineShadowShadowColor,
} from "./line-shadow-brand";

import type { LineShadowTextElement } from "./LineShadowText.types";

export type TextWithBrandProps = {
  children: string;
  /** Wrapper element when copy includes non-brand text. */
  as?: LineShadowTextElement;
  /** Preset or custom CSS color for the line shadow. */
  shadow?: LineShadowShadowColor | string;
  shadowColor?: string;
  className?: string;
  brandClassName?: string;
};

/** Renders copy with every `Gym4Me` segment using {@link LineShadowText}. */
export function TextWithBrand({
  children,
  as: Wrapper = "span",
  shadow = "foreground",
  shadowColor,
  className,
  brandClassName,
}: TextWithBrandProps) {
  const resolvedShadow = shadowColor ?? resolveLineShadowColor(shadow);

  if (!children.includes(BRAND_NAME)) {
    return className ? (
      <Wrapper className={className}>{children}</Wrapper>
    ) : (
      children
    );
  }

  const parts = children.split(BRAND_NAME_SPLIT);

  return (
    <Wrapper className={cn(className)}>
      {parts.map((part, index) =>
        part === BRAND_NAME ? (
          <LineShadowText
            key={`brand-${index}`}
            className={brandClassName}
            shadowColor={resolvedShadow}
          >
            {part}
          </LineShadowText>
        ) : part ? (
          <Fragment key={`text-${index}`}>{part}</Fragment>
        ) : null,
      )}
    </Wrapper>
  );
}

/** Wraps string values with {@link TextWithBrand}; passes other nodes through. */
export function brandAwareText(value: ReactNode): ReactNode {
  return typeof value === "string" ? (
    <TextWithBrand>{value}</TextWithBrand>
  ) : (
    value
  );
}
