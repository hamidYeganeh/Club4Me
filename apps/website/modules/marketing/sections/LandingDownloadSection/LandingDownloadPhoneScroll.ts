"use client";
import { useEffect, type RefObject } from "react";

export function useLandingDownloadPhoneScroll({
  sectionRef,
  viewportRef,
  scrollRef,
  smootherReady,
  reducedMotion,
}: {
  sectionRef: RefObject<HTMLElement | null>;
  viewportRef: RefObject<HTMLDivElement | null>;
  scrollRef: RefObject<HTMLDivElement | null>;
  smootherReady: boolean;
  reducedMotion: boolean;
}) {
  useEffect(() => {
    const section = sectionRef.current;
    const viewport = viewportRef.current;
    const track = scrollRef.current;
    const shell = section?.parentElement;
    if (!section || !viewport || !track || !shell || !smootherReady) return;
    if (reducedMotion) {
      viewport.style.overflowY = "auto";
      return () => {
        viewport.style.removeProperty("overflow-y");
      };
    }
    let frame = 0;
    let overflow = 0;
    let travel = 1;
    const render = () => {
      frame = 0;
      const progress = Math.max(
        0,
        Math.min(1, -shell.getBoundingClientRect().top / travel),
      );
      track.style.transform = `translate3d(0,${-overflow * progress}px,0)`;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };
    const measure = () => {
      overflow = Math.max(0, track.scrollHeight - viewport.clientHeight);
      travel =
        overflow < 8 ? 1 : Math.max(overflow * 1.35, window.innerHeight * 0.85);
      shell.style.setProperty("height", `${section.offsetHeight + travel}px`);
      schedule();
    };
    section.style.position = "sticky";
    section.style.top = "0px";
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(track);
    observer.observe(section);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", measure);
    measure();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", measure);
      shell.style.removeProperty("height");
      section.style.removeProperty("position");
      section.style.removeProperty("top");
      track.style.removeProperty("transform");
    };
  }, [sectionRef, viewportRef, scrollRef, smootherReady, reducedMotion]);
}
