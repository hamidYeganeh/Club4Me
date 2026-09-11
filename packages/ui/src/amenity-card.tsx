"use client";

import type { ButtonHTMLAttributes } from "react";
import { Icon, type IconName } from "@repo/theme/icon";

import { cn } from "./cn";
import { useFallbackImageSrc } from "./use-fallback-image-src";

export type AmenityCardProps = {
  title: string;
  icon?: IconName;
  backgroundImage?: string | null;
  supportingText?: string;
  variant?: "default" | "equipment" | "amenity";
  className?: string;
  onPress?: () => void;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "onClick">;

export function AmenityCard({
  title,
  icon,
  backgroundImage,
  supportingText,
  variant = "default",
  className,
  onPress,
  type = "button",
  ...buttonProps
}: AmenityCardProps) {
  const hasBackground = Boolean(backgroundImage?.trim());
  const { src: resolvedBackground, onError } =
    useFallbackImageSrc(backgroundImage);

  return (
    <button
      type={type}
      onClick={onPress}
      className={cn(
        "relative isolate flex max-w-full overflow-hidden border text-start",
        variant === "default" && "h-16 w-fit items-center rounded-[18px] p-4",
        variant === "equipment" &&
          "h-[88px] w-[min(82vw,340px)] items-center rounded-3xl p-4",
        variant === "amenity" &&
          "h-[166px] w-[162px] items-end rounded-[2rem] p-3",
        hasBackground
          ? "border-white/10 bg-surface-secondary"
          : "border-border bg-surface",
        onPress
          ? "cursor-pointer transition-transform active:scale-[0.98]"
          : "cursor-default",
        className,
      )}
      {...buttonProps}
    >
      {hasBackground ? (
        <>
          <img
            src={resolvedBackground}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 size-full object-cover"
            onError={onError}
          />
          <div aria-hidden className="absolute inset-0 bg-black/40" />
        </>
      ) : null}

      <div
        className={cn(
          "relative z-10 flex min-w-0",
          variant === "amenity"
            ? "h-full flex-1 flex-col items-start justify-between gap-3"
            : "items-center gap-3",
        )}
      >
        {icon ? (
          <span
            className={cn(
              "grid shrink-0 place-items-center",
              variant === "default" ? "contents" : "size-16 rounded-[21px]",
              variant !== "default" &&
                (hasBackground
                  ? "bg-white/90 text-neutral-900"
                  : "bg-surface-secondary text-foreground"),
            )}
          >
            <Icon
              name={icon}
              size={variant === "default" ? 22 : 32}
              className={cn(
                variant === "default" &&
                  (hasBackground ? "text-white" : "text-foreground"),
              )}
            />
          </span>
        ) : null}
        <div className={cn("min-w-0", variant === "amenity" && "mt-auto")}>
          <p
            className={cn(
              "min-w-0 font-bold",
              variant === "default" ? "truncate" : "line-clamp-2",
              variant === "amenity" && "text-base leading-6",
              hasBackground ? "text-white" : "text-foreground",
            )}
          >
            {title}
          </p>
          {supportingText ? (
            <p
              className={cn(
                "mt-1 line-clamp-2 text-sm",
                hasBackground ? "text-white/75" : "text-muted",
              )}
            >
              {supportingText}
            </p>
          ) : null}
        </div>
      </div>
    </button>
  );
}
