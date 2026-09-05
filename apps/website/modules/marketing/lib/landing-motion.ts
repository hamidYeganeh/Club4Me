"use client";

const durationMs = { fast: 150, moderate: 300 };
const duration = { fast: 0.15, moderate: 0.3 };
const ease = { outFluid: [0.32, 0.72, 0, 1] as const };
import {
  useEffect,
  useState,
  useSyncExternalStore,
  useCallback,
  type RefObject,
} from "react";

/** Matches `--ease-app` / HeroUI `outFluid`. */
function cubicBezierEase(x1: number, y1: number, x2: number, y2: number) {
  return (t: number) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    let x = t;
    for (let i = 0; i < 8; i++) {
      const cx = 3 * x1;
      const bx = 3 * (x2 - x1) - cx;
      const ax = 1 - cx - bx;
      const current = ((ax * x + bx) * x + cx) * x - t;
      const dx = (3 * ax * x + 2 * bx) * x + cx;
      if (Math.abs(dx) < 1e-6) break;
      x = Math.min(1, Math.max(0, x - current / dx));
    }
    const cy = 3 * y1;
    const by = 3 * (y2 - y1) - cy;
    const ay = 1 - cy - by;
    return ((ay * x + by) * x + cy) * x;
  };
}

export const LANDING_EASE = ease.outFluid;
export const LANDING_EASE_CSS = "var(--ease-app)";
export const LANDING_EASE_CUBIC = "cubic-bezier(0.32, 0.72, 0, 1)";
/** GSAP 3.12+ accepts the same cubic-bezier string as CSS. */
export const LANDING_EASE_GSAP = LANDING_EASE_CUBIC;
export const LANDING_EASE_GSAP_SCRUB = "none";
export const LANDING_EASE_LOOP = "linear";

export const LANDING_DURATION_MS = {
  fast: durationMs.fast,
  moderate: durationMs.moderate,
  reveal: 700,
} as const;

export const LANDING_DURATION_S = {
  fast: duration.fast,
  moderate: duration.moderate,
  reveal: 0.7,
} as const;

export function landingReveal(delay = 0) {
  return {
    duration: LANDING_DURATION_S.reveal,
    delay,
    ease: LANDING_EASE,
  } as const;
}

export const EASE = {
  outFluid: cubicBezierEase(0.32, 0.72, 0, 1),
  easeOutExpo: (t: number) => (t === 1 ? 1 : 1 - 2 ** (-10 * t)),
  easeOutQuart: (t: number) => 1 - (1 - t) ** 4,
  easeInOutCubic: (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2,
} as const;

export type SpringConfig = { tension: number; friction: number };

type SpringState = {
  x: number;
  v: number;
  target: number;
  tension: number;
  friction: number;
};

const springs = new Map<string, SpringState>();
let rafId = 0;
const listeners = new Set<() => void>();

function stepSprings(dt: number) {
  let active = false;
  for (const s of springs.values()) {
    const force = -s.tension * (s.x - s.target) - s.friction * s.v;
    s.v += force * dt;
    s.x += s.v * dt;
    if (Math.abs(s.x - s.target) > 0.001 || Math.abs(s.v) > 0.001) {
      active = true;
    } else {
      s.x = s.target;
      s.v = 0;
    }
  }
  for (const fn of listeners) fn();
  if (active) rafId = requestAnimationFrame(loop);
  else rafId = 0;
}

let last = 0;
function loop(now: number) {
  const dt = Math.min((now - last) / 1000, 0.064) || 0.016;
  last = now;
  stepSprings(dt);
}

function ensureLoop() {
  if (!rafId) {
    last = performance.now();
    rafId = requestAnimationFrame(loop);
  }
}

export function springTo(
  key: string,
  target: number,
  config: SpringConfig,
  current?: number,
) {
  const existing = springs.get(key);
  if (existing) {
    existing.target = target;
    existing.tension = config.tension;
    existing.friction = config.friction;
  } else {
    springs.set(key, {
      x: current ?? target,
      v: 0,
      target,
      tension: config.tension,
      friction: config.friction,
    });
  }
  ensureLoop();
}

export function readSpring(key: string, fallback = 0) {
  return springs.get(key)?.x ?? fallback;
}

export function subscribeSprings(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (notify: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", notify);
      return () => media.removeEventListener("change", notify);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
export function usePrefersReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
export function useHoverEnabled() {
  return useMediaQuery("(hover: hover) and (min-width: 769px)");
}

export function useInViewOnce<T extends Element>(
  ref: RefObject<T | null>,
  options?: { rootMargin?: string; threshold?: number },
) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      {
        rootMargin: options?.rootMargin ?? "0px 0px -8% 0px",
        threshold: options?.threshold ?? 0.15,
      },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, visible, options?.rootMargin, options?.threshold]);
  return visible;
}

export function scrollProgressFor(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight || 1;
  const start = vh;
  const end = -rect.height;
  const range = start - end || 1;
  return Math.min(1, Math.max(0, (start - rect.top) / range));
}

export function tween(
  from: number,
  to: number,
  durationMs: number,
  easing: (t: number) => number,
  onUpdate: (v: number) => void,
  onDone?: () => void,
) {
  const start = performance.now();
  function frame(now: number) {
    const t = Math.min(1, (now - start) / durationMs);
    onUpdate(from + (to - from) * easing(t));
    if (t < 1) requestAnimationFrame(frame);
    else onDone?.();
  }
  requestAnimationFrame(frame);
}

/** Adaptive rem scale-up above 1920 (media queries handle scale-down). */
export function applyLandingFontScale(root: HTMLElement) {
  const FONT_BASE = 16;
  const BASE_W = 1920;
  const COEF = 0.6666;
  const reduction = ((BASE_W - window.innerWidth) / BASE_W) * 100 * COEF;
  const size = FONT_BASE - (FONT_BASE * reduction) / 100;
  if (size > FONT_BASE) root.style.fontSize = `${size}px`;
  else root.style.removeProperty("font-size");
}
