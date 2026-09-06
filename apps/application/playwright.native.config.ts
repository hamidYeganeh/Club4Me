import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/native",
  outputDir: "./.tmp/native-test-results",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: "list",
  use: {
    ...devices["Pixel 7"],
    channel: "chrome",
    locale: "fa-IR",
    timezoneId: "Asia/Tehran",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
});
