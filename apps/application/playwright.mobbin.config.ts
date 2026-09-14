import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

/** Lightweight screenshots for the complete application design inventory. */
export default defineConfig({
  ...base,
  testMatch: ["all-routes-design.spec.ts", "mobbin-ux.spec.ts"],
  fullyParallel: true,
  workers: 2,
  timeout: 180_000,
  expect: { timeout: 90_000 },
  webServer: process.env.PLAYWRIGHT_BASE_URL ? [] : base.webServer,
  use: {
    ...base.use,
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? base.use?.baseURL,
    trace: "off",
    video: "off",
  },
  projects: base.projects?.map((project) => ({
    ...project,
    use: { ...project.use, deviceScaleFactor: 1 },
  })),
});
