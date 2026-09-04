import type { ButtonHTMLAttributes } from "react";
import { Icon, type IconName } from "@repo/theme/icon";

import { cn } from "./cn";

export type AmenityCardProps = {
  title: string;
  icon?: IconName;
  backgroundImage?: string;
  className?: string;
  onPress?: () => void;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "onClick">;

export function AmenityCard({
  title,
  icon,
  backgroundImage,
  className,
  onPress,
  type = "button",
  ...buttonProps
}: AmenityCardProps) {
  const hasBackground = Boolean(backgroundImage);

  return (
    <button
      type={type}
      onClick={onPress}
      className={cn(
        "relative isolate flex h-16 w-fit max-w-full items-center overflow-hidden rounded-[18px] border p-4 text-start",
        hasBackground
          ? "border-white/10 bg-surface-secondary"
          : "border-border bg-surface",
        onPress ? "cursor-pointer transition-transform active:scale-[0.98]" : "cursor-default",
        className,
      )}
      {...buttonProps}
    >
      {backgroundImage ? (
        <>
          <img
            src={backgroundImage}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
          <div aria-hidden className="absolute inset-0 bg-black/40" />
        </>
      ) : null}

      <div className="relative z-10 flex min-w-0 items-center gap-2.5">
        {icon ? (
          <Icon
            name={icon}
            size={22}
            className={cn(
              "shrink-0",
              hasBackground ? "text-white" : "text-foreground",
            )}
          />
        ) : null}
        <p
          className={cn(
            "min-w-0 truncate font-semibold",
            hasBackground ? "text-white" : "text-foreground",
          )}
        >
          {title}
        </p>
      </div>
    </button>
  );
}
