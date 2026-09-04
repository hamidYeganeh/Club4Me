"use client";

import { Typography } from "@heroui/react";
import { Icon } from "@theme/icon";
import Link from "next/link";

type DiscoverySectionHeaderProps = {
  title: string;
  subtitle?: string;
  id?: string;
  accent?: boolean;
  className?: string;
  viewAllLabel?: string;
  viewAllUrl?: string;
};

export function DiscoverySectionHeader({
  title,
  subtitle,
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
        <Typography
          id={id}
          type="h5"
          weight="bold"
          className={accent ? "text-[#24272c]" : "text-foreground"}
        >
          {title}
        </Typography>
        {subtitle ? (
          <Typography
            type="body-sm"
            className={
              accent ? "mt-1 text-[#66591f]" : "mt-1 text-foreground/60"
            }
          >
            {subtitle}
          </Typography>
        ) : null}
      </div>
      {viewAllLabel && viewAllUrl ? (
        <Link
          href={viewAllUrl}
          className="mt-1 shrink-0 rounded-full bg-accent/10 px-3 py-2 text-xs font-bold text-accent"
        >
          {viewAllLabel}
        </Link>
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
