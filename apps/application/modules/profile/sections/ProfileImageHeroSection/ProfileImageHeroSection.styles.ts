import { tv } from "tailwind-variants";

export const profileImageHeroSectionStyles = tv({
  slots: {
    root: "flex flex-1 flex-col items-center px-6 pt-4",
    title: "max-w-[16rem]",
    avatarWrap: "mt-14",
    avatar: "size-44 overflow-hidden rounded-full bg-accent/15 text-accent [&]:rounded-full",
    avatarFallback: "bg-transparent text-accent",
    actions: "mt-auto flex w-full max-w-sm flex-col gap-4 pb-8",
  },
});
