import { DISCOVERY_CLUBS } from "./discovery.constants";

const unsplash = (id: string, width = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=82`;

export const DISCOVERY_COACHES = [
  {
    id: "niloofar-rezaei",
    name: "نیلوفر رضایی",
    subtitle: "تمرینات قدرتی و تناوبی",
    location: "تهران، سعادت‌آباد",
    rating: "۴٫۹",
    imageUrl: unsplash("photo-1594381898411-846e7d193883"),
    description:
      "مربی تخصصی آمادگی جسمانی با برنامه‌های شخصی‌سازی‌شده برای افزایش قدرت، استقامت و تناسب اندام.",
  },
  {
    id: "arash-mohammadi",
    name: "آرش محمدی",
    subtitle: "بوکس و آمادگی جسمانی",
    location: "تهران، پاسداران",
    rating: "۴٫۸",
    imageUrl: unsplash("photo-1549719386-74dfcbf7dbed"),
    description:
      "مربی بوکس و بدنسازی با تمرکز بر تکنیک، چابکی و آمادگی برای مسابقه.",
  },
  {
    id: "sara-kazemi",
    name: "سارا کاظمی",
    subtitle: "یوگا و حرکات اصلاحی",
    location: "تهران، ونک",
    rating: "۴٫۷",
    imageUrl: unsplash("photo-1518611012118-696072aa579a"),
    description:
      "مربی یوگا و تحرک برای بهبود انعطاف، تعادل و کاهش دردهای ناشی از کم‌تحرکی.",
  },
] as const;

export const DISCOVERY_CLASSES = [
  {
    id: "functional-morning",
    title: "فانکشنال صبحگاهی",
    subtitle: "باشگاه بام تهران · نیلوفر رضایی",
    meta: "شنبه و دوشنبه · ۸:۰۰",
    imageUrl: unsplash("photo-1534438327276-14e7789c4591"),
    description:
      "تمرین گروهی پرفشار برای افزایش استقامت و قدرت عمومی بدن، مناسب سطح متوسط.",
  },
  {
    id: "boxing-evening",
    title: "بوکس مقدماتی",
    subtitle: "باشگاه انرژی · آرش محمدی",
    meta: "یکشنبه و سه‌شنبه · ۱۸:۳۰",
    imageUrl: unsplash("photo-1549719386-74dfcbf7dbed"),
    description:
      "آموزش اصول پایه بوکس، گارد، جابه‌جایی و ضربات برای هنرجویان تازه‌کار.",
  },
  {
    id: "sunset-yoga",
    title: "یوگای غروب",
    subtitle: "استودیو تعادل · سارا کاظمی",
    meta: "شنبه تا چهارشنبه · ۱۹:۰۰",
    imageUrl: unsplash("photo-1544367567-0f2fcb009e0b"),
    description:
      "کلاس آرام یوگا برای رهایی از فشار روزانه و افزایش انعطاف و تمرکز.",
  },
] as const;

export const DISCOVERY_CATEGORIES = {
  sports: [
    {
      id: "bodybuilding",
      title: "بدنسازی",
      subtitle: "تمرین قدرتی و عضله‌سازی",
      imageUrl: unsplash("photo-1581009146145-b5ef050c2e1e"),
    },
    {
      id: "boxing",
      title: "بوکس",
      subtitle: "رزمی و آمادگی جسمانی",
      imageUrl: unsplash("photo-1549719386-74dfcbf7dbed"),
    },
    {
      id: "yoga",
      title: "یوگا",
      subtitle: "تعادل، تمرکز و انعطاف",
      imageUrl: unsplash("photo-1544367567-0f2fcb009e0b"),
    },
  ],
  "club-types": [
    {
      id: "gym",
      title: "باشگاه بدنسازی",
      subtitle: "تجهیزات قدرتی و هوازی",
      imageUrl: unsplash("photo-1534438327276-14e7789c4591"),
    },
    {
      id: "studio",
      title: "استودیو ورزشی",
      subtitle: "کلاس‌های تخصصی و گروهی",
      imageUrl: unsplash("photo-1518611012118-696072aa579a"),
    },
    {
      id: "pool",
      title: "استخر",
      subtitle: "شنا و ورزش‌های آبی",
      imageUrl: unsplash("photo-1530549387789-4c1017266635"),
    },
  ],
  regions: [
    {
      id: "north",
      title: "شمال تهران",
      subtitle: "باشگاه‌های شمال شهر",
      imageUrl: unsplash("photo-1517836357463-d25dfeac3438"),
    },
    {
      id: "center",
      title: "مرکز تهران",
      subtitle: "باشگاه‌های مرکز شهر",
      imageUrl: unsplash("photo-1571902943202-507ec2618e8f"),
    },
    {
      id: "west",
      title: "غرب تهران",
      subtitle: "باشگاه‌های غرب شهر",
      imageUrl: unsplash("photo-1571019614242-c5c5dee9f50b"),
    },
    {
      id: "east",
      title: "شرق تهران",
      subtitle: "باشگاه‌های شرق شهر",
      imageUrl: unsplash("photo-1540497077202-7c8a3999166f"),
    },
  ],
} as const;

export const DISCOVERY_SEARCH_ITEMS = [
  ...DISCOVERY_CLUBS.map((item) => ({
    id: item.id,
    title: item.name,
    subtitle: item.location,
    imageUrl: item.images[0]!,
    kind: "باشگاه",
    href: `/discovery/clubs/${item.id}`,
  })),
  ...DISCOVERY_COACHES.map((item) => ({
    id: item.id,
    title: item.name,
    subtitle: item.subtitle,
    imageUrl: item.imageUrl,
    kind: "مربی",
    href: `/discovery/coaches/${item.id}`,
  })),
  ...DISCOVERY_CLASSES.map((item) => ({
    id: item.id,
    title: item.title,
    subtitle: item.subtitle,
    imageUrl: item.imageUrl,
    kind: "کلاس",
    href: `/discovery/classes/${item.id}`,
  })),
];
