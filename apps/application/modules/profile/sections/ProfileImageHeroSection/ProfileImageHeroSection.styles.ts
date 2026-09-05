import { tv } from "tailwind-variants";

export const profileImageHeroSectionStyles = tv({
  slots: {
    root: "flex flex-1 flex-col items-center px-6 pt-4",
    title: "max-w-[16rem]",
    avatarWrap:
      "relative mt-14 inline-flex cursor-pointer rounded-full outline-none transition-transform active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-4 focus-visible:ring-offset-background",
    avatar:
      "size-44 overflow-hidden rounded-full bg-accent/15 text-accent transition-opacity [&]:rounded-full",
    avatarFallback: "bg-transparent text-accent",
    uploadProgress:
      "pointer-events-none absolute -inset-2 z-20 size-48 -rotate-90 text-accent",
    uploadProgressTrack: "opacity-20",
    uploadProgressValue:
      "origin-center animate-spin motion-reduce:animate-pulse",
    avatarBadge:
      "size-11 min-w-11 border-4 border-background bg-foreground text-background shadow-lg",
    uploadHint: "mt-5 text-sm font-semibold text-foreground",
  },
});
