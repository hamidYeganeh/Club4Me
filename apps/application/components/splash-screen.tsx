"use client";

import { useEffect, useState } from "react";
import { Logo } from "@theme/logo";
import { useTranslations } from "next-intl";

import { splashScreenStyles } from "./splash-screen.styles";

const SPLASH_VISIBLE_MS = 1600;
const SPLASH_FADE_MS = 500;

export function SplashScreen() {
  const t = useTranslations("common");
  const [visible, setVisible] = useState(true);
  const [exited, setExited] = useState(false);

  useEffect(() => {
    const hide = window.setTimeout(() => {
      setVisible(false);
    }, SPLASH_VISIBLE_MS);

    return () => window.clearTimeout(hide);
  }, []);

  useEffect(() => {
    if (visible) {
      return;
    }

    const remove = window.setTimeout(() => {
      setExited(true);
    }, SPLASH_FADE_MS);

    return () => window.clearTimeout(remove);
  }, [visible]);

  useEffect(() => {
    if (exited) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [exited]);

  if (exited) {
    return null;
  }

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
