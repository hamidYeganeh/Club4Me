import type { Metadata } from "next";
export const siteUrl = new URL(
  process.env.NEXT_PUBLIC_WEBSITE_URL ?? "https://gym4me.ir",
);
export function absoluteUrl(path: string) {
  return new URL(path, siteUrl).toString();
}
export function pageMetadata(
  title: string,
  description: string,
  path: string,
  image?: string | null,
): Metadata {
  const images = image
    ? [{ url: image, alt: title }]
    : [{ url: "/opengraph-image", alt: "Gym4Me — همراه مسیر ورزش تو" }];
  return {
    title: { absolute: title.includes("Gym4Me") ? title : `${title} | Gym4Me` },
    description,
    alternates: { canonical: absoluteUrl(path) },
    openGraph: {
      type: "website",
      locale: "fa_IR",
      siteName: "Gym4Me",
      title,
      description,
      url: absoluteUrl(path),
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images.map((i) => i.url),
    },
  };
}
export function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
