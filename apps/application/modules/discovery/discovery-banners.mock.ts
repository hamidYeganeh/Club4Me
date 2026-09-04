import type { DiscoveryBannerItem } from "@modules/discovery/sections/DiscoveryBannersSection";

const unsplash = (id: string, width = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`;

export const MOCK_DISCOVERY_BANNERS: DiscoveryBannerItem[] = [
  {
    id: "find-club",
    title: "باشگاه مناسب خودت را پیدا کن",
    subtitle: "بهترین باشگاه‌ها و مربی‌ها، یک‌جا و نزدیک تو",
    imageUrl: unsplash("photo-1534438327276-14e7789c4591", 1400),
    actionLabel: "شروع جست‌وجو",
    actionUrl: "/discovery/search",
  },
  {
    id: "pro-coach",
    title: "با مربی حرفه‌ای تمرین کن",
    subtitle: "مربی مناسب هدفت را انتخاب کن",
    imageUrl: unsplash("photo-1571019613454-1cb2f99b2d8b", 1400),
    actionLabel: "مشاهده مربی‌ها",
    actionUrl: "/discovery/coaches",
  },
  {
    id: "classes",
    title: "کلاس‌های گروهی این هفته",
    subtitle: "از یوگا تا کراس‌فیت، ثبت‌نام سریع",
    imageUrl: unsplash("photo-1517836357463-d25dfeac3438", 1400),
    actionLabel: "مشاهده کلاس‌ها",
    actionUrl: "/discovery/classes",
  },
  {
    id: "map",
    title: "باشگاه‌های اطراف تو",
    subtitle: "روی نقشه ببین و نزدیک‌ترین را انتخاب کن",
    imageUrl: unsplash("photo-1571902943202-507ec2618e8f", 1400),
    actionLabel: "باز کردن نقشه",
    actionUrl: "/discovery/map",
  },
];

export function mockDiscoveryBanners(offset = 0, count = 3): DiscoveryBannerItem[] {
  const result: DiscoveryBannerItem[] = [];
  for (let index = 0; index < count; index += 1) {
    const source =
      MOCK_DISCOVERY_BANNERS[
        (offset + index) % MOCK_DISCOVERY_BANNERS.length
      ]!;
    result.push({
      ...source,
      id: `${source.id}-${offset}-${index}`,
    });
  }
  return result;
}

export const MOCK_DISCOVERY_COACH_BANNERS: DiscoveryBannerItem[] = [
  {
    id: "coach-match",
    title: "مربی مناسب هدفت را پیدا کن",
    subtitle: "قدرتی، کاهش وزن، یوگا یا بوکس — کنار حرفه‌ای‌ها تمرین کن",
    imageUrl: unsplash("photo-1571019613454-1cb2f99b2d8b", 1400),
    actionLabel: "شروع جست‌وجو",
    actionUrl: "/discovery/search?type=coach",
  },
  {
    id: "coach-online",
    title: "جلسه آنلاین با مربی",
    subtitle: "از خانه برنامه بگیر و پیشرفت کن",
    imageUrl: unsplash("photo-1517836357463-d25dfeac3438", 1400),
    actionLabel: "مربی‌های آنلاین",
    actionUrl: "/discovery/coaches",
  },
  {
    id: "coach-trial",
    title: "اولین جلسه آزمایشی",
    subtitle: "با مربی منتخب آشنا شو و مسیرت را مشخص کن",
    imageUrl: unsplash("photo-1534438327276-14e7789c4591", 1400),
    actionLabel: "رزرو جلسه",
    actionUrl: "/discovery/coaches",
  },
  {
    id: "coach-club",
    title: "مربی در باشگاه نزدیک تو",
    subtitle: "مربی‌هایی که در باشگاه‌های اطراف فعالیت می‌کنند",
    imageUrl: unsplash("photo-1571902943202-507ec2618e8f", 1400),
    actionLabel: "مشاهده روی نقشه",
    actionUrl: "/discovery/map",
  },
];

export function mockDiscoveryCoachBanners(
  offset = 0,
  count = 3,
): DiscoveryBannerItem[] {
  const result: DiscoveryBannerItem[] = [];
  for (let index = 0; index < count; index += 1) {
    const source =
      MOCK_DISCOVERY_COACH_BANNERS[
        (offset + index) % MOCK_DISCOVERY_COACH_BANNERS.length
      ]!;
    result.push({
      ...source,
      id: `${source.id}-${offset}-${index}`,
    });
  }
  return result;
}
