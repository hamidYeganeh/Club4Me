import { tv } from "tailwind-variants";

export const profileHeroSectionStyles = tv({
  slots: {
    root: "relative isolate bg-transparent",
    banner:
      "app-scroll-media relative h-[min(42dvh,22rem)] w-full overflow-hidden bg-surface-tertiary after:pointer-events-none after:absolute after:inset-0 after:bg-linear-to-t after:from-background/65 after:via-transparent after:to-black/10",
    cover: "object-cover object-center saturate-75 contrast-110",
    notch: "hidden",
    backButton:
      "absolute end-5 top-[calc(env(safe-area-inset-top)+1rem)] z-[2] border border-white/10 bg-background/72 backdrop-blur-xl",
    overlap:
      "relative z-[2] -mt-[3.875rem] flex items-center justify-between px-[max(1.25rem,calc(18.5%-1.5rem))]",
    sideButton:
      "!size-12 !min-w-12 !rounded-[1.1rem] border border-white/8 bg-background/72 backdrop-blur-xl [&_.icon]:!text-[18px]",
    avatarLink:
      "relative inline-flex rounded-full outline-none focus-visible:ring-2 focus-visible:ring-focus",
    avatar:
      "size-[7.75rem] overflow-hidden rounded-full ring-4 ring-background [&]:rounded-full",
    avatarBadge:
      "size-8 min-w-8 border-2 border-background bg-foreground text-background",
    identity:
      "app-reveal flex flex-col items-center px-5 pt-5 pb-2 text-center",
    badgeIcon: "text-[14px]",
    joined: "mt-3",
    name: "mt-2",
  },
});
