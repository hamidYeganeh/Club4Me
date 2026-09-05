"use client";
import { CoverImage } from "@/components/cover-image";
import type { MediaImageProps } from "./MediaImage.types";
export function MediaImage({
  image,
  alt = "",
  className,
  priority,
}: MediaImageProps) {
  if (typeof image !== "string")
    return <div className={className}>{image}</div>;
  return (
    <CoverImage
      src={image}
      alt={alt}
      className={className}
      priority={priority}
    />
  );
}
