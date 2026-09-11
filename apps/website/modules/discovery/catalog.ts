import "server-only";
import { cache } from "react";
import type {
  DiscoveryArticleItem,
  PublicCatalogArticle,
  PublicCatalogClass,
  PublicCatalogClub,
  PublicCatalogCoach,
  PublicCatalogPage,
} from "@api/domains/discovery/discovery.dto";

export const catalogs = {
  clubs: {
    title: "باشگاه‌ها",
    singular: "باشگاه",
    description:
      "باشگاه‌های ورزشی را بشناس؛ موقعیت، ساعت فعالیت، امکانات و کلاس‌های هر باشگاه را بررسی کن.",
  },
  classes: {
    title: "کلاس‌های ورزشی",
    singular: "کلاس",
    description:
      "کلاس‌ها را با توجه به زمان برگزاری، ظرفیت، پیش‌نیاز و هزینه مقایسه کن و برای ثبت‌نام وارد اپ شو.",
  },
  coaches: {
    title: "مربی‌ها",
    singular: "مربی",
    description:
      "تخصص، سابقه و شیوه تمرین مربی‌ها را ببین و مربی مناسب مسیر ورزشی خودت را انتخاب کن.",
  },
  articles: {
    title: "مقالات ورزشی",
    singular: "مقاله",
    description:
      "مقاله‌های منتشرشده درباره ورزش و تمرین را بخوان؛ همراه با نام نویسنده و تاریخ انتشار.",
  },
} as const;
export type CatalogKind = keyof typeof catalogs;
export function isCatalogKind(value: string): value is CatalogKind {
  return value in catalogs && Object.hasOwn(catalogs, value);
}
export type CatalogTypes = {
  clubs: PublicCatalogClub;
  classes: PublicCatalogClass;
  coaches: PublicCatalogCoach;
  articles: PublicCatalogArticle;
};
export type Entry = {
  id: string;
  slug: string;
  title: string;
  description: string;
  image: string | null;
  label?: string;
};
export function entry(
  kind: CatalogKind,
  item: CatalogTypes[CatalogKind] | DiscoveryArticleItem,
): Entry {
  if ("name" in item)
    return {
      id: item.id,
      slug: item.slug,
      title: item.name,
      description: item.shortDescription,
      image: item.imageUrl,
      label: item.address,
    };
  if ("displayName" in item)
    return {
      id: item.id,
      slug: item.slug,
      title: item.displayName,
      description: item.shortBio,
      image: item.imageUrl,
      label: item.experienceYears
        ? `${item.experienceYears.toLocaleString("fa-IR")} سال سابقه`
        : "پروفایل مربی",
    };
  if ("excerpt" in item)
    return {
      id: item.id,
      slug: item.slug,
      title: item.title,
      description: item.excerpt,
      image: item.coverImageUrl,
      label: item.authorName,
    };
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    description: item.description,
    image: item.imageUrl,
    label: item.deliveryMode === "online" ? "کلاس آنلاین" : "کلاس ورزشی",
  };
}
export function detailPath(kind: CatalogKind, slug: string) {
  return `/discovery/${kind}/${encodeURIComponent(slug)}`;
}
export class CatalogUnavailable extends Error {
  constructor() {
    super("Public catalog unavailable");
  }
}
async function request<T>(path: string): Promise<T | null> {
  const base =
    process.env.CATALOG_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "https://api.gym4me.ir/api/v1";
  let response: Response;
  try {
    response = await fetch(
      `${base.replace(/\/$/, "")}/discovery/catalog/${path}`,
      {
        next: { revalidate: 300 },
        signal: AbortSignal.timeout(10000),
        headers: { Accept: "application/json" },
      },
    );
  } catch {
    throw new CatalogUnavailable();
  }
  if (response.status === 404) return null;
  if (!response.ok) throw new CatalogUnavailable();
  const payload = await response.json();
  if (payload && typeof payload === "object" && "data" in payload)
    return payload.data as T;
  return payload as T;
}
export const listCatalog = cache(
  async <K extends CatalogKind>(
    kind: K,
    page = 1,
    q = "",
    limit = 12,
    clubId = "",
  ): Promise<PublicCatalogPage<CatalogTypes[K]>> => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (q) params.set("q", q);
    if (clubId) params.set("clubId", clubId);
    const result = await request<PublicCatalogPage<CatalogTypes[K]>>(
      `${kind}?${params}`,
    );
    if (!result || !Array.isArray(result.items)) throw new CatalogUnavailable();
    return result;
  },
);
export const getCatalog = cache(
  async <K extends CatalogKind>(kind: K, slug: string) =>
    request<CatalogTypes[K]>(`${kind}/${encodeURIComponent(slug)}`),
);
export function pageNumber(value: string | string[] | undefined) {
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? Math.min(n, 10000) : 1;
}
export function searchText(value: string | string[] | undefined) {
  return typeof value === "string" ? value.trim().slice(0, 120) : "";
}
export function dateLabel(value?: string | null) {
  if (!value || Number.isNaN(Date.parse(value))) return "";
  return new Date(value).toLocaleDateString("fa-IR", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
