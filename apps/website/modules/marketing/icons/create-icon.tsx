"use client";

import { forwardRef, type ReactNode, type SVGProps } from "react";

export type IconProps = Omit<SVGProps<SVGSVGElement>, "ref"> & {
  size?: number | string;
  title?: string;
  /**
   * Horizontally flip in RTL contexts.
   * Defaults to `true` for directional icons (Left/Right/Forward/Backward, etc.).
   */
  rtlMirror?: boolean;
};

/** Icons whose geometry encodes a horizontal direction and should flip in RTL. */
export function isRtlMirrorIcon(displayName: string): boolean {
  if (
    /LeftRight|RightLeft|DownUp|UpDown|Horizontal|TextAlign|Toggle(Left|Right)/.test(
      displayName,
    )
  ) {
    return false;
  }

  return /Left|Right|Forward|Backward|Reply|Redo|Undo|SignIn|SignOut/.test(
    displayName,
  );
}

export type CreateIconOptions = {
  /** Override auto-detection for RTL mirroring. */
  rtlMirror?: boolean;
};

export function createIcon(
  displayName: string,
  viewBox: string,
  children: ReactNode,
  options?: CreateIconOptions,
) {
  const defaultRtlMirror = options?.rtlMirror ?? isRtlMirrorIcon(displayName);

  const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon(
    {
      size = 24,
      title,
      color = "currentColor",
      className,
      style,
      rtlMirror = defaultRtlMirror,
      ...props
    },
    ref,
  ) {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox={viewBox}
        width={size}
        height={size}
        fill="none"
        color={color}
        className={className}
        style={style}
        data-rtl-mirror={rtlMirror ? "" : undefined}
        aria-hidden={title ? undefined : true}
        role={title ? "img" : undefined}
        {...props}
      >
        {title ? <title>{title}</title> : null}
        {children}
      </svg>
    );
  });

  Icon.displayName = displayName;
  return Icon;
}
