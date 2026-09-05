"use client";
import { useOverlayFocus } from "../../lib/use-overlay-focus";

import { BrandText } from "@modules/marketing/components/kit/LineShadowText";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import {
  BrandMark,
  CloseIconButton,
  LandingPillButton,
} from "../../lib/landing-controls";
import { InViewRise } from "../../lib/landing-reveal";
import { useLandingScroll } from "../../lib/landing-scroll";
import { cn } from "../../lib/marketing-cn";
import { landingMenuOverlayStyles } from "./LandingMenuOverlay.styles";
import type { LandingMenuOverlayProps } from "./LandingMenuOverlay.types";

type MenuLink = { label: string; href: string };

export function LandingMenuOverlay({ className }: LandingMenuOverlayProps) {
  const t = useTranslations("MarketingLanding.menu");
  const shared = useTranslations("MarketingLanding.shared");
  const slots = landingMenuOverlayStyles();
  const { menuOpen, closeMenu, scrollTo } = useLandingScroll();
  const panelRef = useRef<HTMLDivElement>(null);
  useOverlayFocus(panelRef, menuOpen, closeMenu);
  const links = t.raw("links") as MenuLink[];

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen, closeMenu]);

  return (
    <div
      className={cn(
        slots.root({ className }),
        !menuOpen && "pointer-events-none",
      )}
      aria-hidden={!menuOpen}
      inert={!menuOpen}
    >
      <button
        type="button"
        className={cn(
          slots.backdrop(),
          "h-auto min-h-0 rounded-none border-0 p-0 shadow-none",
        )}
        style={{ opacity: menuOpen ? 1 : 0 }}
        aria-label={t("closeBackdrop")}
        onClick={closeMenu}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("navAria")}
        className={slots.panel()}
        style={{
          opacity: menuOpen ? 1 : 0,
          transform: menuOpen ? "translateY(0)" : "translateY(-24px)",
        }}
      >
        <div className={slots.top()}>
          <div className={slots.brand()}>
            <BrandMark size={20} instanceId="menu-brand" />
            <BrandText shadow="onBrand" />
          </div>
          <CloseIconButton
            label={shared("close")}
            onPress={closeMenu}
            tone="light"
          />
        </div>

        <nav className={slots.nav()} aria-label={t("navAria")}>
          {menuOpen
            ? links.map((link, i) => (
                <InViewRise key={link.href} delayIn={120 + i * 70} fromY={28}>
                  <a
                    href={link.href}
                    className={slots.link()}
                    onClick={(e) => {
                      e.preventDefault();
                      closeMenu();
                      window.setTimeout(() => scrollTo(link.href), 50);
                    }}
                  >
                    {link.label}
                  </a>
                </InViewRise>
              ))
            : null}
        </nav>

        <div className={slots.bottom()}>
          <LandingPillButton
            variant="light"
            onPress={() => {
              closeMenu();
              window.setTimeout(() => scrollTo("#download"), 120);
            }}
          >
            {t("downloadCta")}
          </LandingPillButton>
          <nav className={slots.social()} aria-label={t("socialAria")}>
            <a href="/support">پشتیبانی</a>
            <a href="/privacy">حریم خصوصی</a>
            <a href="/terms">شرایط استفاده</a>
            <a href="/account-deletion">حذف حساب</a>
          </nav>
        </div>
      </div>
    </div>
  );
}
