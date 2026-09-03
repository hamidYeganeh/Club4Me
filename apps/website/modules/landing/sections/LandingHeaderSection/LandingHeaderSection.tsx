"use client";

import { Button } from "@heroui/react";
import { Icon } from "@theme/icon";
import { ThemeToggle } from "@theme/theme-toggle";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { ButtonLink } from "@/components/button-link";
import { cn } from "@/lib/cn";

import { landingHeaderSectionStyles } from "./LandingHeaderSection.styles";

const links = [
  { href: "#programs", key: "classes" as const },
  { href: "#trainers", key: "trainers" as const },
  { href: "#join", key: "membership" as const },
];

export function LandingHeaderSection() {
  const styles = landingHeaderSectionStyles();
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className={styles.root()}>
      <div className={styles.bar()}>
        <a href="#top" className={styles.brand()}>
          <span className={styles.brandMark()}>
            <Icon name="kettlebell" size="md" />
          </span>
          <span className={styles.brandName()}>{t("common.appName")}</span>
        </a>

        <nav className={styles.desktopNav()} aria-label="اصلی">
          {links.map((link) => (
            <a key={link.href} href={link.href} className={styles.desktopLink()}>
              {t(`nav.${link.key}`)}
            </a>
          ))}
        </nav>

        <div className={styles.actions()}>
          <ThemeToggle />
          <ButtonLink size="sm" href="#join" className="hidden lg:inline-flex">
            {t("landing.cta")}
            <span className={styles.ctaIcon()}>
              <Icon name="arrow-forward-1" size="sm" />
            </span>
          </ButtonLink>
          <Button
            isIconOnly
            variant="tertiary"
            aria-label={open ? t("nav.closeMenu") : t("nav.openMenu")}
            aria-expanded={open}
            className={styles.menuButton()}
            onPress={() => setOpen((value) => !value)}
          >
            <Icon name={open ? "close-x" : "hamburger"} size="md" />
          </Button>
        </div>
      </div>

      <div
        className={cn(
          styles.overlay(),
          open ? styles.overlayOpen() : styles.overlayClosed(),
        )}
        hidden={!open}
      >
        <nav className={styles.mobileNav()} aria-label="موبایل">
          {links.map((link, index) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={styles.mobileLink()}
              style={{ transitionDelay: `${index * 60}ms` }}
            >
              {t(`nav.${link.key}`)}
            </a>
          ))}
          <ButtonLink
            size="lg"
            href="#join"
            className={styles.mobileCta()}
            onPress={() => setOpen(false)}
          >
            {t("landing.cta")}
            <span className={styles.mobileCtaIcon()}>
              <Icon name="arrow-forward-1" size="sm" />
            </span>
          </ButtonLink>
        </nav>
      </div>
    </header>
  );
}
