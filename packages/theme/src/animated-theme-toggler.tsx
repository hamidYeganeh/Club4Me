"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type MouseEvent,
} from "react";
import { flushSync } from "react-dom";

import { cn } from "./cn";
import { Icon } from "./icon";

export type TransitionVariant =
  | "circle"
  | "square"
  | "triangle"
  | "diamond"
  | "hexagon"
  | "rectangle"
  | "star";

export interface AnimatedThemeTogglerProps extends ComponentPropsWithoutRef<"button"> {
  duration?: number;
  variant?: TransitionVariant;
  /** When true, the transition expands from the viewport center. */
  fromCenter?: boolean;
  /** Controlled theme value. The parent owns persistence when provided. */
  theme?: "light" | "dark";
  /** Called on toggle. Pair with `theme` for controlled usage. */
  onThemeChange?: (theme: "light" | "dark") => void;
}

function polygonCollapsed(point: string, vertexCount: number): string {
  return `polygon(${Array.from({ length: vertexCount }, () => point).join(", ")})`;
}

function getThemeTransitionClipPaths(
  variant: TransitionVariant,
  cx: number,
  cy: number,
  maxRadius: number,
  viewportWidth: number,
  viewportHeight: number,
): [string, string] {
  // Percentage coordinates avoid incorrect positioning on fractional display
  // scales in the first transition after load.
  const toX = (x: number) => `${(x / viewportWidth) * 100}%`;
  const toY = (y: number) => `${(y / viewportHeight) * 100}%`;
  const point = (x: number, y: number) => `${toX(x)} ${toY(y)}`;
  const toRadius = (radius: number) =>
    `${(radius / (Math.hypot(viewportWidth, viewportHeight) / Math.SQRT2)) * 100}%`;

  switch (variant) {
    case "circle":
      return [
        `circle(0% at ${point(cx, cy)})`,
        `circle(${toRadius(maxRadius)} at ${point(cx, cy)})`,
      ];
    case "square": {
      const halfWidth = Math.max(cx, viewportWidth - cx);
      const halfHeight = Math.max(cy, viewportHeight - cy);
      const halfSide = Math.max(halfWidth, halfHeight) * 1.05;
      const end = [
        point(cx - halfSide, cy - halfSide),
        point(cx + halfSide, cy - halfSide),
        point(cx + halfSide, cy + halfSide),
        point(cx - halfSide, cy + halfSide),
      ].join(", ");
      return [polygonCollapsed(point(cx, cy), 4), `polygon(${end})`];
    }
    case "triangle": {
      const scale = maxRadius * 2.2;
      const dx = (Math.sqrt(3) / 2) * scale;
      const vertices = [
        point(cx, cy - scale),
        point(cx + dx, cy + scale * 0.5),
        point(cx - dx, cy + scale * 0.5),
      ].join(", ");
      return [polygonCollapsed(point(cx, cy), 3), `polygon(${vertices})`];
    }
    case "diamond": {
      const radius = maxRadius * Math.SQRT2;
      const end = [
        point(cx, cy - radius),
        point(cx + radius, cy),
        point(cx, cy + radius),
        point(cx - radius, cy),
      ].join(", ");
      return [polygonCollapsed(point(cx, cy), 4), `polygon(${end})`];
    }
    case "hexagon": {
      const radius = maxRadius * Math.SQRT2;
      const vertices: string[] = [];
      for (let index = 0; index < 6; index += 1) {
        const angle = -Math.PI / 2 + (index * Math.PI) / 3;
        vertices.push(
          point(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)),
        );
      }
      return [
        polygonCollapsed(point(cx, cy), 6),
        `polygon(${vertices.join(", ")})`,
      ];
    }
    case "rectangle": {
      const halfWidth = Math.max(cx, viewportWidth - cx);
      const halfHeight = Math.max(cy, viewportHeight - cy);
      const end = [
        point(cx - halfWidth, cy - halfHeight),
        point(cx + halfWidth, cy - halfHeight),
        point(cx + halfWidth, cy + halfHeight),
        point(cx - halfWidth, cy + halfHeight),
      ].join(", ");
      return [polygonCollapsed(point(cx, cy), 4), `polygon(${end})`];
    }
    case "star": {
      const radius = maxRadius * Math.SQRT2 * 1.03;
      const innerRatio = 0.42;
      const starPolygon = (currentRadius: number) => {
        const vertices: string[] = [];
        for (let index = 0; index < 5; index += 1) {
          const outerAngle = -Math.PI / 2 + (index * 2 * Math.PI) / 5;
          vertices.push(
            point(
              cx + currentRadius * Math.cos(outerAngle),
              cy + currentRadius * Math.sin(outerAngle),
            ),
          );
          const innerAngle = outerAngle + Math.PI / 5;
          vertices.push(
            point(
              cx + currentRadius * innerRatio * Math.cos(innerAngle),
              cy + currentRadius * innerRatio * Math.sin(innerAngle),
            ),
          );
        }
        return `polygon(${vertices.join(", ")})`;
      };

      return [starPolygon(Math.max(2, radius * 0.025)), starPolygon(radius)];
    }
  }
}

export function AnimatedThemeToggler({
  className,
  duration = 400,
  variant = "circle",
  fromCenter = false,
  theme,
  onThemeChange,
  onClick,
  ...props
}: AnimatedThemeTogglerProps) {
  const isControlled = theme !== undefined;
  const [internalIsDark, setInternalIsDark] = useState(false);
  const isDark = isControlled ? theme === "dark" : internalIsDark;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isTransitioningRef = useRef(false);
  const activeAnimationRef = useRef<Animation | null>(null);

  const cancelAnimation = useCallback(() => {
    activeAnimationRef.current?.cancel();
    activeAnimationRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      cancelAnimation();
      const root = document.documentElement;
      if (root.dataset.magicuiThemeVt !== "active") return;
      delete root.dataset.magicuiThemeVt;
      root.style.removeProperty("--magicui-theme-toggle-vt-duration");
      root.style.removeProperty("--magicui-theme-vt-clip-from");
      root.style.removeProperty("--magicui-theme-vt-clip-to");
      root.style.removeProperty("--magicui-theme-vt-easing");
    };
  }, [cancelAnimation]);

  useEffect(() => {
    if (isControlled) return;

    const updateTheme = () => {
      setInternalIsDark(document.documentElement.classList.contains("dark"));
    };
    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, [isControlled]);

  const toggleTheme = useCallback(() => {
    const button = buttonRef.current;
    const root = document.documentElement;
    if (
      !button ||
      isTransitioningRef.current ||
      root.dataset.magicuiThemeVt === "active"
    ) {
      return;
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const bounds = button.getBoundingClientRect();
    const x = fromCenter ? viewportWidth / 2 : bounds.left + bounds.width / 2;
    const y = fromCenter ? viewportHeight / 2 : bounds.top + bounds.height / 2;
    const maxRadius = Math.hypot(
      Math.max(x, viewportWidth - x),
      Math.max(y, viewportHeight - y),
    );
    const nextIsDark = !isDark;
    const nextTheme = nextIsDark ? "dark" : "light";

    const applyTheme = () => {
      root.classList.toggle("dark", nextIsDark);
      root.classList.toggle("light", !nextIsDark);
      if (isControlled) {
        onThemeChange?.(nextTheme);
      } else {
        setInternalIsDark(nextIsDark);
        localStorage.setItem("theme", nextTheme);
      }
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      applyTheme();
      return;
    }

    const clipPath = getThemeTransitionClipPaths(
      variant,
      x,
      y,
      maxRadius,
      viewportWidth,
      viewportHeight,
    );

    const cleanup = () => {
      isTransitioningRef.current = false;
      delete root.dataset.magicuiThemeVt;
      root.style.removeProperty("--magicui-theme-toggle-vt-duration");
      root.style.removeProperty("--magicui-theme-vt-clip-from");
      root.style.removeProperty("--magicui-theme-vt-clip-to");
      root.style.removeProperty("--magicui-theme-vt-easing");
      cancelAnimation();
    };

    const runFallbackTransition = () => {
      const body = document.body;
      const previousRootBackground = root.style.backgroundColor;
      const previousBodyClipPath = body.style.clipPath;
      const previousBodyTransition = body.style.transition;
      const previousBodyWillChange = body.style.willChange;
      const oldBackground = getComputedStyle(body).backgroundColor;
      const pageY = y + window.scrollY;
      const clipFrom = `circle(0px at ${x}px ${pageY}px)`;
      const clipTo = `circle(${Math.ceil(maxRadius)}px at ${x}px ${pageY}px)`;

      isTransitioningRef.current = true;
      root.style.backgroundColor = oldBackground;
      body.style.clipPath = clipFrom;
      body.style.transition = "none";
      body.style.willChange = "clip-path";
      body.getBoundingClientRect();
      flushSync(applyTheme);

      let finished = false;
      let timeoutId = 0;
      const finish = () => {
        if (finished) return;
        finished = true;
        window.clearTimeout(timeoutId);
        body.removeEventListener("transitionend", handleTransitionEnd);
        body.style.clipPath = previousBodyClipPath;
        body.style.transition = previousBodyTransition;
        body.style.willChange = previousBodyWillChange;
        if (previousRootBackground) {
          root.style.backgroundColor = previousRootBackground;
        } else {
          root.style.removeProperty("background-color");
        }
        cleanup();
      };
      const handleTransitionEnd = (event: TransitionEvent) => {
        if (event.target === body && event.propertyName === "clip-path") {
          finish();
        }
      };

      body.addEventListener("transitionend", handleTransitionEnd);
      requestAnimationFrame(() => {
        body.style.transition = `clip-path ${duration}ms ${
          variant === "star" ? "linear" : "ease-in-out"
        }`;
        body.style.clipPath = clipTo;
        timeoutId = window.setTimeout(finish, duration + 150);
      });
    };

    if (typeof document.startViewTransition !== "function") {
      runFallbackTransition();
      return;
    }

    root.dataset.magicuiThemeVt = "active";
    root.style.setProperty(
      "--magicui-theme-toggle-vt-duration",
      `${duration}ms`,
    );
    root.style.setProperty("--magicui-theme-vt-clip-from", clipPath[0]);
    root.style.setProperty("--magicui-theme-vt-clip-to", clipPath[1]);
    root.style.setProperty(
      "--magicui-theme-vt-easing",
      variant === "star" ? "linear" : "ease-in-out",
    );
    isTransitioningRef.current = true;

    try {
      const transition = document.startViewTransition(() => {
        flushSync(applyTheme);
      });
      transition.finished.finally(cleanup).catch(() => undefined);
    } catch {
      cleanup();
      runFallbackTransition();
    }
  }, [
    cancelAnimation,
    duration,
    fromCenter,
    isControlled,
    isDark,
    onThemeChange,
    variant,
  ]);

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (!event.defaultPrevented) toggleTheme();
    },
    [onClick, toggleTheme],
  );

  return (
    <button
      {...props}
      type="button"
      ref={buttonRef}
      onClick={handleClick}
      className={cn(className)}
    >
      {isDark ? <Icon name="sun" /> : <Icon name="moon" />}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
