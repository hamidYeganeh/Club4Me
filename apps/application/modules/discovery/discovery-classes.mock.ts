export type DiscoveryClassItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  imageUrl: string;
  deliveryMode: "in_person" | "online" | "hybrid";
  capacity: number;
  enrollmentCount: number;
  price: number;
  sportLabel: string;
  href: string;
};

const unsplash = (id: string, width = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=82`;

/** Temporary mock for discovery class rails. Remove when catalog data is live. */
export const MOCK_DISCOVERY_CLASSES: DiscoveryClassItem[] = [
  {
    id: "hiit-morning",
    slug: "hiit-morning",
    title: "HIIT صبحگاهی",
    description: "تمرین تناوبی شدید برای شروع پرانرژی روز",
    imageUrl: unsplash("photo-1517836357463-d25dfeac3438"),
    deliveryMode: "in_person",
    capacity: 16,
    enrollmentCount: 11,
    price: 890_000,
    sportLabel: "تناوبی",
    href: "/discovery/classes/hiit-morning",
  },
  {
    id: "yoga-flow",
    slug: "yoga-flow",
    title: "یوگا فلوی عصر",
    description: "حرکات کششی و تنفس برای ریکاوری ذهن و بدن",
    imageUrl: unsplash("photo-1544367567-0f2fcb009e0b"),
    deliveryMode: "hybrid",
    capacity: 20,
    enrollmentCount: 14,
    price: 720_000,
    sportLabel: "یوگا",
    href: "/discovery/classes/yoga-flow",
  },
  {
    id: "swim-tech",
    slug: "swim-tech",
    title: "تکنیک شنا",
    description: "اصلاح فرم کرال و افزایش استقامت در آب",
    imageUrl: unsplash("photo-1530549387789-4c1017266635"),
    deliveryMode: "in_person",
    capacity: 8,
    enrollmentCount: 6,
    price: 1_150_000,
    sportLabel: "شنا",
    href: "/discovery/classes/swim-tech",
  },
  {
    id: "boxing-basics",
    slug: "boxing-basics",
    title: "بوکس پایه",
    description: "آموزش گارد، جابه‌جایی و ضربات اصلی",
    imageUrl: unsplash("photo-1549719386-74dfcbf7dbed"),
    deliveryMode: "in_person",
    capacity: 12,
    enrollmentCount: 9,
    price: 980_000,
    sportLabel: "بوکس",
    href: "/discovery/classes/boxing-basics",
  },
  {
    id: "pilates-core",
    slug: "pilates-core",
    title: "پیلاتس مرکزی",
    description: "تقویت عضلات عمقی و بهبود وضعیت بدن",
    imageUrl: unsplash("photo-1518611012118-696072aa579a"),
    deliveryMode: "online",
    capacity: 30,
    enrollmentCount: 22,
    price: 640_000,
    sportLabel: "پیلاتس",
    href: "/discovery/classes/pilates-core",
  },
  {
    id: "spin-night",
    slug: "spin-night",
    title: "اسپینینگ شبانه",
    description: "کلاس دوچرخه با ریتم موسیقی و مربی پرانرژی",
    imageUrl: unsplash("photo-1571019614242-c5c5dee9f50b"),
    deliveryMode: "in_person",
    capacity: 18,
    enrollmentCount: 15,
    price: 810_000,
    sportLabel: "اسپینینگ",
    href: "/discovery/classes/spin-night",
  },
];

export function mockDiscoveryClasses(
  offset = 0,
  count = 6,
): DiscoveryClassItem[] {
  const source = MOCK_DISCOVERY_CLASSES;
  return Array.from({ length: count }, (_, index) => {
    const item = source[(index + offset) % source.length]!;
    return {
      ...item,
      id: `${item.id}-${offset}-${index}`,
    };
  });
}
