import { test } from "node:test";
import assert from "node:assert/strict";
import { productionPosthogEnv } from "../posthog-env.mjs";

test("production settings survive regeneration without exposing a personal key", () => {
  assert.deepEqual(productionPosthogEnv({}, {
    POSTHOG_PROJECT_TOKEN: "production-token",
    POSTHOG_HOST: "https://us.i.posthog.com",
    POSTHOG_ENVIRONMENT: "production",
    POSTHOG_PERSONAL_API_KEY: "management-key",
  }), {
    POSTHOG_PROJECT_TOKEN: "production-token",
    POSTHOG_HOST: "https://us.i.posthog.com",
    POSTHOG_ENVIRONMENT: "production",
  });
});

test("development and unlabeled tokens never enter production", () => {
  for (const environment of ["development", "test", undefined]) {
    assert.equal(productionPosthogEnv({
      POSTHOG_PROJECT_TOKEN: "development-token",
      POSTHOG_ENVIRONMENT: environment,
    }).POSTHOG_PROJECT_TOKEN, "");
  }
});

test("an explicitly production input can replace the previous token", () => {
  assert.equal(productionPosthogEnv({
    POSTHOG_PROJECT_TOKEN: "replacement",
    POSTHOG_ENVIRONMENT: "production",
  }, { POSTHOG_PROJECT_TOKEN: "old", POSTHOG_ENVIRONMENT: "production" }).POSTHOG_PROJECT_TOKEN, "replacement");
});
