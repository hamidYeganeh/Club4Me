import { defineConfig } from "@playwright/test";
import base from "./playwright.config";
export default defineConfig({
  ...base,
  testMatch: "training*.spec.ts",
  use: { ...base.use, baseURL: "http://127.0.0.1:7094" },
  webServer: {
    command: "node ../../node_modules/next/dist/bin/next dev -p 7094",
    url: "http://127.0.0.1:7094",
    reuseExistingServer: false,
    timeout: 120000,
  },
});
