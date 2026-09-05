/** Native, frame-batched equivalent of a scrubbed section animation. */
export function observeScrollProgress(
  element: HTMLElement,
  update: (progress: number) => void,
  startAtTop = false,
) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  let frame = 0;
  const render = () => {
    frame = 0;
    const rect = element.getBoundingClientRect();
    const viewport = startAtTop ? 0 : window.innerHeight;
    update(
      media.matches
        ? 0
        : Math.max(
            0,
            Math.min(
              1,
              (viewport - rect.top) / Math.max(1, rect.height + viewport),
            ),
          ),
    );
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(render);
  };
  const observer = new ResizeObserver(schedule);
  observer.observe(element);
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  media.addEventListener("change", schedule);
  render();
  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
    media.removeEventListener("change", schedule);
  };
}
