import type { CoachCardStat } from "@ui/coach-card";

export type DiscoveryCoachItem = {
  id: string;
  slug: string;
  title: string;
  imageUrl: string;
  supportingText: string;
  badge?: string;
  rating: number;
  reviewsCount: number;
  stats: CoachCardStat[];
  meta: string[];
  authorName?: string;
  authorAvatarUrl?: string;
  href: string;
};

const unsplash = (id: string, width = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=82`;

export const MOCK_DISCOVERY_COACHES: DiscoveryCoachItem[] = [
  {
    id: "niloofar-rezaei",
    slug: "niloofar-rezaei",
    title: "نیلوفر رضایی",
    imageUrl: unsplash("photo-1594381898411-846e7d193883"),
    supportingText: "تمرینات قدرتی و تناوبی",
    badge: "منتخب",
    rating: 4.9,
    reviewsCount: 128,
    stats: [
      { id: "exp", label: "۸ سال تجربه", icon: "medal" },
      { id: "mode", label: "حضوری", icon: "pin-1" },
    ],
    meta: ["قدرتی", "تناوبی"],
    authorName: "باشگاه بام تهران",
    authorAvatarUrl: unsplash("photo-1534438327276-14e7789c4591", 200),
    href: "/discovery/coaches/niloofar-rezaei",
  },
  {
    id: "arash-mohammadi",
    slug: "arash-mohammadi",
    title: "آرش محمدی",
    imageUrl: unsplash("photo-1549719386-74dfcbf7dbed"),
    supportingText: "بوکس و آمادگی جسمانی",
    badge: "حرفه‌ای",
    rating: 4.8,
    reviewsCount: 96,
    stats: [
      { id: "exp", label: "۱۰ سال تجربه", icon: "medal" },
      { id: "mode", label: "حضوری و آنلاین", icon: "sparkle-1" },
    ],
    meta: ["بوکس", "آمادگی"],
    authorName: "باشگاه انرژی",
    href: "/discovery/coaches/arash-mohammadi",
  },
  {
    id: "sara-kazemi",
    slug: "sara-kazemi",
    title: "سارا کاظمی",
    imageUrl: unsplash("photo-1518611012118-696072aa579a"),
    supportingText: "یوگا و حرکات اصلاحی",
    rating: 4.7,
    reviewsCount: 84,
    stats: [
      { id: "exp", label: "۶ سال تجربه", icon: "medal" },
      { id: "mode", label: "آنلاین", icon: "sparkle-1" },
    ],
    meta: ["یوگا", "تحرک"],
    authorName: "استودیو تعادل",
    href: "/discovery/coaches/sara-kazemi",
  },
  {
    id: "kian-hosseini",
    slug: "kian-hosseini",
    title: "کیان حسینی",
    imageUrl: unsplash("photo-1567013127542-490d757e51fc"),
    supportingText: "پاورلیفتینگ و قدرت",
    badge: "تخصصی",
    rating: 4.9,
    reviewsCount: 112,
    stats: [
      { id: "exp", label: "۱۲ سال تجربه", icon: "medal" },
      { id: "mode", label: "حضوری", icon: "pin-1" },
    ],
    meta: ["پاورلیفتینگ", "قدرت"],
    authorName: "باشگاه آهن",
    href: "/discovery/coaches/kian-hosseini",
  },
  {
    id: "mina-rahimi",
    slug: "mina-rahimi",
    title: "مینا رحیمی",
    imageUrl: unsplash("photo-1571019614242-c5c5dee9f50b"),
    supportingText: "کراس‌فیت و استقامت",
    rating: 4.6,
    reviewsCount: 71,
    stats: [
      { id: "exp", label: "۵ سال تجربه", icon: "medal" },
      { id: "mode", label: "حضوری", icon: "pin-1" },
    ],
    meta: ["کراس‌فیت", "استقامت"],
    authorName: "باکس کراس",
    href: "/discovery/coaches/mina-rahimi",
  },
  {
    id: "reza-karimi",
    slug: "reza-karimi",
    title: "رضا کریمی",
    imageUrl: unsplash("photo-1583454110551-21d2d27fd15d"),
    supportingText: "دو و تریل رانینگ",
    badge: "تازه",
    rating: 4.5,
    reviewsCount: 43,
    stats: [
      { id: "exp", label: "۴ سال تجربه", icon: "medal" },
      { id: "mode", label: "آنلاین", icon: "sparkle-1" },
    ],
    meta: ["دویدن", "تریل"],
    authorName: "کلاب ران",
    href: "/discovery/coaches/reza-karimi",
  },
];

export function mockDiscoveryCoaches(
  offset = 0,
  count = 4,
): DiscoveryCoachItem[] {
  const result: DiscoveryCoachItem[] = [];
  for (let index = 0; index < count; index += 1) {
    const source =
      MOCK_DISCOVERY_COACHES[
        (offset + index) % MOCK_DISCOVERY_COACHES.length
      ]!;
    result.push({
      ...source,
      id: `${source.id}-${offset}-${index}`,
    });
  }
  return result;
}
