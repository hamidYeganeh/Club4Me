"use client";

import { cn } from "@/lib/cn";
import Image, { type ImageProps } from "next/image";
import { useFallbackImageSrc } from "@ui/use-fallback-image-src";

type FallbackImageProps = Omit<ImageProps, "src" | "onError"> & {
  src?: string | null;
};

/** Next/Image that falls back to `/fallback.jpg` when missing or unloadable. */
export function FallbackImage({
  src,
  alt,
  className,
  ...props
}: FallbackImageProps) {
  const { src: resolvedSrc, onError } = useFallbackImageSrc(src);
  return (
    <Image
      {...props}
      className={cn(className, "object-cover")}
      src={resolvedSrc}
      alt={alt}
      onError={onError}
    />
  );
}
