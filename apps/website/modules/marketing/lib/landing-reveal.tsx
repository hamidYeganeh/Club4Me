"use client";

import { useEffect, useId, useRef, useState } from "react";
import { EASE, LANDING_DURATION_MS, LANDING_EASE_CSS } from "./landing-motion";
import { cn } from "./marketing-cn";

type ClipRevealProps = {
  text: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  mode?: "words" | "lines";
  className?: string;
  active?: boolean;
  baseDelay?: number;
  stagger?: number;
  duration?: number;
  easing?: (t: number) => number;
  lineClassName?: string;
  id?: string;
};

export function ClipReveal({
  text,
  as: Tag = "p",
  mode = "lines",
  className,
  active = true,
  baseDelay = 0,
  stagger = 120,
  duration = LANDING_DURATION_MS.reveal,
  easing = EASE.outFluid,
  lineClassName,
  id,
}: ClipRevealProps) {
  const units =
    mode === "words"
      ? text.split(/\s+/).filter(Boolean)
      : text.split("\n").filter(Boolean);
  const [shown, setShown] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    if (!active) {
      const reset = window.setTimeout(() => setShown(false), 0);
      return () => window.clearTimeout(reset);
    }
    const t = window.setTimeout(() => setShown(true), 16);
    timers.current.push(t);
    return () => timers.current.forEach((x) => window.clearTimeout(x));
  }, [active, text]);

  return (
    <Tag id={id} className={className} aria-label={text.replace(/\n/g, " ")}>
      {units.map((unit, i) => (
        <span
          key={`${unit}-${i}`}
          className={cn(
            "landing-clip",
            mode === "words" && "landing-clip--word inline-block align-top",
            mode === "lines" && "block",
            lineClassName,
          )}
          aria-hidden
        >
          <span
            className={cn("landing-clip-inner", shown && "is-in")}
            style={{
              transitionDuration: shown ? `${duration}ms` : undefined,
              transitionDelay: shown
                ? `${baseDelay + i * stagger}ms`
                : undefined,
            }}
          >
            {unit}
            {mode === "words" ? "\u00A0" : null}
          </span>
        </span>
      ))}
      <span className="hidden" aria-hidden>
        {easing(1)}
      </span>
    </Tag>
  );
}

export function FadeWords({
  text,
  className,
  active = true,
  baseDelay = 250,
  stagger = 28,
  duration = LANDING_DURATION_MS.reveal,
}: {
  text: string;
  className?: string;
  active?: boolean;
  baseDelay?: number;
  stagger?: number;
  duration?: number;
}) {
  const words = text.split(/\s+/).filter(Boolean);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!active) {
      const reset = window.setTimeout(() => setShown(false), 0);
      return () => window.clearTimeout(reset);
    }
    const t = window.setTimeout(() => setShown(true), 16);
    return () => window.clearTimeout(t);
  }, [active, text]);

  return (
    <p className={className} aria-label={text}>
      {words.map((w, i) => (
        <span
          key={`${w}-${i}`}
          className="inline-block transition-[opacity,transform] ease-app"
          style={{
            opacity: shown ? 1 : 0,
            transform: shown ? "translateY(0)" : "translateY(18px)",
            transitionDuration: `${duration}ms`,
            transitionDelay: shown ? `${baseDelay + i * stagger}ms` : undefined,
          }}
          aria-hidden
        >
          {w}
          {"\u00A0"}
        </span>
      ))}
    </p>
  );
}

export function InViewRise({
  children,
  className,
  delayIn = 0,
  fromY = 28,
  fromScale,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  delayIn?: number;
  fromY?: number;
  fromScale?: number;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  const fired = useRef(false);
  const uid = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el || fired.current) return;
    let killed = false;

    const activate = () => {
      if (fired.current || killed) return;
      fired.current = true;
      window.setTimeout(() => {
        if (!killed) setOn(true);
      }, delayIn);
      io.disconnect();
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) activate();
      },
      { threshold: 0.08, rootMargin: "0px 0px -4% 0px" },
    );
    io.observe(el);

    return () => {
      killed = true;
      io.disconnect();
    };
  }, [delayIn, uid]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        opacity: on ? 1 : 0,
        transform: on
          ? "translateY(0) scale(1)"
          : `translateY(${fromY}px) scale(${fromScale ?? 1})`,
        transition: `opacity ${LANDING_DURATION_MS.reveal}ms ${LANDING_EASE_CSS}, transform ${LANDING_DURATION_MS.reveal}ms ${LANDING_EASE_CSS}`,
      }}
    >
      {children}
    </div>
  );
}

export function CarouselDots({
  count,
  active,
  onSelect,
  tone = "dark",
}: {
  count: number;
  active: number;
  onSelect: (i: number) => void;
  tone?: "dark" | "light";
}) {
  return (
    <div
      className="flex items-center gap-2"
      role="group"
      aria-label="انتخاب مربی"
    >
      {Array.from({ length: count }, (_, i) => {
        const isActive = i === active;
        return (
          <button
            key={i}
            type="button"
            aria-current={isActive ? "true" : undefined}
            aria-label={`Slide ${i + 1}`}
            className="p-1.5"
            onClick={() => onSelect(i)}
          >
            <span
              className={cn(
                "block h-1.5 rounded-full transition-[width,background-color] duration-moderate ease-app",
                isActive ? "w-5" : "w-1.5",
                tone === "dark"
                  ? isActive
                    ? "bg-foreground"
                    : "bg-border"
                  : isActive
                    ? "bg-(--on-brand)"
                    : "bg-(--glass-border)",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
