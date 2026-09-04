import { tv } from "tailwind-variants";

export const landingFooterSectionStyles = tv({
  slots: {
    root: "border-t border-separator bg-surface px-4 py-16",
    grid: "mx-auto grid max-w-6xl grid-cols-1 gap-10 md:grid-cols-12",
    brand: "md:col-span-5",
    brandRow: "flex items-center gap-2",
    brandMark:
      "flex size-9 items-center justify-center rounded-full bg-accent text-accent-foreground",
    brandName: "font-brand font-normal text-foreground",
    tagline: "mt-4 max-w-[36ch] text-sm leading-relaxed text-muted",
    nav: "flex flex-col gap-3 text-sm md:col-span-3",
    navLink:
      "text-muted transition-colors duration-300 landing-ease hover:text-foreground",
    contact: "flex flex-col gap-3 text-sm text-muted md:col-span-4",
    contactRow: "flex items-center gap-2",
    contactLink:
      "flex items-center gap-2 transition-colors duration-300 landing-ease hover:text-foreground",
    rights: "mx-auto mt-12 max-w-6xl text-xs text-muted",
  },
});
