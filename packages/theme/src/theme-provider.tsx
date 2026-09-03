"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useEffect, type ReactNode } from "react";

type ThemeProviderProps = {
  children: ReactNode;
};

const THEME_VT_STYLE_ID = "club4me-theme-vt-css";

const THEME_VT_CSS = `
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}

/* Scoped to AnimatedThemeToggler — the toggler sets the data-attribute and the variable only during a theme toggle. */
html[data-magicui-theme-vt="active"]::view-transition-group(root) {
  animation-duration: var(--magicui-theme-toggle-vt-duration);
}

html[data-magicui-theme-vt="active"]::view-transition-new(root) {
  clip-path: var(--magicui-theme-vt-clip-from);
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
