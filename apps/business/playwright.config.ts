import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    channel: "chrome",
    baseURL: "http://127.0.0.1:7083",
    locale: "fa-IR",
    timezoneId: "Asia/Tehran",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    cwd: __dirname,
    command:
      process.env.CLUB4ME_BUSINESS_REUSE_BUILD === "1"
        ? "node ../../node_modules/next/dist/bin/next start --port 7083"
        : "npm run build && npm run start",
    url: "http://127.0.0.1:7083",
    timeout: 240_000,
    reuseExistingServer: false,
    env: {
      ...process.env,
      NEXT_PUBLIC_API_URL: "http://127.0.0.1:7088/api/v1",
    },
  },
});
