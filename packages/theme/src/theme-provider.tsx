"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useEffect, type ReactNode } from "react";

type ThemeProviderProps = {
  children: ReactNode;
};

const THEME_VT_STYLE_ID = "gym4me-theme-vt-css";

const THEME_VT_CSS = `
html[data-magicui-theme-vt="active"]::view-transition-old(root),
html[data-magicui-theme-vt="active"]::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}

html[data-magicui-theme-vt="active"]::view-transition-group(root) {
  animation-duration: var(--magicui-theme-toggle-vt-duration);
}

html[data-magicui-theme-vt="active"]::view-transition-new(root) {
  clip-path: var(--magicui-theme-vt-clip-from);
  animation: magicui-theme-reveal var(--magicui-theme-toggle-vt-duration)
    var(--magicui-theme-vt-easing) both;
}

@keyframes magicui-theme-reveal {
  from {
    clip-path: var(--magicui-theme-vt-clip-from);
  }

  to {
    clip-path: var(--magicui-theme-vt-clip-to);
  }
}
`;

function ensureThemeTransitionStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(THEME_VT_STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = THEME_VT_STYLE_ID;
  style.textContent = THEME_VT_CSS;
  document.head.appendChild(style);
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  useEffect(() => {
    ensureThemeTransitionStyles();
  }, []);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
    >
      {children}
    </NextThemesProvider>
  );
}
