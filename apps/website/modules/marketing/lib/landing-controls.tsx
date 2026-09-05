"use client";

import { ArrowRight } from "@modules/marketing/icons/icons/ArrowRight";
import { CloseX } from "@modules/marketing/icons/icons/CloseX";
import { LogoMark } from "@modules/marketing/components/common/LogoMark";
import { useState } from "react";
import { useHoverEnabled } from "./landing-motion";
import { cn } from "./marketing-cn";

export function LandingPillButton({
  children,
  variant = "light",
  className,
  onPress,
  type = "button",
  disabled,
}: {
  children: React.ReactNode;
  variant?: "light" | "solid" | "outline";
  className?: string;
  onPress?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const hover = useHoverEnabled();
  const [x, setX] = useState(0);

  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold tracking-wide transition-colors duration-moderate ease-app disabled:opacity-50",
        variant === "light" &&
          "bg-background text-foreground hover:bg-accent hover:text-accent-foreground",
        variant === "solid" &&
          "bg-accent text-accent-foreground hover:opacity-90",
        variant === "outline" &&
          "border border-border bg-transparent text-foreground hover:border-foreground hover:bg-foreground hover:text-background",
        className,
      )}
      onClick={onPress}
      onPointerEnter={() => hover && setX(5)}
      onPointerLeave={() => setX(0)}
    >
      {children}
      <ArrowRight
        size={16}
        className="transition-transform duration-moderate ease-app"
        style={{ transform: `translateX(${x}px)` }}
        aria-hidden
      />
    </button>
  );
}

export function LandingArrowButton({
  direction = "next",
  variant = "outline",
  onPress,
  label,
}: {
  direction?: "prev" | "next";
  variant?: "outline" | "solid";
  onPress: () => void;
  label: string;
}) {
  const hover = useHoverEnabled();
  const [scale, setScale] = useState(1);

  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "grid size-12 place-items-center rounded-full border transition-colors duration-moderate ease-app sm:size-14",
        variant === "outline" &&
          "border-border bg-surface text-foreground hover:border-foreground",
        variant === "solid" &&
          "border-foreground bg-foreground text-background hover:bg-accent hover:text-accent-foreground hover:border-accent",
      )}
      onClick={onPress}
      onPointerEnter={() => hover && setScale(1.12)}
      onPointerLeave={() => setScale(1)}
    >
      <ArrowRight
        size={20}
        className="transition-transform duration-moderate ease-app"
        style={{
          transform: `scale(${scale}) ${direction === "prev" ? "scaleX(-1)" : ""}`,
        }}
        aria-hidden
      />
    </button>
  );
}

export function CloseIconButton({
  onPress,
  tone = "dark",
  label,
}: {
  onPress: () => void;
  tone?: "dark" | "light";
  label: string;
}) {
  const hover = useHoverEnabled();
  const [rot, setRot] = useState(0);

  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "grid size-10 place-items-center rounded-full transition-colors duration-moderate ease-app",
        tone === "dark" &&
          "bg-surface-secondary text-foreground hover:bg-border",
        tone === "light" &&
          "bg-(--glass-fill) text-(--on-brand) hover:opacity-90",
      )}
      onClick={onPress}
      onPointerEnter={() => hover && setRot(90)}
      onPointerLeave={() => setRot(0)}
    >
      <CloseX
        size={20}
        aria-hidden
        className="transition-transform duration-moderate ease-app"
        style={{ transform: `rotate(${rot}deg)` }}
      />
    </button>
  );
}

export function BrandMark({
  size = 20,
  className,
  instanceId = "landing",
}: {
  size?: number;
  className?: string;
  instanceId?: string;
}) {
  return (
    <LogoMark
      size={size}
      className={className}
      instanceId={instanceId}
      shadow={false}
      gradient={false}
    />
  );
}
