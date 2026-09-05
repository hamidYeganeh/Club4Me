import { tv } from "tailwind-variants";

export const landingTestimonialsSectionStyles = tv({
  slots: {
    root: [
      "mt-3 flex w-full items-start justify-center",
      "rounded-(--radius-card-lg) bg-surface px-5 py-16 sm:px-10 sm:py-20",
      "box-border md:min-h-svh",
    ],
    container: "landing-container",
    header: "mb-12 flex flex-col items-center text-center",
    labelRow: "mb-4 inline-flex items-center gap-2",
    darkCircle:
      "flex size-6 items-center justify-center rounded-full bg-foreground",
    limeDot: "text-[10px] leading-none text-accent",
    labelText: "text-xs font-bold tracking-[0.16em] text-foreground uppercase",
    bigHeading: [
      "m-0 mt-2.5 text-center text-[32px] font-semibold leading-[1.1]",
      "tracking-tight text-foreground sm:text-[42px]",
    ],
    grid: [
      "mt-12 grid grid-cols-1 gap-4",
      "min-[601px]:grid-cols-2 min-[901px]:grid-cols-3",
    ],
    card: "relative h-80 overflow-hidden rounded-2xl",
    photoCard: "group cursor-pointer",
    photoImg: [
      "size-full object-cover transition-transform duration-500 ease-app",
      "group-hover:scale-105",
    ],
    reviewOverlay: [
      "pointer-events-none absolute inset-x-5 bottom-5 rounded-xl bg-(--brand-light)",
      "p-4 opacity-100 translate-y-0",
      "transition-all duration-[400ms] ease-[cubic-bezier(0.175,0.885,0.32,1.275)]",
      "[@media(hover:hover)]:translate-y-5 [@media(hover:hover)]:opacity-0",
      "[@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:opacity-100",
    ],
    reviewStars: "mb-1 text-sm text-foreground",
    reviewText: "text-[13px] font-semibold leading-[1.4] text-foreground",
    testimonialCard:
      "box-border flex h-80 flex-col justify-between overflow-hidden rounded-2xl p-8",
    limeCard: "bg-accent text-accent-foreground",
    darkCard: "bg-foreground text-background",
    quoteIconBox: "flex size-10 items-center justify-center rounded-lg",
    quoteIconLime: "bg-foreground",
    quoteIconDark: "bg-accent",
    quoteMark: "text-2xl font-black leading-none",
    quoteMarkLime: "text-background",
    quoteMarkDark: "text-accent-foreground",
    quoteText: [
      "mt-5 grow text-xl font-extrabold leading-[1.25] tracking-tight",
      "uppercase",
    ],
    quoteTextLime: "text-accent-foreground",
    quoteTextDark: "text-background",
    authorRow: "mt-auto flex items-center gap-3",
    avatar: "size-11 rounded-full object-cover",
    avatarLime: "border-2 border-accent-foreground",
    avatarDark: "border-2 border-muted",
    authorMeta: "min-w-0 text-start",
    authorName: "text-[13px] font-extrabold tracking-[0.05em] uppercase",
    authorNameLime: "text-accent-foreground",
    authorNameDark: "text-background",
    authorRole: "text-xs",
    authorRoleLime: "text-accent-foreground/70",
    authorRoleDark: "text-background/55",
  },
});
