import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site-metadata";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/discovery/", "/articles", "/coaches"],
      disallow: [
        "/athlete/",
        "/coach/",
        "/auth/",
        "/welcome/",
        "/club-memberships/",
      ],
    },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
    host: siteUrl.origin,
  };
}
