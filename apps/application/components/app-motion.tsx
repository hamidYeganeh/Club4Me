"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function AppMotion() {
  const pathname = usePathname();
  const progressRef = useRef<HTMLDivElement>(null);
  const isDiscovery = pathname.startsWith("/discovery");

  useGSAP(
    () => {
      const timer = window.setTimeout(() => {
        const targets = gsap.utils.toArray<HTMLElement>(
          ".app-reveal, .app-scroll-media, .app-stack-card",
        );
        const reduceMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        const discoveryScroller = isDiscovery
          ? document.querySelector<HTMLElement>("main.app-page")
          : null;
        const scroller: HTMLElement | string =
          discoveryScroller ?? ".app-scroll-root";

        if (reduceMotion) {
          gsap.set(targets, { clearProps: "all" });
          if (progressRef.current) {
            gsap.set(progressRef.current, { clearProps: "transform" });
          }
          return;
        }

        if (isDiscovery && progressRef.current) {
          gsap.fromTo(
            progressRef.current,
            { scaleX: 0 },
            {
              scaleX: 1,
              ease: "none",
              scrollTrigger: {
                scroller,
                start: 0,
                end: "max",
                scrub: 0.2,
              },
            },
          );
        }

        const reveals = isDiscovery
          ? gsap.utils.toArray<HTMLElement>(
              "main.app-page > section, main.app-page > .app-reveal, main.app-page > div > section, main.app-page .app-reveal",
            )
          : gsap.utils.toArray<HTMLElement>(".app-reveal");

        if (reveals.length > 0) {
          if (isDiscovery) {
            reveals.forEach((element) => {
              gsap.fromTo(
                element,
                { autoAlpha: 0, y: 18, filter: "blur(8px)" },
                {
                  autoAlpha: 1,
                  y: 0,
                  filter: "blur(0px)",
                  duration: 0.6,
                  ease: "power3.out",
                  scrollTrigger: {
                    trigger: element,
                    scroller,
                    start: "top 88%",
                    toggleActions: "play none none none",
                  },
                },
              );
            });
          } else {
            gsap.fromTo(
              reveals,
              { autoAlpha: 0, y: 20 },
              {
                autoAlpha: 1,
                y: 0,
                duration: 0.55,
                stagger: 0.07,
                ease: "power3.out",
              },
            );
          }
        }

        gsap.utils
          .toArray<HTMLElement>(".app-scroll-media")
          .forEach((media) => {
            gsap.fromTo(
              media,
              { autoAlpha: 0.45, scale: 1.08 },
              {
                autoAlpha: 1,
                scale: 1,
                ease: "none",
                scrollTrigger: {
                  trigger: media,
                  scroller,
                  start: "top 92%",
                  end: "center 58%",
                  scrub: 0.7,
                },
              },
            );
          });

        gsap.utils.toArray<HTMLElement>(".app-stack-card").forEach((card) => {
          gsap.fromTo(
            card,
            { autoAlpha: 0.5, y: 26, scale: 0.97 },
            {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              ease: "none",
              scrollTrigger: {
                trigger: card,
                scroller,
                start: "top 94%",
                end: "top 70%",
                scrub: 0.55,
              },
            },
          );
        });

        ScrollTrigger.refresh();
      }, 80);

      return () => window.clearTimeout(timer);
    },
    { dependencies: [pathname, isDiscovery], revertOnUpdate: true },
  );

  if (!isDiscovery) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-60 mx-auto h-0.75 w-full max-w-xl overflow-hidden"
    >
      <div
        ref={progressRef}
        className="h-full origin-left bg-accent shadow-[0_0_12px_color-mix(in_oklch,var(--accent)_70%,transparent)] rtl:origin-right"
      />
    </div>
  );
}
