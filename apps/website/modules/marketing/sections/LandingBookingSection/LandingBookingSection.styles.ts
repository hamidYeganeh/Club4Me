import { tv } from "tailwind-variants";

export const landingBookingSectionStyles = tv({
  slots: {
    root: "relative z-0 w-full bg-background px-5 pb-2.5 pt-16 font-sans sm:px-6 md:pt-[140px]",
    inner: "landing-container",
    banner: [
      "relative flex min-h-[220px] flex-col overflow-hidden rounded-2xl",
      "bg-accent p-6 sm:p-10 md:flex-row md:px-[60px] md:py-12",
    ].join(" "),
    squiggle:
      "pointer-events-none absolute inset-0 z-0 size-full text-accent-foreground opacity-[0.08]",
    squiggleSvg: "size-full",
    copyCol: [
      "relative z-10 flex w-full flex-col justify-center",
      "md:w-[45%]",
    ].join(" "),
    title: [
      "text-[28px] font-extrabold leading-[1.2] text-accent-foreground",
      "md:text-[32px]",
    ].join(" "),
    subtitle: [
      "mt-3.5 max-w-[380px] text-[13px] leading-relaxed text-accent-foreground/70",
      "md:text-[14px]",
    ].join(" "),
    ctaWrap: "mt-6",
    cta: [
      "h-auto min-h-0 rounded-full bg-accent-foreground px-7 py-[11px]",
      "text-[14px] font-semibold text-accent shadow-none",
      "transition-colors duration-300 ease-app hover:bg-accent-foreground/90",
      "data-[hovered=true]:bg-accent-foreground/90",
    ].join(" "),
    orbitCol: [
      "relative z-10 hidden h-full min-h-[220px] w-full",
      "md:block md:w-[55%]",
    ].join(" "),
    orbitAvatar: [
      "absolute cursor-pointer overflow-hidden rounded-full border-[3px] border-background",
      "shadow-lg transition-transform duration-300 ease-app hover:scale-110",
    ].join(" "),
    orbitAvatarInner: "size-full! min-h-0 min-w-0",
    stack: "z-10 mt-8 flex flex-wrap md:hidden",
    stackAvatar: [
      "-ms-2 size-12 overflow-hidden rounded-full border-2 border-background",
      "first:ms-0",
    ].join(" "),
    countChip: [
      "-ms-2 flex size-12 items-center justify-center rounded-full",
      "border-2 border-background bg-background/20 text-[12px] font-bold",
      "text-accent-foreground",
    ].join(" "),
  },
});
