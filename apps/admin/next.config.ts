import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("../../packages/i18n/src/request.ts");

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/api", "@repo/i18n", "@repo/theme", "@repo/ui"],
};

export default withNextIntl(nextConfig);
