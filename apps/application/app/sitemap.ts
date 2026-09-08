import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site-metadata";
import { getDiscoveryItems } from "@/lib/discovery-static-params";

const publicRoutes = [
  "",
  "/discovery",
  "/discovery/clubs",
  "/discovery/coaches",
  "/discovery/classes",
  "/discovery/cities",
  "/discovery/articles",
  "/discovery/map",
  "/articles",
  "/coaches",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  type Entity = { slug: string; updatedAt?: string; geo?: { cityId?: string | null } | null; sportIds?: string[] };
  const [clubs, coaches, classes] = await Promise.all([
    getDiscoveryItems<Entity>("/discovery/catalog/clubs?limit=100"),
    getDiscoveryItems<Entity>("/discovery/catalog/coaches?limit=100"),
    getDiscoveryItems<Entity>("/discovery/catalog/classes?limit=100"),
  ]);
  const dynamic: Array<{ route: string; updatedAt?: string }> = [
    ...clubs.map((item) => ({ route: `/discovery/clubs/${item.slug}`, updatedAt: item.updatedAt })),
    ...coaches.map((item) => ({ route: `/discovery/coaches/${item.slug}`, updatedAt: item.updatedAt })),
    ...classes.map((item) => ({ route: `/discovery/classes/${item.slug}`, updatedAt: item.updatedAt })),
    ...[...new Set(clubs.flatMap((item) => item.geo?.cityId ? [item.geo.cityId] : []))].map((id) => ({ route: `/discovery/city/${id}` })),
    ...[...new Set(clubs.flatMap((item) => item.sportIds ?? []))].map((id) => ({ route: `/discovery/sports/${id}` })),
  ];
  return [...publicRoutes.map((route) => ({
    url: new URL(route || "/", siteUrl).toString(),
    changeFrequency: (route === "" ? "daily" : "weekly") as "daily" | "weekly",
    priority: route === "" ? 1 : route === "/discovery" ? 0.9 : 0.7,
  })), ...dynamic.map((item) => ({ url: new URL(item.route, siteUrl).toString(), lastModified: item.updatedAt ? new Date(item.updatedAt) : undefined, changeFrequency: "weekly" as const, priority: 0.8 }))];
}
