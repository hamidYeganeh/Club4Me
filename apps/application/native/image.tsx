/* eslint @typescript-eslint/no-unused-vars: ["warn", { "argsIgnorePattern": "^_" }] */
/* Native images use the device file server; Next's image server is unavailable. */
/* eslint-disable @next/next/no-img-element */
import { forwardRef } from "react";
import type { ImageProps } from "next/image";

/** Assets in the native bundle need no image server. Remote images retain normal HTTP caching. */
export default forwardRef<HTMLImageElement, ImageProps>(function NativeImage(
  {
    src,
    alt,
    fill,
    priority,
    unoptimized: _unoptimized,
    quality: _quality,
    placeholder: _placeholder,
    blurDataURL: _blur,
    loader: _loader,
    onLoadingComplete,
    style,
    onLoad,
    ...props
  },
  ref,
) {
  const source =
    typeof src === "string"
      ? src
      : "default" in src
        ? src.default.src
        : src.src;
  return (
    <img
      {...props}
      ref={ref}
      src={source}
      alt={alt}
      loading={priority ? "eager" : props.loading}
      style={
        fill
          ? {
              position: "absolute",
              width: "100%",
              height: "100%",
              inset: 0,
              ...style,
            }
          : style
      }
      onLoad={(event) => {
        onLoad?.(event);
        onLoadingComplete?.(event.currentTarget);
      }}
    />
  );
});
