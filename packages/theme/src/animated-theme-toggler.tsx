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
  | "circle-blur"
  | "blinds"
  | "circle"
  | "square"
  | "triangle"
  | "diamond"
  | "hexagon"
  | "rectangle"
  | "star";

export type RectStart =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "center"
  | "bottom-up";

const RECT_FROM: Record<RectStart, string> = {
  "top-left": "inset(0 100% 100% 0)",
  "top-right": "inset(0 0 100% 100%)",
  "bottom-left": "inset(100% 100% 0 0)",
  "bottom-right": "inset(100% 0 0 100%)",
  center: "inset(50% 50% 50% 50%)",
  "bottom-up": "inset(100% 0 0 0)",
};

export interface AnimatedThemeTogglerProps extends ComponentPropsWithoutRef<"button"> {
  duration?: number;
  start?: RectStart;
  iconClassName?: string;
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
  variant: Exclude<TransitionVariant, "circle-blur" | "blinds">,
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
  duration,
  variant = "rectangle",
  start = "bottom-up",
  iconClassName,
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
    const root = document.documentElement;
    // One viewport transition at a time, including across multiple toggles.
    if (root.dataset.themeVt) return;
    const nextIsDark = !isDark;
    const nextTheme = nextIsDark ? "dark" : "light";
    const applyTheme = () => {
      // Commit the DOM inside the snapshot callback. next-themes also owns
      // persistence and context, but its effect alone can miss the snapshot.
      root.classList.toggle("dark", nextIsDark);
      root.classList.toggle("light", !nextIsDark);
      root.style.colorScheme = nextTheme;
      if (isControlled) {
        onThemeChange?.(nextTheme);
      } else {
        setInternalIsDark(nextIsDark);
        try {
          localStorage.setItem("theme", nextTheme);
        } catch {
          /* Storage may be unavailable. */
        }
      }
    };

    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      typeof document.startViewTransition !== "function"
    ) {
      applyTheme();
      return;
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const origin = fromCenter ? "center" : start;
    const x = origin.endsWith("left")
      ? 0
      : origin.endsWith("right")
        ? width
        : width / 2;
    const y = origin.startsWith("top")
      ? 0
      : origin === "center"
        ? height / 2
        : height;
    const radius = Math.hypot(Math.max(x, width - x), Math.max(y, height - y));
    const bounds = buttonRef.current?.getBoundingClientRect();
    const legacyX =
      fromCenter || !bounds ? width / 2 : bounds.left + bounds.width / 2;
    const legacyY =
      fromCenter || !bounds ? height / 2 : bounds.top + bounds.height / 2;
    const legacyRadius = Math.hypot(
      Math.max(legacyX, width - legacyX),
      Math.max(legacyY, height - legacyY),
    );
    const clipPaths =
      variant === "rectangle"
        ? [RECT_FROM[origin], "inset(0 0 0 0)"]
        : variant === "circle" ||
            variant === "circle-blur" ||
            variant === "blinds"
          ? getThemeTransitionClipPaths("circle", x, y, radius, width, height)
          : getThemeTransitionClipPaths(
              variant,
              legacyX,
              legacyY,
              legacyRadius,
              width,
              height,
            );

    root.dataset.themeVt = variant;
    root.style.setProperty("--theme-vt-from", clipPaths[0]!);
    root.style.setProperty("--theme-vt-to", clipPaths[1]!);
    root.style.setProperty(
      "--theme-vt-duration",
      `${duration ?? (variant === "rectangle" ? 400 : 700)}ms`,
    );
    root.style.setProperty(
      "--theme-vt-ease",
      variant === "rectangle" ? "ease-out" : "cubic-bezier(0.4, 0, 0.2, 1)",
    );
    const cleanup = () => {
      delete root.dataset.themeVt;
      for (const property of ["from", "to", "duration", "ease"]) {
        root.style.removeProperty(`--theme-vt-${property}`);
      }
    };
    try {
      const transition = document.startViewTransition(() =>
        flushSync(applyTheme),
      );
      // A skipped transition must still switch themes and release the lock.
      void transition.ready.catch(() => undefined);
      void transition.finished.then(cleanup, cleanup);
    } catch {
      cleanup();
      applyTheme();
    }
  }, [
    duration,
    fromCenter,
    isControlled,
    isDark,
    onThemeChange,
    start,
    variant,
  ]);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (!event.defaultPrevented) toggleTheme();
  };

  return (
    <button
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      {...props}
      type="button"
      ref={buttonRef}
      onClick={handleClick}
      className={cn(className)}
    >
      <span
        key={String(isDark)}
        className={cn("theme-toggle-icon", iconClassName)}
        aria-hidden="true"
      >
        <Icon name={isDark ? "sun" : "moon"} />
      </span>
    </button>
  );
}
