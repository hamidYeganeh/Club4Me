import { defineConfig } from "@playwright/test";
import base from "./playwright.config";
export default defineConfig({
  ...base,
  testMatch: /audit-completion\.spec\.ts|product-today\.spec\.ts/,
  use: { ...base.use, baseURL: "http://127.0.0.1:7094" },
  webServer: {
    command: "node ../../node_modules/next/dist/bin/next dev -p 7094",
    url: "http://127.0.0.1:7094",
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      NEXT_PUBLIC_API_URL: "http://127.0.0.1:7088/api/v1",
      NEXT_PUBLIC_API_TIMEOUT_MS: "2000",
    },
  },
});
