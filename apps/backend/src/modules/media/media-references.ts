import type { MediaService } from "./media.service";
/** Media expansion goes through the same readiness/privacy rules as public image delivery. */
export async function withMediaReferences<T extends Record<string, unknown>>(
  media: MediaService,
  rows: T[],
) {
  const ids = rows
    .flatMap((row) => [
      row.coverMediaId,
      ...(Array.isArray(row.galleryMediaIds) ? row.galleryMediaIds : []),
    ])
    .filter((id): id is string => typeof id === "string");
  const items = await media.getReadyByIds([...new Set(ids)]);
  const byId = new Map(items.map((item) => [item.id, item]));
  return rows.map((row) => ({
    ...row,
    ...(Object.hasOwn(row, "coverMediaId")
      ? { coverMedia: byId.get(String(row.coverMediaId)) ?? null }
      : {}),
    ...(Array.isArray(row.galleryMediaIds)
      ? {
          galleryMedia: row.galleryMediaIds
            .map((id) => byId.get(String(id)))
            .filter(Boolean),
        }
      : {}),
  }));
}
