/** Never promote a development analytics token into the production project. */
export function productionPosthogEnv(input = {}, previous = {}) {
  const source =
    input.POSTHOG_PROJECT_TOKEN && input.POSTHOG_ENVIRONMENT === "production"
      ? input
      : previous.POSTHOG_PROJECT_TOKEN &&
          previous.POSTHOG_ENVIRONMENT === "production"
        ? previous
        : {};
  return {
    POSTHOG_PROJECT_TOKEN: source.POSTHOG_PROJECT_TOKEN || "",
    POSTHOG_HOST: source.POSTHOG_HOST || "https://eu.i.posthog.com",
    POSTHOG_ENVIRONMENT: "production",
  };
}
