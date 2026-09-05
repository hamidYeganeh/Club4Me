"use client";

import { type CSSProperties } from "react";
import { motion } from "@ui/landing-motion";
import { cn } from "../../lib/utils";
import { lineShadowTextVariants } from "./LineShadowText.styles";
import type {
  LineShadowMotionElement,
  LineShadowTextProps,
} from "./LineShadowText.types";

const motionElements = {
  article: motion.article,
  div: motion.div,
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  h4: motion.h4,
  h5: motion.h5,
  h6: motion.h6,
  li: motion.li,
  p: motion.p,
  section: motion.section,
  span: motion.span,
} as const satisfies Record<
  LineShadowMotionElement,
  (typeof motion)[LineShadowMotionElement]
>;

export function LineShadowText({
  children,
  shadowColor = "black",
  className,
  as: Component = "span",
  style,
  ...props
}: LineShadowTextProps) {
  const slots = lineShadowTextVariants();
  const MotionComponent = motionElements[Component];

  return (
    <MotionComponent
      style={{ ...style, "--shadow-color": shadowColor } as CSSProperties}
      className={cn(slots.root(), className)}
      data-text={children}
      {...props}
    >
      {children}
    </MotionComponent>
  );
}
