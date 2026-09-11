import { tv } from "tailwind-variants";

export const discoveryClubsDetailBodySectionStyles = tv({
  slots: {
    root: "relative z-10 flex flex-col gap-8 bg-background px-4 pb-8 pt-5",
    thumbsSwiper:
      "w-full [&_.swiper-slide-thumb-active]:opacity-100 [&_.swiper-slide]:opacity-55",
    thumbSlide:
      "relative !box-border !h-[5.5rem] cursor-pointer overflow-hidden rounded-[calc(var(--radius)*3)]",
    image: "pointer-events-none object-cover",
    stats: "grid grid-cols-3 gap-3",
    stat: "flex min-w-0 flex-col items-start gap-3 rounded-3xl bg-surface p-4",
    statIcon:
      "flex size-9 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground",
    statText: "min-w-0",
    statValue: "text-base font-extrabold",
    statLabel: "mt-1 text-xs leading-5 text-muted",
    facilitySection: "flex flex-col gap-3",
    facilityHeader: "flex items-center justify-between gap-3",
    facilityTitle: "",
    facilityCarousel: "-mx-4 w-[calc(100%+2rem)] px-4",
    facilitySlide: "!w-auto",
    facilityList: "flex flex-col gap-2.5",
    facilityDetailImage:
      "relative mb-4 aspect-[16/10] w-full overflow-hidden rounded-[18px] bg-surface-secondary",
    facilityDetailImageSrc: "object-cover",
    facilityDetailMeta: "mb-2 text-sm text-muted",
    facilityDetailDescription: "leading-7 text-foreground",
    sports: "flex flex-col gap-3",
    sportsTitle: "",
    sportsList: "grid grid-cols-2 gap-2.5",
    coaches: "flex flex-col gap-3",
    coachesTitle: "",
    coachesList:
      "-mx-5 flex gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
    about: "flex flex-col gap-3 rounded-[2rem] bg-surface p-5",
    aboutTitle: "",
    aboutBody: "leading-7",
    location: "flex flex-col gap-3",
    locationHeader: "flex items-center gap-2 text-foreground",
    locationTitle: "",
    locationCard:
      "overflow-hidden rounded-[calc(var(--radius)*4)] border border-foreground/10 bg-surface shadow-sm",
    locationMap: "min-h-64 rounded-t-[calc(var(--radius)*4)]",
    locationDetails: "px-4 pb-2 pt-4",
    locationInfo: "flex items-center gap-3",
    locationVenueIcon:
      "flex size-12 shrink-0 items-center justify-center rounded-full border border-foreground/10 bg-surface-secondary text-foreground shadow-sm",
    locationText: "min-w-0 flex-1",
    locationName: "truncate text-foreground",
    locationAddress: "mt-0.5 line-clamp-2 leading-6",
    locationDivider: "my-3 h-px bg-foreground/10",
    locationLink:
      "flex min-h-12 w-full items-center justify-center gap-2 rounded-[calc(var(--radius)*2)] text-sm font-semibold text-accent transition-colors hover:bg-accent/10 active:bg-accent/15",
  },
  variants: {
    expanded: {
      true: {
        aboutBody: "leading-7",
      },
      false: {
        aboutBody: "line-clamp-3 leading-7",
      },
    },
  },
  defaultVariants: {
    expanded: false,
  },
});
