import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("../../packages/i18n/src/request.ts");

const isCapacitor = process.env.CAPACITOR === "1";

const nextConfig: NextConfig = {
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
