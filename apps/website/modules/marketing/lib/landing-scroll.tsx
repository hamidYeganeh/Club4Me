"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { applyLandingFontScale } from "./landing-motion";

type LandingScrollApi = {
  ready: boolean;
  setReady: (value: boolean) => void;
  lockScroll: () => void;
  unlockScroll: () => void;
  scrollTo: (hash: string) => void;
  openContact: () => void;
  closeContact: () => void;
  contactOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  menuOpen: boolean;
  smootherReady: boolean;
};
const LandingScrollContext = createContext<LandingScrollApi | null>(null);
export function useLandingScroll() {
  const value = useContext(LandingScrollContext);
  if (!value) throw new Error("LandingScrollProvider is required");
  return value;
}
export function LandingScrollProvider({
  children,
  overlays,
}: {
  children: ReactNode;
  overlays?: ReactNode;
}) {
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [locked, setLocked] = useState(false);
  const lockScroll = useCallback(() => setLocked(true), []);
  const unlockScroll = useCallback(() => setLocked(false), []);
  const openMenu = useCallback(() => setMenuOpen(true), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const openContact = useCallback(() => setContactOpen(true), []);
  const closeContact = useCallback(() => setContactOpen(false), []);
  const scrollTo = useCallback((hash: string) => {
    if (!hash.startsWith("#")) {
      window.location.assign(hash);
      return;
    }
    const target = document.getElementById(hash.slice(1));
    target?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "start",
    });
  }, []);
  useEffect(() => {
    const blocked = menuOpen || contactOpen || (!ready && locked);
    document.documentElement.classList.toggle("landing-scroll-lock", blocked);
    return () =>
      document.documentElement.classList.remove("landing-scroll-lock");
  }, [menuOpen, contactOpen, ready, locked]);
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("landing-page");
    const resize = () => applyLandingFontScale(root);
    resize();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      root.classList.remove("landing-page");
      root.style.removeProperty("font-size");
    };
  }, []);
  const value = useMemo(
    () => ({
      ready,
      setReady,
      lockScroll,
      unlockScroll,
      scrollTo,
      openMenu,
      closeMenu,
      menuOpen,
      openContact,
      closeContact,
      contactOpen,
      smootherReady: ready,
    }),
    [
      ready,
      lockScroll,
      unlockScroll,
      scrollTo,
      openMenu,
      closeMenu,
      menuOpen,
      openContact,
      closeContact,
      contactOpen,
    ],
  );
  return (
    <LandingScrollContext.Provider value={value}>
      <div id="smooth-wrapper" className="landing-smooth-wrapper">
        <div
          id="smooth-content"
          className="landing-smooth-content"
          inert={menuOpen || contactOpen}
        >
          {children}
        </div>
        {overlays}
      </div>
    </LandingScrollContext.Provider>
  );
}
