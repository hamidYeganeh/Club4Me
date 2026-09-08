"use client";

import { useEffect, useState } from "react";
import { Logo } from "@theme/logo";
import { useTranslations } from "next-intl";

import { splashScreenStyles } from "./splash-screen.styles";

const SPLASH_VISIBLE_MS = 1600;
const SPLASH_FADE_MS = 500;
const SPLASH_SESSION_KEY = "gym4me.splash.shown";
let shownForEntry = false;

export function SplashScreen() {
  const t = useTranslations("common");
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let hide: number | undefined;
    let remove: number | undefined;
    const show = window.setTimeout(() => {
      if (shownForEntry) return;
      shownForEntry = true;
      try {
        if (window.sessionStorage.getItem(SPLASH_SESSION_KEY) === "1") return;
        window.sessionStorage.setItem(SPLASH_SESSION_KEY, "1");
      } catch {
        /* The entry animation also works without storage. */
      }
      setMounted(true);
      setVisible(true);
      hide = window.setTimeout(() => {
        setVisible(false);
        remove = window.setTimeout(() => setMounted(false), SPLASH_FADE_MS);
      }, SPLASH_VISIBLE_MS);
    }, 0);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
      window.clearTimeout(remove);
    };
  }, []);

  if (!mounted) return null;

  const styles = splashScreenStyles({ visible });

  return (
    <div className={styles.root()} role="status" aria-label={t("appName")}>
      <Logo
        size={96}
        label={t("appName")}
        className={`${styles.logo()} text-surface`}
      />
    </div>
  );
}
