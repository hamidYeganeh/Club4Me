import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  testMatch: "panel-usability.spec.ts",
  workers: 1,
  timeout: 90000,
  expect: { timeout: 15000 },
  reporter: "list",
  use: {
    channel: "chrome",
    locale: "fa-IR",
    timezoneId: "Asia/Tehran",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command:
        "node ../../node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 7282",
      cwd: "../admin",
      url: "http://127.0.0.1:7282",
      reuseExistingServer: true,
      timeout: 120000,
    },
    {
      command:
        "node ../../node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 7283",
      url: "http://127.0.0.1:7283",
      reuseExistingServer: true,
      timeout: 120000,
    },
  ],
});
