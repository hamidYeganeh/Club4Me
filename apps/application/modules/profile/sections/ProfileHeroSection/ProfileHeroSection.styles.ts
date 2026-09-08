import { tv } from "tailwind-variants";

export const profileHeroSectionStyles = tv({
  slots: {
    root: "relative isolate shrink-0 mx-4 mt-[max(1rem,env(safe-area-inset-top))] min-h-96 overflow-hidden rounded-[2rem] bg-surface",
    banner: "absolute inset-0 overflow-hidden bg-surface-tertiary",
    cover: "object-cover object-center ",
    notch: "hidden",
    backButton:
      "absolute end-5 top-[calc(env(safe-area-inset-top)+1rem)] z-[2] border border-white/10 bg-background/72 backdrop-blur-xl",
    overlap:
      "relative z-[2] mt-24 flex items-center justify-between px-[max(1.25rem,calc(18.5%-1.5rem))]",
    sideButton:
      "!size-12 !min-w-12 !rounded-[1.1rem] border border-border bg-background [&_.icon]:!text-[18px]",
    avatarLink:
      "relative inline-flex rounded-full outline-none focus-visible:ring-2 focus-visible:ring-focus",
    avatar:
      "size-[7.75rem] overflow-hidden rounded-full ring-4 ring-surface [&]:rounded-full",
    avatarBadge:
      "size-8 min-w-8 border-2 border-background bg-foreground text-background",
    identity:
      "relative z-[2] flex flex-col items-center px-5 pt-4 pb-6 text-center",
    badgeIcon: "text-[14px]",
    joined: "mt-3 !text-white/90",
    name: "mt-2 text-2xl leading-9 font-extrabold text-white",
  },
});
