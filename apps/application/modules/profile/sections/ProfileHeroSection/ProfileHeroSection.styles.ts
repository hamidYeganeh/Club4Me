import { tv } from "tailwind-variants";

export const profileHeroSectionStyles = tv({
  slots: {
    root: "relative isolate bg-background",
    banner:
      "relative h-[min(42dvh,22rem)] w-full overflow-hidden bg-surface-tertiary",
    cover: "object-cover object-center grayscale contrast-125",
    notch:
      "pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-20 bg-background [mask-composite:intersect] [mask-image:radial-gradient(circle_1.7rem_at_18.5%_100%,transparent_98%,#000_100%),radial-gradient(circle_4.25rem_at_50%_100%,transparent_98%,#000_100%),radial-gradient(circle_1.7rem_at_81.5%_100%,transparent_98%,#000_100%)] [-webkit-mask-composite:source-in] [-webkit-mask-image:radial-gradient(circle_1.7rem_at_18.5%_100%,transparent_98%,#000_100%),radial-gradient(circle_4.25rem_at_50%_100%,transparent_98%,#000_100%),radial-gradient(circle_1.7rem_at_81.5%_100%,transparent_98%,#000_100%)]",
    overlap:
      "relative z-[2] -mt-[3.875rem] flex items-center justify-between px-[max(1.25rem,calc(18.5%-1.5rem))]",
    sideButton:
      "!size-12 !min-w-12 shadow-[0_10px_24px_color-mix(in_oklch,var(--foreground)_14%,transparent)] [&_.icon]:!text-[18px]",
    avatarLink:
      "relative inline-flex rounded-full outline-none focus-visible:ring-2 focus-visible:ring-focus",
    avatar: "size-[7.75rem] overflow-hidden rounded-full ring-4 ring-background [&]:rounded-full",
    avatarBadge:
      "size-8 min-w-8 border-2 border-background bg-foreground text-background",
    identity: "flex flex-col items-center px-5 pt-5 pb-2 text-center",
    badgeIcon: "text-[14px]",
    joined: "mt-3",
    name: "mt-2",
  },
});
