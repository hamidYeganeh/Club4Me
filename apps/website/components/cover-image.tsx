"use client";

import { useFallbackImageSrc } from "@ui/use-fallback-image-src";

type CoverImageProps = {
  src?: string | null;
  alt: string;
  priority?: boolean;
  className?: string;
};

export function CoverImage({
  src,
  alt,
  priority = false,
  className = "absolute inset-0 size-full object-cover",
}: CoverImageProps) {
  const { src: resolvedSrc, onError } = useFallbackImageSrc(src);

  return (
    // Native img avoids Next image optimizer SSRF checks on remote hosts.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      onError={onError}
      fetchPriority={priority ? "high" : undefined}
      decoding={priority ? "sync" : "async"}
      loading={priority ? "eager" : "lazy"}
    />
  );
}
