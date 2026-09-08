import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("../../packages/i18n/src/request.ts");

const isCapacitor = process.env.CAPACITOR === "1";

const nextConfig: NextConfig = {
  webpack(config) {
    if (process.env.CLUB4ME_BUILD_NO_CACHE === "1") config.cache = false;
    return config;
  },
  ...(!isCapacitor ? { output: "standalone" as const } : {}),
  transpilePackages: ["@repo/api", "@repo/i18n", "@repo/theme", "@repo/ui"],
  ...(isCapacitor
    ? {
        output: "export" as const,
        trailingSlash: true,
      }
    : {}),
  images: {
    unoptimized: isCapacitor,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
