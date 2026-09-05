"use client";
import { useEffect, type RefObject } from "react";

export function useOverlayFocus(
  ref: RefObject<HTMLDivElement | null>,
  open: boolean,
  close: () => void,
) {
  useEffect(() => {
    if (!open) return;
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const panel = ref.current;
    if (!panel) return;
    const focusable = () =>
      Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input, textarea, [tabindex="0"]',
        ),
      ).filter(
        (element) =>
          !element.closest("[inert]") && element.getClientRects().length > 0,
      );
    const frame = requestAnimationFrame(() => focusable()[0]?.focus());
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
      if (event.key !== "Tab") return;
      const items = focusable(),
        first = items[0],
        last = items.at(-1);
      if (!first || !last) {
        event.preventDefault();
        return;
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    panel.addEventListener("keydown", keydown);
    return () => {
      cancelAnimationFrame(frame);
      panel.removeEventListener("keydown", keydown);
      requestAnimationFrame(() => previous?.focus());
    };
  }, [ref, open, close]);
}
