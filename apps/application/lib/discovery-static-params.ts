type SlugItem = { slug?: string };
type Page<T> = { items?: T[] };

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:7088/api/v1";
const FALLBACK_SLUG = "unavailable";

async function getItems<T>(path: string): Promise<T[]> {
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
  const items = await getItems<SlugItem>(path);
  const slugs = items
    .map((item) => item.slug?.trim())
    .filter((slug): slug is string => Boolean(slug));
  return (slugs.length ? slugs : [FALLBACK_SLUG]).map((slug) => ({
    [param]: slug,
  }));
}

export async function getDistrictSlugParams() {
  const [cities, districts] = await Promise.all([
    getItems<SlugItem & { id: string }>(
      "/public/catalog/location/city?limit=100",
    ),
    getItems<SlugItem & { cityId?: string }>(
      "/public/catalog/location/district?limit=100",
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
