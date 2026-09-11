import { defineConfig } from "@playwright/test";
import base from "./playwright.config";
export default defineConfig({
  ...base,
  timeout: 120000,
  testMatch: "membership-products.spec.ts",
  use: { ...base.use, baseURL: "http://127.0.0.1:7283" },
  webServer: {
    command:
      "node ../../node_modules/next/dist/bin/next dev --webpack --port 7283",
    url: "http://127.0.0.1:7283",
    timeout: 120000,
    reuseExistingServer: false,
    env: {
      ...process.env,
      CLUB4ME_NEXT_DIST_DIR: ".next-competitive",
      NEXT_PUBLIC_API_URL: "http://127.0.0.1:7088/api/v1",
    },
  },
});
