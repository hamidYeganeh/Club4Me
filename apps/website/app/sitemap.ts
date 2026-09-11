import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import {
  catalogs,
  detailPath,
  listCatalog,
  type CatalogKind,
} from "@/modules/discovery/catalog";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const kinds = Object.keys(catalogs) as CatalogKind[];
  const urls: MetadataRoute.Sitemap = [
    "/",
    "/discovery",
    "/privacy",
    "/terms",
    "/support",
    "/account-deletion",
    ...kinds.map((k) => `/discovery/${k}`),
  ].map((path) => ({ url: absoluteUrl(path) }));
  // Fail the request on catalog outages rather than cache an incomplete sitemap.
  for (const kind of kinds) {
    let page = 1;
    let totalPages = 1;
    do {
      const data = await listCatalog(kind, page, "", 100);
      totalPages = data.totalPages;
      for (const item of data.items) {
        urls.push({ url: absoluteUrl(detailPath(kind, item.slug)) });
      }
      page++;
    } while (page <= totalPages);
  }
  return urls;
}
