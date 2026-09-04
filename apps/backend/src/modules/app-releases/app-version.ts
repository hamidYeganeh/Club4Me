export const APP_PLATFORMS = ["android", "ios"] as const;
export type AppPlatform = (typeof APP_PLATFORMS)[number];

const VERSION_PATTERN = /^\d+\.\d+(?:\.\d+)?$/;

export function isAppVersion(value: string): boolean {
  return VERSION_PATTERN.test(value);
}

export function compareAppVersions(left: string, right: string): number {
  const leftParts = versionParts(left);
  const rightParts = versionParts(right);

  for (let index = 0; index < 3; index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (difference !== 0) return difference > 0 ? 1 : -1;
  }

  return 0;
}

function versionParts(value: string): [number, number, number] {
  if (!isAppVersion(value)) {
    throw new Error(`Invalid app version: ${value}`);
  }

  const [major = 0, minor = 0, patch = 0] = value.split(".").map(Number);
  return [major, minor, patch];
}
