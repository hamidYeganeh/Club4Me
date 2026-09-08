import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const applicationPort = Number(process.env.CLUB4ME_ACCEPTANCE_APP_PORT ?? 7081);
if (
  !Number.isInteger(applicationPort) ||
  applicationPort < 1024 ||
  applicationPort > 65535
)
  throw new Error(
    "CLUB4ME_ACCEPTANCE_APP_PORT must be a valid unprivileged port",
  );
const applicationOrigin = `http://127.0.0.1:${applicationPort}`;

export default defineConfig({
  testDir: "./e2e-fullstack",
  workers: 1,
  retries: 0,
  timeout: 60000,
  expect: { timeout: 12000 },
  reporter: "list",
  use: {
    ...devices["Pixel 7"],
    channel: "chrome",
    baseURL: applicationOrigin,
    locale: "fa-IR",
    timezoneId: "Asia/Tehran",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command:
        "CLUB4ME_FULLSTACK_TEST=1 node ../../node_modules/ts-node/dist/bin.js --compiler @typescript/old --project test/tsconfig.fullstack.json test/fullstack-server.ts",
      cwd: path.resolve(__dirname, "../backend"),
      url: "http://127.0.0.1:7088/__acceptance/fixture",
      reuseExistingServer: process.env.CLUB4ME_ACCEPTANCE_REUSE_API === "1",
      timeout: 120000,
    },
    {
      command:
        process.env.CLUB4ME_ACCEPTANCE_REUSE_BUILD === "1"
          ? `node ../../node_modules/next/dist/bin/next start --port ${applicationPort}`
          : `npm run build && node ../../node_modules/next/dist/bin/next start --port ${applicationPort}`,
      cwd: __dirname,
      url: applicationOrigin,
      reuseExistingServer: false,
      timeout: 240000,
      env: {
        ...process.env,
        NEXT_PUBLIC_API_URL: "http://127.0.0.1:7088/api/v1",
        NEXT_PUBLIC_API_TIMEOUT_MS: "10000",
        NEXT_PUBLIC_APP_RELEASE: "acceptance",
        CLUB4ME_BUILD_NO_CACHE: "1",
      },
    },
  ],
});
