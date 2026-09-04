"use client";

import { useCallback, useState } from "react";

import { FALLBACK_IMAGE_SRC, resolveImageSrc } from "./fallback-image";

/**
 * Resolves a media URL to the shared fallback when missing, and swaps to the
 * fallback if the preferred image fails to load.
 */
export function useFallbackImageSrc(src?: string | null) {
  const preferred = resolveImageSrc(src);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const onError = useCallback(() => {
    setFailedSrc((current) => {
      if (preferred === FALLBACK_IMAGE_SRC) return current;
      return preferred;
    });
  }, [preferred]);

  const srcFailed = failedSrc === preferred;
  const resolvedSrc =
    srcFailed && preferred !== FALLBACK_IMAGE_SRC
      ? FALLBACK_IMAGE_SRC
      : preferred;

  return { src: resolvedSrc, onError };
}
