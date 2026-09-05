import type { MetadataRoute } from "next";

import { siteDescription, siteName } from "@/lib/site-metadata";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: `${siteName} | جیم فور می`,
    short_name: siteName,
    description: siteDescription,
    lang: "fa-IR",
    dir: "rtl",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#121212",
    theme_color: "#c6ff4e",
    categories: ["fitness", "health", "sports", "lifestyle"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "کشف باشگاه‌ها",
        short_name: "باشگاه‌ها",
        description: "باشگاه‌های ورزشی نزدیکت را پیدا کن.",
        url: "/discovery/clubs",
      },
      {
        name: "کشف مربی‌ها",
        short_name: "مربی‌ها",
        description: "مربی مناسب هدفت را پیدا کن.",
        url: "/discovery/coaches",
      },
      {
        name: "کلاس‌های ورزشی",
        short_name: "کلاس‌ها",
        description: "کلاس‌های ورزشی را ببین و رزرو کن.",
        url: "/discovery/classes",
      },
    ],
  };
}
