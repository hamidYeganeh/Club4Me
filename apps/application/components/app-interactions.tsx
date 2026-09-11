"use client";

import { useEffect } from "react";

/** Shared interaction defaults for the web app and Capacitor, including portals. */
export function AppInteractions() {
  useEffect(() => {
    const preventContextMenu = (event: MouseEvent) => event.preventDefault();
    const preventBrowserDrag = (event: DragEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      // Preserve text editing and explicitly implemented drag interactions.
      if (target.closest('input, textarea, [contenteditable]:not([contenteditable="false"]), [draggable="true"]')) {
        return;
      }
      if (target.closest("a, img")) event.preventDefault();
    };

    document.addEventListener("contextmenu", preventContextMenu);
    document.addEventListener("dragstart", preventBrowserDrag);
    return () => {
      document.removeEventListener("contextmenu", preventContextMenu);
      document.removeEventListener("dragstart", preventBrowserDrag);
    };
  }, []);

  return null;
}
