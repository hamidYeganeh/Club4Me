import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  testMatch: "coach-professional-profile.spec.ts",
  workers: 1,
  timeout: 90000,
  expect: { timeout: 15000 },
  reporter: "list",
  use: {
    channel: "chrome",
    baseURL: "http://127.0.0.1:7281",
    locale: "fa-IR",
    timezoneId: "Asia/Tehran",
    actionTimeout: 15000,
    screenshot: "only-on-failure",
  },
  webServer: {
    command:
      "node ../../node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 7281",
    url: "http://127.0.0.1:7281",
    reuseExistingServer: true,
    timeout: 120000,
  },
});
