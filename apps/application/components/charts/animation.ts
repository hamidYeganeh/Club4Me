import type { Transition } from "motion/react";
import { EASE_OUT, MOTION_DURATION } from "@/lib/ease";

/** Default clip-reveal easing for cartesian charts. */
export const DEFAULT_ANIMATION_EASING = `cubic-bezier(${EASE_OUT.join(", ")})`;

export const DEFAULT_ANIMATION_DURATION_MS = MOTION_DURATION.chart * 1000;

/** Default enter transition — uses the application easing with extra time to read the data. */
export const DEFAULT_CHART_ENTER_TRANSITION: Transition = {
  type: "tween",
  duration: DEFAULT_ANIMATION_DURATION_MS / 1000,
  ease: EASE_OUT,
};

/**
 * Clip-path width reveal must use tween — spring does not reliably animate SVG width.
 */
export function clipRevealTransition(enterTransition?: Transition): Transition {
  if (enterTransition?.type === "tween") {
    return {
      ...enterTransition,
      ease: enterTransition.ease ?? DEFAULT_CHART_ENTER_TRANSITION.ease,
    };
  }

  const duration =
    typeof enterTransition?.duration === "number"
      ? enterTransition.duration
      : DEFAULT_ANIMATION_DURATION_MS / 1000;

  return {
    type: "tween",
    duration,
    ease: DEFAULT_CHART_ENTER_TRANSITION.ease,
  };
}
