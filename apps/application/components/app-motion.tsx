"use client";

import { useEffect } from "react";
import { cubicBezier } from "motion/react";
import { EASE_OUT, MOTION_DURATION, MOTION_STAGGER } from "@/lib/ease";
import { usePathname } from "next/navigation";

export function AppMotion() {
  const pathname = usePathname();
  const isDiscovery = pathname.startsWith("/discovery");

  useEffect(() => {
    // Discovery content arrives in independent queries and changes height while
    // scrolling. Keep it visible instead of hiding it behind stale GSAP triggers.
    if (isDiscovery) return;

    let disposed = false;
    let animationContext: { revert: () => void } | undefined;

    const timer = window.setTimeout(() => {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const hasAnimatedContent = document.querySelector(
        ".app-reveal, .app-scroll-media, .app-stack-card",
      );

      if (reduceMotion || !hasAnimatedContent) {
        return;
      }

      void Promise.all([import("gsap"), import("gsap/ScrollTrigger")])
        .then(([{ default: gsap }, { ScrollTrigger }]) => {
          if (disposed) return;

          gsap.registerPlugin(ScrollTrigger);
          animationContext = gsap.context(() => {
            const scroller = ".app-scroll-root";

            const reveals = gsap.utils.toArray<HTMLElement>(".app-reveal");

            if (reveals.length > 0) {
              gsap.fromTo(
                reveals,
                { autoAlpha: 0, y: 20 },
                {
                  autoAlpha: 1,
                  y: 0,
                  duration: MOTION_DURATION.reveal,
                  stagger: { each: MOTION_STAGGER, amount: 0.2 },
                  ease: cubicBezier(...EASE_OUT),
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
                      scroller,
                      start: "top 92%",
                      end: "center 58%",
                      scrub: 0.7,
                    },
                  },
                );
              });

            gsap.utils
              .toArray<HTMLElement>(".app-stack-card")
              .forEach((card) => {
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
          });
        })
        .catch(() => {
          // Motion is optional; a failed chunk must never block page content.
        });
    }, 80);

    return () => {
      disposed = true;
      window.clearTimeout(timer);
      animationContext?.revert();
    };
  }, [pathname, isDiscovery]);

  return null;
}
