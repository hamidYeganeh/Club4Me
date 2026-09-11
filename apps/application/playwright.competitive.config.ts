import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  testMatch: "competitive-features.spec.ts",
  workers: 1,
  timeout: 60000,
  expect: { timeout: 12000 },
  reporter: "list",
  outputDir: "test-results/competitive-features",
  use: {
    baseURL: "http://127.0.0.1:7181",
    ...devices["Pixel 7"],
    channel: "chrome",
    locale: "fa-IR",
    timezoneId: "Asia/Tehran",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run native:dev -- --port 7181",
    url: "http://127.0.0.1:7181",
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      ...process.env,
      NEXT_PUBLIC_API_URL: "http://127.0.0.1:7088/api/v1",
    },
  },
});
