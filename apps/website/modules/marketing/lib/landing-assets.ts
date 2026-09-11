import { statsColors, statsPalette } from "./stats-colors";

const ILLUSTRATIONS = "/assets/images/landing/mock";
const PHONE = "/assets/images/landing/phone";

/** Decorative marketing illustrations, never used as catalog entity photos. */
export const LANDING_ASSETS = {
  hero: `${ILLUSTRATIONS}/hero.png`,
  phone: {
    frameDark: `${PHONE}/phone-frame-dark.png`,
    frameLight: `${PHONE}/phone-frame-light.png`,
    islandDark: `${PHONE}/phone-island-dark.png`,
    islandLight: `${PHONE}/phone-island-light.png`,
  },
  coaches: [
    {
      src: `${ILLUSTRATIONS}/coach-1.png`,
      name: "برنامه تمرین",
      role: "از انتخاب حرکت تا ثبت ست",
      alt: "تصویر معرفی تمرین قدرتی",
    },
    {
      src: `${ILLUSTRATIONS}/coach-2.png`,
      name: "همراه مربی",
      role: "برنامه‌ریزی و بازخورد تمرین",
      alt: "تصویر معرفی مربیگری",
    },
    {
      src: `${ILLUSTRATIONS}/coach-3.png`,
      name: "پیگیری پیشرفت",
      role: "سابقه جلسه و رکورد حرکات",
      alt: "تصویر معرفی فعالیت ورزشی",
    },
  ],
  membership: `${ILLUSTRATIONS}/membership.png`,
  collection: [
    {
      src: `${ILLUSTRATIONS}/collection-1.png`,
      brand: "Gym4Me",
      title: "کلاس‌های باشگاه",
      cta: "مشاهده کلاس‌ها",
      alt: "تجهیزات تمرینی ویژه باشگاه",
    },
    {
      src: `${ILLUSTRATIONS}/collection-2.png`,
      brand: "Gym4Me",
      title: "باشگاه نزدیک تو",
      cta: "دیدن لیست",
      alt: "تمرین فضای باز در نور طلایی",
    },
    {
      src: `${ILLUSTRATIONS}/collection-3.png`,
      brand: "Gym4Me",
      title: "شروع مسیر",
      cta: "دانلود اپ",
      alt: "استودیو آرام برای شروع مسیر",
    },
  ],
  facilities: {
    intro: `${ILLUSTRATIONS}/facility-intro.png`,
    clay: `${ILLUSTRATIONS}/facility-strength.png`,
    harbor: `${ILLUSTRATIONS}/facility-cardio.png`,
  },
} as const;

export const LANDING_SPORT_THEMES = [
  {
    color: "var(--accent)",
    foregroundColor: "var(--accent-foreground)",
    actionColor: "var(--accent-foreground)",
    actionForegroundColor: "var(--accent)",
  },
  ...statsPalette.map((color) => ({
    color,
    foregroundColor: statsColors.foreground,
    actionColor: "var(--eclipse)",
    actionForegroundColor: statsColors.foreground,
  })),
];
