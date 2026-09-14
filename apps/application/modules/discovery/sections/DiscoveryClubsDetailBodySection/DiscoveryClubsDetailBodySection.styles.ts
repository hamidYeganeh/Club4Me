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
    locationCard: "relative isolate overflow-hidden rounded-[32px] bg-surface",
    locationMap: "h-full min-h-[330px] aspect-[267/257] w-full rounded-[32px]",
    locationDetails:
      "pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end gap-3 bg-linear-to-t from-black via-black/75 to-transparent p-6 pt-16 text-white",
    locationInfo: "min-w-0 flex-1",
    locationVenueIcon: "hidden",
    locationText: "min-w-0 flex-1",
    locationName: "text-xl font-extrabold text-white",
    locationAddress: "mt-1 line-clamp-2 text-white/80! leading-6",
    locationDivider: "hidden",
    locationLink:
      "pointer-events-auto flex size-16 shrink-0 flex-col items-center justify-center gap-1 rounded-[24px] bg-accent p-2 text-center text-[10px] font-bold text-accent-foreground transition-opacity hover:opacity-90",
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
