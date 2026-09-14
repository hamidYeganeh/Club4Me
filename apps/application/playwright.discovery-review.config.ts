import { defineConfig } from "@playwright/test";
import base from "./playwright.config";
export default defineConfig({
  ...base,
  webServer: undefined,
  projects: base.projects?.map((project) => ({
    ...project,
    use: { ...project.use, deviceScaleFactor: 1 },
  })),
  timeout: 90000,
  expect: { timeout: 30000 },
  use: { ...base.use, trace: "off", video: "off" },
  testMatch: ["discovery-browse-improvements.spec.ts", "class-design.spec.ts"],
});
