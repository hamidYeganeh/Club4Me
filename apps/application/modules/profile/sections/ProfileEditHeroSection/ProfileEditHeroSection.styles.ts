import { tv } from "tailwind-variants";

export const profileEditHeroSectionStyles = tv({
  slots: {
    root: "relative rounded-b-[3rem] border-b border-white/7 bg-surface/72 px-5 pb-8 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl",
    back: "absolute start-3 top-[max(0.85rem,env(safe-area-inset-top))] z-10 size-11 min-w-11",
    title: "app-reveal mx-auto max-w-[18rem] pt-12",
    avatarWrap: "app-reveal mt-8 flex justify-center",
    avatarLink:
      "relative inline-flex rounded-full outline-none focus-visible:ring-2 focus-visible:ring-focus",
    avatar:
      "size-[6.25rem] overflow-hidden rounded-full bg-accent/20 text-accent [&]:rounded-full",
    avatarFallback: "bg-transparent text-accent",
    avatarBadge:
      "size-7 min-w-7 border-2 border-default bg-foreground text-background",
  },
});
