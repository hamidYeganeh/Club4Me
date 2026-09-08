"use client";

import Image from "next/image";
import Link from "@/components/app-link";
import { Card } from "@heroui/react";
import { Icon } from "@theme/icon";
import { useFallbackImageSrc } from "@ui/use-fallback-image-src";

export function DiscoveryResultCard({
  title,
  subtitle,
  meta,
  imageUrl,
  href,
  badge,
}: {
  title: string;
  subtitle: string;
  meta?: string;
  imageUrl?: string | null;
  href: string;
  badge?: string;
}) {
  const { src, onError } = useFallbackImageSrc(imageUrl);

  return (
    <Card className="app-card group relative flex min-h-29 flex-row items-center gap-3 overflow-hidden p-3 shadow-none transition-colors hover:bg-surface-secondary">
      <div className="relative size-22 shrink-0 overflow-hidden rounded-[1.15rem] bg-surface-secondary">
        <Image
          src={src}
          alt={title}
          fill
          unoptimized
          sizes="88px"
          className="object-cover transition-transform duration-300 ease-out group-hover:scale-105 motion-reduce:transition-none"
          onError={onError}
        />
        {badge ? (
          <span className="absolute right-2 bottom-2 rounded-full border border-white/10 bg-background/75 px-2 py-1 text-[10px] font-bold text-foreground backdrop-blur-md">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <Card.Title className="line-clamp-1 text-base text-foreground">
          {title}
        </Card.Title>
        <Card.Description className="mt-1 line-clamp-2 text-sm leading-6 text-muted">
          {subtitle}
        </Card.Description>
        {meta ? (
          <p className="mt-2 text-xs leading-6 font-semibold text-accent tabular-nums">
            {meta}
          </p>
        ) : null}
      </div>
      <Icon name="chevron-left" size={18} className="shrink-0 text-muted" />
      <Link
        href={href}
        aria-label={title}
        className="absolute inset-0 rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-focus"
      />
    </Card>
  );
}
