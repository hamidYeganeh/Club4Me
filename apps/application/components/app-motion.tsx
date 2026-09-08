"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function AppMotion() {
  const pathname = usePathname();
  const progressRef = useRef<HTMLDivElement>(null);
  const isDiscovery = pathname.startsWith("/discovery");

  useEffect(() => {
    // Discovery content arrives in independent queries and changes height while
    // scrolling. Keep it visible instead of hiding it behind stale GSAP triggers.
    if (isDiscovery) {
      const scroller = document.querySelector<HTMLElement>(".app-scroll-root");
      if (!scroller) return;
      let frame = 0;
      const update = () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          const distance = scroller.scrollHeight - scroller.clientHeight;
          const progress = distance > 0 ? scroller.scrollTop / distance : 0;
          if (progressRef.current) {
            progressRef.current.style.transform = `scaleX(${Math.max(0, Math.min(1, progress))})`;
          }
        });
      };
      const resize = new ResizeObserver(update);
      const observeContent = () => {
        resize.disconnect();
        resize.observe(scroller);
        for (const child of scroller.children) resize.observe(child);
        update();
      };
      const mutations = new MutationObserver(observeContent);
      mutations.observe(scroller, { childList: true });
      scroller.addEventListener("scroll", update, { passive: true });
      observeContent();
      return () => {
        cancelAnimationFrame(frame);
        scroller.removeEventListener("scroll", update);
        mutations.disconnect();
        resize.disconnect();
      };
    }

    let disposed = false;
    let animationContext: { revert: () => void } | undefined;

    const timer = window.setTimeout(() => {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const hasAnimatedContent = document.querySelector(
        ".app-reveal, .app-scroll-media, .app-stack-card",
      );

      if (reduceMotion || (!isDiscovery && !hasAnimatedContent)) {
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

  if (!isDiscovery) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-60 mx-auto h-0.75 w-full max-w-xl overflow-hidden"
    >
      <div
        ref={progressRef}
        className="h-full origin-left bg-accent rtl:origin-right"
      />
    </div>
  );
}
