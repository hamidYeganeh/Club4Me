"use client";

import { BrandText } from "@modules/marketing/components/kit/LineShadowText";
import { useEffect, useRef, useState } from "react";
import { BrandMark } from "../../lib/landing-controls";
import {
  EASE,
  LANDING_DURATION_MS,
  tween,
  usePrefersReducedMotion,
} from "../../lib/landing-motion";
import { useLandingScroll } from "../../lib/landing-scroll";
import { landingLoaderStyles } from "./LandingLoader.styles";
import type { LandingLoaderProps } from "./LandingLoader.types";

const MIN_VISIBLE_MS = 1400;
const MAX_VISIBLE_MS = 2600;
const EXIT_MS = LANDING_DURATION_MS.reveal;

export function LandingLoader({ className }: LandingLoaderProps) {
  const { setReady, lockScroll } = useLandingScroll();
  const reduced = usePrefersReducedMotion();
  const [gone, setGone] = useState(false);
  const [progress, setProgress] = useState(0);
  const [markIn, setMarkIn] = useState(false);
  const [exitY, setExitY] = useState(0);
  const started = useRef(false);
  const slots = landingLoaderStyles();

  useEffect(() => {
    lockScroll();
    const markFrame = requestAnimationFrame(() => setMarkIn(true));
    started.current = false;

    const minMs = reduced ? 200 : MIN_VISIBLE_MS;
    const exitMs = reduced ? 0 : EXIT_MS;
    const progressDelay = reduced ? 0 : 120;
    const progressDur = Math.max(0, minMs - progressDelay);

    const progressTimer = window.setTimeout(() => {
      tween(0, 1, progressDur, EASE.outFluid, setProgress);
    }, progressDelay);

    const finish = () => {
      if (started.current) return;
      started.current = true;
      setReady(true);
      if (exitMs === 0) {
        setGone(true);
        return;
      }
      tween(0, -105, exitMs, EASE.outFluid, setExitY, () => setGone(true));
    };

    let minTimer = 0;
    const startCountdown = () => {
      minTimer = window.setTimeout(finish, minMs);
    };

    if (document.readyState === "complete") startCountdown();
    else window.addEventListener("load", startCountdown, { once: true });

    const maxTimer = window.setTimeout(finish, reduced ? 400 : MAX_VISIBLE_MS);

    return () => {
      cancelAnimationFrame(markFrame);
      window.removeEventListener("load", startCountdown);
      window.clearTimeout(progressTimer);
      window.clearTimeout(minTimer);
      window.clearTimeout(maxTimer);
    };
  }, [lockScroll, reduced, setReady]);

  if (gone) return null;

  return (
    <div
      className={slots.root({ className })}
      style={{ transform: `translateY(${exitY}%)` }}
      aria-hidden={exitY !== 0}
    >
      <div
        className={slots.mark()}
        style={{
          opacity: markIn ? 1 : 0,
          transform: markIn ? "translateY(0)" : "translateY(16px)",
          transition: `opacity ${LANDING_DURATION_MS.reveal}ms var(--ease-app), transform ${LANDING_DURATION_MS.reveal}ms var(--ease-app)`,
        }}
      >
        <BrandMark size={28} instanceId="loader-brand" />
        <BrandText shadow="onBrand" />
      </div>
      <div
        className={slots.track()}
        role="progressbar"
        aria-valuenow={Math.round(progress * 100)}
      >
        <div
          className={slots.fill()}
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>
    </div>
  );
}
