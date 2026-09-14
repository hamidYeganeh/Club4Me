"use client";

import { Children, useEffect, useRef, useState, type ReactNode } from "react";

/** Defer mounts near the viewport and release offscreen trees while preserving measured space. */
export function DiscoveryViewport({
  children,
  estimate = 320,
  virtual = false,
}: {
  children: ReactNode;
  estimate?: number;
  virtual?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [height, setHeight] = useState(estimate);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (!("IntersectionObserver" in window)) {
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          if (!virtual) observer.disconnect();
        } else if (virtual && !element.contains(document.activeElement))
          setVisible(false);
      },
      { rootMargin: "800px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [virtual]);
  useEffect(() => {
    const element = ref.current;
    if (!element || !visible) return;
    const observer = new ResizeObserver(() => {
      const measured = element.getBoundingClientRect().height;
      if (measured > 0) setHeight(measured);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [visible]);
  return (
    <div
      ref={ref}
      className="min-w-0"
      style={!visible ? { height } : undefined}
    >
      {visible ? (
        children
      ) : (
        <div
          aria-hidden="true"
          className="h-full rounded-[32px] bg-surface/30"
        />
      )}
    </div>
  );
}

export function DiscoveryVirtualItems({ children }: { children: ReactNode }) {
  return Children.map(children, (child) =>
    child ? (
      <DiscoveryViewport virtual estimate={240}>
        {child}
      </DiscoveryViewport>
    ) : null,
  );
}
