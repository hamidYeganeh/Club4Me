"use client";

// Adapted from https://beui.dev/components/motion/tabs (MIT).
// A visual primitive: route links remain links and filter buttons remain buttons.
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { useId, type ReactNode } from "react";
import { CONTROL_TRANSITION, REDUCED_TRANSITION } from "@/lib/ease";
import { cn } from "@/lib/cn";

export function ActiveIndicatorGroup({ children }: { children: ReactNode }) {
  const id = useId();
  return <LayoutGroup id={id}>{children}</LayoutGroup>;
}

export function ActiveIndicator({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.span
      aria-hidden="true"
      initial={false}
      layoutId={reduced ? undefined : "active-indicator"}
      transition={reduced ? REDUCED_TRANSITION : CONTROL_TRANSITION}
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit] bg-accent",
        className,
      )}
    />
  );
}
