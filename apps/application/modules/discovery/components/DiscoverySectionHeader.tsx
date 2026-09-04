"use client";

import { Typography } from "@heroui/react";
import { Icon, type IconName } from "@theme/icon";

import { ButtonLink } from "@/components/button-link";

type DiscoverySectionHeaderProps = {
  title: string;
  subtitle?: string;
  icon?: IconName;
  id?: string;
  accent?: boolean;
  className?: string;
  viewAllLabel?: string;
  viewAllUrl?: string;
};

export function DiscoverySectionHeader({
  title,
  subtitle,
  icon,
  id,
  accent = false,
  className,
  viewAllLabel,
  viewAllUrl,
}: DiscoverySectionHeaderProps) {
  return (
    <div
      className={`flex items-start justify-between gap-3 ${className ?? ""}`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {icon ? (
            <span
              aria-hidden
              className={`shrink-0 ${
                accent ? "text-[#24272c]" : "text-accent"
              }`}
            >
              <Icon name={icon} size={18} />
            </span>
          ) : null}
          <Typography
            id={id}
            type="h5"
            weight="bold"
            className={accent ? "text-[#24272c]" : "text-foreground"}
          >
            {title}
          </Typography>
        </div>
        {subtitle ? (
          <Typography
            type="body-sm"
            color={accent ? undefined : "muted"}
            className={
              accent ? "mt-1 text-[#66591f]" : icon ? "mt-1 ms-7" : "mt-1"
            }
          >
            {subtitle}
          </Typography>
        ) : null}
      </div>
      {viewAllLabel && viewAllUrl ? (
        <ButtonLink
          href={viewAllUrl}
          variant="ghost"
          size="sm"
          className={`mt-0.5 h-auto min-h-0 shrink-0 rounded-full px-3 py-2 text-xs font-bold ${
            accent
              ? "bg-[#24272c]/10 text-[#24272c]"
              : "bg-accent/10 text-accent"
          }`}
        >
          {viewAllLabel}
        </ButtonLink>
      ) : (
        <span
          aria-hidden
          className={`mt-1 inline-flex size-8 items-center justify-center rounded-full ${
            accent
              ? "bg-[#24272c]/10 text-[#24272c]"
              : "bg-accent/15 text-accent"
          }`}
        >
          <Icon name="sparkle-1" size={16} />
        </span>
      )}
    </div>
  );
}
