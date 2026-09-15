import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("../../packages/i18n/src/request.ts");

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  ...(process.env.CLUB4ME_BUILD_NO_CACHE === "1"
    ? {
        experimental: {
          turbopackFileSystemCacheForDev: false,
          turbopackFileSystemCacheForBuild: false,
        },
      }
    : {}),
  output: "standalone",
  transpilePackages: ["@repo/api", "@repo/i18n", "@repo/theme", "@repo/ui"],
};

export default withNextIntl(nextConfig);
