import type { ArticleCardTag } from "@ui/article-card";

export type DiscoveryArticleItem = {
  id: string;
  title: string;
  description: string;
  coverImageUrl: string;
  authorName: string;
  authorAvatarUrl?: string;
  readTime: string;
  badge?: string;
  tags: ArticleCardTag[];
  href: string;
};

const unsplash = (id: string, width = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`;

export const MOCK_DISCOVERY_ARTICLES: DiscoveryArticleItem[] = [
  {
    id: "warmup-essentials",
    title: "گرم‌کردن درست قبل از تمرین قدرتی",
    description:
      "پنج حرکت ساده برای آماده‌سازی مفصل‌ها و کاهش ریسک آسیب در جلسات وزنه.",
    coverImageUrl: unsplash("photo-1517836357463-d25dfeac3438"),
    authorName: "سارا کاظمی",
    authorAvatarUrl: unsplash("photo-1518611012118-696072aa579a", 200),
    readTime: "۶ دقیقه",
    badge: "تمرین",
    tags: [
      { id: "strength", label: "قدرتی", kind: "category", icon: "weight" },
      { id: "beginner", label: "مبتدی", kind: "type", icon: "star-four" },
    ],
    href: "/articles/warmup-essentials",
  },
  {
    id: "protein-timing",
    title: "زمان‌بندی پروتئین بعد از تمرین",
    description:
      "چه زمانی پروتئین بخوریم تا ریکاوری بهتر و رشد عضله پایدارتر باشد؟",
    coverImageUrl: unsplash("photo-1490645935967-10de6ba17061"),
    authorName: "آرش محمدی",
    authorAvatarUrl: unsplash("photo-1549719386-74dfcbf7dbed", 200),
    readTime: "۸ دقیقه",
    badge: "تغذیه",
    tags: [
      { id: "nutrition", label: "تغذیه", kind: "category", icon: "apple" },
      {
        id: "recovery",
        label: "ریکاوری",
        kind: "type",
        icon: "heart-wellness-1",
      },
    ],
    href: "/articles/protein-timing",
  },
  {
    id: "mobility-desk",
    title: "تحرک برای کارمندان پشت میز",
    description:
      "برنامه کوتاه روزانه برای کاهش خشکی گردن، کمر و لگن در روزهای کاری.",
    coverImageUrl: unsplash("photo-1544367567-0f2fcb009e0b"),
    authorName: "نیلوفر رضایی",
    authorAvatarUrl: unsplash("photo-1594381898411-846e7d193883", 200),
    readTime: "۵ دقیقه",
    badge: "سبک زندگی",
    tags: [
      {
        id: "mobility",
        label: "تحرک",
        kind: "category",
        icon: "person-yoga",
      },
      { id: "office", label: "اداری", kind: "type", icon: "laptop" },
    ],
    href: "/articles/mobility-desk",
  },
  {
    id: "hiit-vs-steady",
    title: "HIIT یا هوازی پیوسته؟",
    description:
      "مقایسه دو روش چربی‌سوزی و انتخاب بهترین گزینه بر اساس سطح و هدف شما.",
    coverImageUrl: unsplash("photo-1571019613454-1cb2f99b2d8b"),
    authorName: "کیان حسینی",
    readTime: "۷ دقیقه",
    badge: "کاردیو",
    tags: [
      {
        id: "cardio",
        label: "کاردیو",
        kind: "category",
        icon: "person-running",
      },
      { id: "fatloss", label: "کاهش وزن", kind: "type", icon: "fire-1" },
    ],
    href: "/articles/hiit-vs-steady",
  },
  {
    id: "sleep-gains",
    title: "خواب؛ بخش فراموش‌شده پیشرفت",
    description:
      "چطور کیفیت خواب روی قدرت، استقامت و انگیزه تمرین اثر می‌گذارد.",
    coverImageUrl: unsplash("photo-1541781774459-bb2af2f05b55"),
    authorName: "مریم احمدی",
    readTime: "۴ دقیقه",
    badge: "ریکاوری",
    tags: [
      {
        id: "recovery",
        label: "ریکاوری",
        kind: "category",
        icon: "heart-wellness-1",
      },
      { id: "sleep", label: "خواب", kind: "type", icon: "moon" },
    ],
    href: "/articles/sleep-gains",
  },
  {
    id: "first-gym-week",
    title: "هفته اول باشگاه بدون سردرگمی",
    description:
      "چک‌لیست شروع برای تازه‌واردها: برنامه، تغذیه، و انتخاب مربی مناسب.",
    coverImageUrl: unsplash("photo-1534438327276-14e7789c4591"),
    authorName: "سارا کاظمی",
    readTime: "۹ دقیقه",
    badge: "راهنما",
    tags: [
      { id: "guide", label: "راهنما", kind: "category", icon: "book-open" },
      { id: "beginner", label: "مبتدی", kind: "type", icon: "star-four" },
    ],
    href: "/articles/first-gym-week",
  },
];

export function mockDiscoveryArticles(
  offset = 0,
  count = 4,
): DiscoveryArticleItem[] {
  const result: DiscoveryArticleItem[] = [];
  for (let index = 0; index < count; index += 1) {
    const source =
      MOCK_DISCOVERY_ARTICLES[
        (offset + index) % MOCK_DISCOVERY_ARTICLES.length
      ]!;
    result.push({
      ...source,
      id: `${source.id}-${offset}-${index}`,
    });
  }
  return result;
}
