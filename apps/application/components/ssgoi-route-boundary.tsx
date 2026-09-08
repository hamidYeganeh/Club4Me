"use client";

import { type ReactNode } from "react";
import { usePathname } from "next/navigation";

type SsgoiRouteBoundaryProps = {
  children: ReactNode;
};

function normalizePathname(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

export function SsgoiRouteBoundary({ children }: SsgoiRouteBoundaryProps) {
  const pathname = normalizePathname(usePathname());

  return (
    <div
      key={pathname}
      data-ssgoi-transition={pathname}
      data-bottom-navigation={
        ["/athlete", "/coach", "/discovery"].includes(pathname)
          ? "true"
          : undefined
      }
      className="flex h-full min-h-full flex-col bg-background"
    >
      {children}
    </div>
  );
}
