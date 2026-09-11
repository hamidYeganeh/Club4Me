"use client";

import { MotionConfig, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { CONTROL_TRANSITION, REDUCED_TRANSITION } from "@/lib/ease";

/** Includes portaled sheets and shared UI without changing their visual tokens. */
export function AppMotionProvider({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  return (
    <MotionConfig
      reducedMotion="user"
      transition={reduced ? REDUCED_TRANSITION : CONTROL_TRANSITION}
    >
      {children}
    </MotionConfig>
  );
}
