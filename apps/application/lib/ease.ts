/** One motion language for library components, charts and application surfaces.
 * Keep the CSS defaults in app/motion.css in sync (seconds here, ms there).
 */
export const EASE_OUT = [0.32, 0.72, 0, 1] as const;
export const MOTION_DURATION = {
  fast: 0.16,
  control: 0.24,
  reveal: 0.32,
  chart: 0.48,
} as const;
export const CONTROL_TRANSITION = {
  type: "tween",
  duration: MOTION_DURATION.control,
  ease: EASE_OUT,
} as const;
export const REVEAL_TRANSITION = {
  ...CONTROL_TRANSITION,
  duration: MOTION_DURATION.reveal,
} as const;
export const FADE_TRANSITION = {
  ...CONTROL_TRANSITION,
  duration: MOTION_DURATION.fast,
} as const;
export const REDUCED_TRANSITION = { type: "tween", duration: 0 } as const;
export const MOTION_STAGGER = 0.04;
