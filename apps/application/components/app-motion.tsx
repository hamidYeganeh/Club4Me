"use client";

import { usePathname } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function AppMotion() {
  const pathname = usePathname();

  useGSAP(
    () => {
      const timer = window.setTimeout(() => {
        const targets = gsap.utils.toArray<HTMLElement>(
          ".app-reveal, .app-scroll-media, .app-stack-card",
        );
        const reduceMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;

        if (targets.length === 0) return;

        if (reduceMotion) {
          gsap.set(targets, { clearProps: "all" });
          return;
        }

        const reveals = gsap.utils.toArray<HTMLElement>(".app-reveal");
        if (reveals.length > 0) {
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
                  scroller: ".app-scroll-root",
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
                scroller: ".app-scroll-root",
                start: "top 94%",
                end: "top 70%",
                scrub: 0.55,
              },
            },
          );
        });
      }, 80);

      return () => window.clearTimeout(timer);
    },
    { dependencies: [pathname], revertOnUpdate: true },
  );

  return null;
}
