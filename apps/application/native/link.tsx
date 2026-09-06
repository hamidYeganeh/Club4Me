/* All route chunks are bundled on-device, so the Next prefetch option is intentionally ignored. */
/* eslint @typescript-eslint/no-unused-vars: ["warn", { "argsIgnorePattern": "^_" }] */
import { forwardRef, type AnchorHTMLAttributes } from "react";
import type { UrlObject } from "url";
import { navigate } from "./navigation";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string | UrlObject;
  replace?: boolean;
  scroll?: boolean;
  prefetch?: boolean | null;
};
export default forwardRef<HTMLAnchorElement, Props>(function NativeLink(
  { href, replace, scroll, prefetch: _prefetch, onClick, ...props },
  ref,
) {
  const target =
    typeof href === "string"
      ? href
      : `${href.pathname ?? "/"}${href.query ? `?${new URLSearchParams(href.query as Record<string, string>)}` : ""}${href.hash ?? ""}`;
  return (
    <a
      {...props}
      ref={ref}
      href={target}
      onClick={(event) => {
        onClick?.(event);
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          props.target === "_blank" ||
          props.download
        )
          return;
        if (
          new URL(target, window.location.href).origin !==
          window.location.origin
        )
          return;
        event.preventDefault();
        navigate(target, replace, scroll);
      }}
    />
  );
});
