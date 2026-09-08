type SlugItem = { slug?: string };
type Page<T> = { items?: T[] };

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://api.gym4me.ir/api/v1";
const FALLBACK_SLUG = "unavailable";

export async function getDiscoveryItems<T>(path: string): Promise<T[]> {
  try {
    const response = await fetch(`${API_URL}${path}`, { cache: "no-store" });
    if (!response.ok) return [];
    const body = (await response.json()) as Page<T> & { data?: Page<T> };
    return body.data?.items ?? body.items ?? [];
  } catch {
    return [];
  }
}

export async function getDiscoverySlugParams(
  path: string,
  param: string,
): Promise<Array<Record<string, string>>> {
  const items = await getDiscoveryItems<SlugItem>(path);
  const slugs = items
    .map((item) => item.slug?.trim())
    .filter((slug): slug is string => Boolean(slug));
  return (slugs.length ? slugs : [FALLBACK_SLUG]).map((slug) => ({
    [param]: slug,
  }));
}

export async function getDistrictSlugParams() {
  const [cities, districts] = await Promise.all([
    getDiscoveryItems<SlugItem & { id: string }>(
      "/geography/cities?action=options&limit=100",
    ),
    getDiscoveryItems<SlugItem & { cityId?: string }>(
      "/geography/districts?action=options&limit=100",
    ),
  ]);
  const citySlugById = new Map(
    cities
      .filter((city) => city.slug)
      .map((city) => [city.id, city.slug!] as const),
  );
  const params = districts.flatMap((district) => {
    const cityId = district.cityId;
    const cityIdSlug = cityId ? citySlugById.get(cityId) : undefined;
    return cityIdSlug && district.slug
      ? [{ cityId: cityIdSlug, districtId: district.slug }]
      : [];
  });
  return params.length
    ? params
    : [{ cityId: FALLBACK_SLUG, districtId: FALLBACK_SLUG }];
}

export async function getDiscoveryEntity<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${API_URL}${path}`, { next: { revalidate: 900 } });
    if (!response.ok) return null;
    const body = (await response.json()) as T & { data?: T };
    return body.data ?? body;
  } catch { return null; }
}
