import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site-metadata";

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

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.map((route) => ({
    url: new URL(route || "/", siteUrl).toString(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : route === "/discovery" ? 0.9 : 0.7,
  }));
}
