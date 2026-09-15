import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("../../packages/i18n/src/request.ts");

const nextConfig: NextConfig = {
  ...(process.env.CLUB4ME_BUILD_NO_CACHE === "1"
    ? {
        experimental: {
          turbopackFileSystemCacheForDev: false,
          turbopackFileSystemCacheForBuild: false,
        },
      }
    : {}),
  allowedDevOrigins: ["127.0.0.1"],
  distDir: process.env.CLUB4ME_NEXT_DIST_DIR ?? ".next",
  output: "standalone",
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  transpilePackages: ["@repo/api", "@repo/i18n", "@repo/theme", "@repo/ui"],
};

export default withNextIntl(nextConfig);
