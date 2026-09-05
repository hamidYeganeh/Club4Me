export function formatClubCityDistrict(
  city?: string | null,
  district?: string | null,
): string | undefined {
  const parts = [city?.trim(), district?.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join("، ") : undefined;
}
